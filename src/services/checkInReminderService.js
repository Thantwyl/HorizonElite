const pool = require("../config/db");
const {
    sendCheckInReminderEmail
} = require("./emailSenderService");

const SCAN_INTERVAL_MS = Math.max(
    60_000,
    Number(process.env.CHECK_IN_REMINDER_SCAN_INTERVAL_MS || 60_000)
);
const MAX_ATTEMPTS = 5;
let workerStarted = false;

const scheduleCheckInReminder = async (bookingId) => {
    const result = await pool.query(`
        INSERT INTO check_in_reminder_jobs (
            booking_id,
            recipient_email,
            due_at
        )
        SELECT
            b.booking_id,
            COALESCE(NULLIF(b.user_email_address, ''), p.pi_contact_email),
            sf.departure_datetime - INTERVAL '4 days'
        FROM bookings b
        INNER JOIN selected_flights sf
            ON sf.selected_flight_id = b.selected_flight_id
        INNER JOIN booking_passengers bp
            ON bp.booking_id = b.booking_id
        INNER JOIN passengers p
            ON p.passenger_id = bp.passenger_id
        WHERE b.booking_id = $1
          AND b.record_active = TRUE
          AND b.booking_status = 'TICKETED'
          AND b.ticketing_status = 'TICKETED'
          AND sf.departure_datetime > LOCALTIMESTAMP
          AND COALESCE(NULLIF(b.user_email_address, ''), p.pi_contact_email) IS NOT NULL
        ORDER BY bp.passenger_id
        LIMIT 1
        ON CONFLICT (booking_id) DO UPDATE SET
            recipient_email = EXCLUDED.recipient_email,
            due_at = CASE
                WHEN check_in_reminder_jobs.status = 'SENT'
                THEN check_in_reminder_jobs.due_at
                ELSE EXCLUDED.due_at
            END,
            status = CASE
                WHEN check_in_reminder_jobs.status = 'SENT'
                THEN 'SENT'
                ELSE 'PENDING'
            END,
            updated_at = LOCALTIMESTAMP
        RETURNING *
    `, [bookingId]);

    if (result.rows.length === 0) {
        const error = new Error(
            "Only an active, ticketed, future booking with an email address can receive reminders"
        );
        error.statusCode = 409;
        throw error;
    }

    return result.rows[0];
};

const getReminderDetails = async (bookingId) => {
    const result = await pool.query(`
        SELECT
            b.booking_id,
            b.pnr_reference,
            b.booking_status,
            b.ticketing_status,
            b.record_active,
            sf.airline_name,
            sf.flight_number,
            sf.origin_airport_code,
            sf.destination_airport_code,
            sf.departure_datetime,
            p.pi_first_name,
            p.pi_last_name
        FROM bookings b
        INNER JOIN selected_flights sf
            ON sf.selected_flight_id = b.selected_flight_id
        INNER JOIN booking_passengers bp
            ON bp.booking_id = b.booking_id
        INNER JOIN passengers p
            ON p.passenger_id = bp.passenger_id
        WHERE b.booking_id = $1
        ORDER BY bp.passenger_id
        LIMIT 1
    `, [bookingId]);

    if (result.rows.length === 0) {
        throw new Error("Booking details were not found for the check-in reminder");
    }
    return result.rows[0];
};

const sendReminderForJob = async (job) => {
    const booking = await getReminderDetails(job.booking_id);
    const departure = new Date(booking.departure_datetime);

    if (
        !booking.record_active ||
        booking.booking_status !== "TICKETED" ||
        booking.ticketing_status !== "TICKETED" ||
        departure.getTime() <= Date.now()
    ) {
        const error = new Error("Booking is no longer eligible for a check-in reminder");
        error.permanent = true;
        throw error;
    }

    const frontendUrl = String(process.env.FRONTEND_URL || "http://localhost:5173")
        .replace(/\/$/, "");

    await sendCheckInReminderEmail({
        to: job.recipient_email,
        passengerName: booking.pi_first_name,
        passengerLastName: booking.pi_last_name,
        pnr: booking.pnr_reference,
        airlineName: booking.airline_name,
        flightNumber: booking.flight_number,
        origin: booking.origin_airport_code,
        destination: booking.destination_airport_code,
        departure: booking.departure_datetime,
        checkInUrl: `${frontendUrl}/check-in`
    });
};

const processDueReminders = async () => {
    await pool.query(`
        UPDATE check_in_reminder_jobs
        SET status = 'PENDING', updated_at = LOCALTIMESTAMP
        WHERE status = 'SENDING'
          AND updated_at < LOCALTIMESTAMP - INTERVAL '15 minutes'
          AND attempts < $1
    `, [MAX_ATTEMPTS]);

    const jobs = await pool.query(`
        SELECT *
        FROM check_in_reminder_jobs
        WHERE status = 'PENDING'
          AND due_at <= LOCALTIMESTAMP
          AND attempts < $1
        ORDER BY due_at
        LIMIT 10
    `, [MAX_ATTEMPTS]);

    for (const job of jobs.rows) {
        const claimed = await pool.query(`
            UPDATE check_in_reminder_jobs
            SET status = 'SENDING', attempts = attempts + 1,
                updated_at = LOCALTIMESTAMP
            WHERE job_id = $1 AND status = 'PENDING'
            RETURNING *
        `, [job.job_id]);
        if (claimed.rows.length === 0) continue;

        try {
            await sendReminderForJob(claimed.rows[0]);
            await pool.query(`
                UPDATE check_in_reminder_jobs
                SET status = 'SENT', sent_at = LOCALTIMESTAMP,
                    last_error = NULL, updated_at = LOCALTIMESTAMP
                WHERE job_id = $1
            `, [job.job_id]);
        } catch (error) {
            console.error("Check-in reminder email failed:", error.message);
            await pool.query(`
                UPDATE check_in_reminder_jobs
                SET status = CASE
                        WHEN $1 OR attempts >= $2 THEN 'FAILED'
                        ELSE 'PENDING'
                    END,
                    last_error = $3,
                    due_at = CASE
                        WHEN $1 OR attempts >= $2 THEN due_at
                        ELSE LOCALTIMESTAMP + INTERVAL '5 minutes'
                    END,
                    updated_at = LOCALTIMESTAMP
                WHERE job_id = $4
            `, [Boolean(error.permanent), MAX_ATTEMPTS, error.message, job.job_id]);
        }
    }
};

const startCheckInReminderWorker = () => {
    if (workerStarted) return;
    workerStarted = true;

    processDueReminders().catch(error =>
        console.error("Check-in reminder worker failed:", error.message)
    );
    const timer = setInterval(() => {
        processDueReminders().catch(error =>
            console.error("Check-in reminder worker failed:", error.message)
        );
    }, SCAN_INTERVAL_MS);
    timer.unref();
};

module.exports = {
    scheduleCheckInReminder,
    processDueReminders,
    startCheckInReminderWorker
};
