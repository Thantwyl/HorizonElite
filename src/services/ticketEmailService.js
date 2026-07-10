const pool = require("../config/db");

const ticketService = require("./ticketService");

const {
    sendTicketEmail
} = require("./emailSenderService");

const TICKET_EMAIL_DELAY_MINUTES = Number(
    process.env.TICKET_EMAIL_DELAY_MINUTES || 0
);

let workerStarted = false;

const createTicketEmailJobTable = async () => {

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ticket_email_jobs (
            job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            booking_id UUID NOT NULL UNIQUE,
            recipient_email VARCHAR(100) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            attempts INTEGER NOT NULL DEFAULT 0,
            due_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            sent_at TIMESTAMP,
            last_error TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
        )
    `);

};

const getTicketRecipient = async (bookingId) => {

    const result =
        await pool.query(
            `
            SELECT
                b.booking_id,
                b.pnr_reference,
                b.booking_status,
                b.ticketing_status,
                p.pi_contact_email
            FROM bookings b
            INNER JOIN booking_passengers bp
                ON bp.booking_id = b.booking_id
            INNER JOIN passengers p
                ON p.passenger_id = bp.passenger_id
            WHERE b.booking_id = $1
            ORDER BY bp.passenger_id
            LIMIT 1
            `,
            [bookingId]
        );

    if (result.rows.length === 0) {
        throw new Error("Booking recipient not found for ticket email");
    }

    return result.rows[0];

};

const scheduleTicketEmail = async (bookingId) => {

    await createTicketEmailJobTable();

    const booking =
        await getTicketRecipient(bookingId);

    if (
        booking.booking_status !== "TICKETED" ||
        booking.ticketing_status !== "TICKETED"
    ) {
        return null;
    }

    const result =
        await pool.query(
            `
            INSERT INTO ticket_email_jobs (
                booking_id,
                recipient_email,
                status,
                attempts,
                due_at,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2,
                'PENDING',
                0,
                LOCALTIMESTAMP + ($3 || ' minutes')::INTERVAL,
                LOCALTIMESTAMP,
                LOCALTIMESTAMP
            )
            ON CONFLICT (booking_id)
            DO UPDATE SET
                recipient_email = EXCLUDED.recipient_email,
                status = CASE
                    WHEN ticket_email_jobs.status = 'SENT'
                    THEN ticket_email_jobs.status
                    ELSE 'PENDING'
                END,
                due_at = CASE
                    WHEN ticket_email_jobs.status = 'SENT'
                    THEN ticket_email_jobs.due_at
                    ELSE EXCLUDED.due_at
                END,
                updated_at = LOCALTIMESTAMP
            RETURNING *
            `,
            [
                bookingId,
                booking.pi_contact_email,
                TICKET_EMAIL_DELAY_MINUTES
            ]
        );

    return result.rows[0];

};

const sendTicketEmailForJob = async (job) => {

    const booking =
        await getTicketRecipient(job.booking_id);

    if (
        booking.booking_status !== "TICKETED" ||
        booking.ticketing_status !== "TICKETED"
    ) {
        throw new Error("Booking is not ticketed yet");
    }

    const pdfBuffer =
        await ticketService.generateTicket(job.booking_id);

    await sendTicketEmail({
        to: job.recipient_email,
        pnr: booking.pnr_reference,
        pdfBuffer
    });

};

const sendTicketEmailNow = async (bookingId) => {

    const booking =
        await getTicketRecipient(bookingId);

    if (
        booking.booking_status !== "TICKETED" ||
        booking.ticketing_status !== "TICKETED"
    ) {
        throw new Error("Booking is not ticketed yet");
    }

    const pdfBuffer =
        await ticketService.generateTicket(bookingId);

    await sendTicketEmail({
        to: booking.pi_contact_email,
        pnr: booking.pnr_reference,
        pdfBuffer
    });

    return {
        recipient_email: booking.pi_contact_email,
        pnr_reference: booking.pnr_reference
    };

};

const processDueTicketEmails = async () => {

    await createTicketEmailJobTable();

    const jobs =
        await pool.query(
            `
            SELECT *
            FROM ticket_email_jobs
            WHERE status = 'PENDING'
            AND due_at <= LOCALTIMESTAMP
            AND attempts < 5
            ORDER BY due_at ASC
            LIMIT 10
            `
        );

    for (const job of jobs.rows) {

        try {

            await pool.query(
                `
                UPDATE ticket_email_jobs
                SET
                    status = 'SENDING',
                    attempts = attempts + 1,
                    updated_at = LOCALTIMESTAMP
                WHERE job_id = $1
                `,
                [job.job_id]
            );

            await sendTicketEmailForJob(job);

            await pool.query(
                `
                UPDATE ticket_email_jobs
                SET
                    status = 'SENT',
                    sent_at = LOCALTIMESTAMP,
                    updated_at = LOCALTIMESTAMP,
                    last_error = NULL
                WHERE job_id = $1
                `,
                [job.job_id]
            );

        }
        catch(error) {

            console.error(
                "Ticket email send failed:",
                error.message
            );

            await pool.query(
                `
                UPDATE ticket_email_jobs
                SET
                    status = CASE
                        WHEN attempts + 1 >= 5 THEN 'FAILED'
                        ELSE 'PENDING'
                    END,
                    last_error = $1,
                    due_at = LOCALTIMESTAMP + INTERVAL '5 minutes',
                    updated_at = LOCALTIMESTAMP
                WHERE job_id = $2
                `,
                [
                    error.message,
                    job.job_id
                ]
            );

        }

    }

};

const startTicketEmailWorker = () => {

    if (workerStarted) {
        return;
    }

    workerStarted = true;

    processDueTicketEmails().catch(error => {
        console.error("Ticket email worker failed:", error.message);
    });

    setInterval(() => {
        processDueTicketEmails().catch(error => {
            console.error("Ticket email worker failed:", error.message);
        });
    }, 60 * 1000);

};

module.exports = {
    createTicketEmailJobTable,
    scheduleTicketEmail,
    sendTicketEmailNow,
    processDueTicketEmails,
    startTicketEmailWorker
};
