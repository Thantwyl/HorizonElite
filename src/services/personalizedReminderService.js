const pool = require("../config/db");
const {
    sendArrivalCardReminderEmail,
    sendTravelChecklistReminderEmail
} = require("./emailSenderService");
const {
    getArrivalCardRequirements
} = require("./travelRequirementsService");

const SCAN_INTERVAL_MS = Math.max(
    60_000,
    Number(process.env.PERSONALIZED_REMINDER_SCAN_INTERVAL_MS || 60_000)
);
const MAX_ATTEMPTS = 5;
let workerStarted = false;

const createScheduleQuery = ({ tableName, dueAtExpression }) => `
    INSERT INTO ${tableName} (
        booking_id,
        recipient_email,
        due_at
    )
    SELECT
        b.booking_id,
        COALESCE(NULLIF(b.user_email_address, ''), p.pi_contact_email),
        ${dueAtExpression}
    FROM bookings b
    INNER JOIN selected_flights sf
        ON sf.selected_flight_id = b.selected_flight_id
    INNER JOIN booking_passengers bp
        ON bp.booking_id = b.booking_id
    INNER JOIN passengers p
        ON p.passenger_id = bp.passenger_id
    WHERE (b.booking_id::text = $1 OR UPPER(b.pnr_reference) = UPPER($1))
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
            WHEN ${tableName}.status = 'SENT' AND $2 = FALSE
            THEN ${tableName}.due_at
            ELSE EXCLUDED.due_at
        END,
        status = CASE
            WHEN ${tableName}.status = 'SENT' AND $2 = FALSE
            THEN 'SENT'
            ELSE 'PENDING'
        END,
        attempts = CASE
            WHEN $2 = TRUE THEN 0
            ELSE ${tableName}.attempts
        END,
        sent_at = CASE
            WHEN $2 = TRUE THEN NULL
            ELSE ${tableName}.sent_at
        END,
        last_error = CASE
            WHEN $2 = TRUE THEN NULL
            ELSE ${tableName}.last_error
        END,
        updated_at = LOCALTIMESTAMP
    RETURNING *
`;

const scheduleArrivalCardReminder = async (bookingId) => {
    const result = await pool.query(`
        INSERT INTO arrival_card_reminder_jobs (
            booking_id,
            recipient_email,
            due_at
        )
        SELECT
            b.booking_id,
            COALESCE(NULLIF(b.user_email_address, ''), p.pi_contact_email),
            CASE
                WHEN sf.arrival_datetime - INTERVAL '3 days' <= LOCALTIMESTAMP
                THEN LOCALTIMESTAMP
                ELSE sf.arrival_datetime - INTERVAL '3 days'
            END
        FROM bookings b
        INNER JOIN selected_flights sf
            ON sf.selected_flight_id = b.selected_flight_id
        INNER JOIN booking_passengers bp
            ON bp.booking_id = b.booking_id
        INNER JOIN passengers p
            ON p.passenger_id = bp.passenger_id
        WHERE (b.booking_id::text = $1 OR UPPER(b.pnr_reference) = UPPER($1))
          AND b.record_active = TRUE
          AND b.booking_status = 'TICKETED'
          AND b.ticketing_status = 'TICKETED'
          AND sf.arrival_datetime > LOCALTIMESTAMP
          AND COALESCE(NULLIF(b.user_email_address, ''), p.pi_contact_email) IS NOT NULL
        ORDER BY bp.passenger_id
        LIMIT 1
        ON CONFLICT (booking_id) DO UPDATE SET
            recipient_email = EXCLUDED.recipient_email,
            due_at = CASE
                WHEN arrival_card_reminder_jobs.status = 'SENT'
                THEN arrival_card_reminder_jobs.due_at
                ELSE EXCLUDED.due_at
            END,
            status = CASE
                WHEN arrival_card_reminder_jobs.status = 'SENT'
                THEN 'SENT'
                ELSE 'PENDING'
            END,
            updated_at = LOCALTIMESTAMP
        RETURNING *
    `, [bookingId]);

    if (result.rows.length === 0) {
        const error = new Error(
            "Only an active, ticketed, future booking with an email address can receive arrival card reminders"
        );
        error.statusCode = 409;
        throw error;
    }

    return result.rows[0];
};

const scheduleTravelChecklistReminder = async (bookingId, { forceResend = false } = {}) => {
    const result = await pool.query(createScheduleQuery({
        tableName: "travel_checklist_reminder_jobs",
        dueAtExpression: `
            CASE
                WHEN sf.departure_datetime - INTERVAL '7 days' <= LOCALTIMESTAMP
                THEN LOCALTIMESTAMP
                ELSE sf.departure_datetime - INTERVAL '7 days'
            END
        `
    }), [bookingId, forceResend]);

    if (result.rows.length === 0) {
        const error = new Error(
            "Only an active, ticketed, future booking with an email address can receive travel checklist reminders"
        );
        error.statusCode = 409;
        throw error;
    }

    return result.rows[0];
};

const getPersonalizedReminderDetails = async (bookingId, reminderName) => {
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
            sf.arrival_datetime,
            p.pi_first_name,
            p.pi_last_name,
            p.pi_nationality AS nationality,
            p.pi_passport_issuing_country AS nationality_code
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
        throw new Error(`Booking details were not found for the ${reminderName} reminder`);
    }
    return result.rows[0];
};

const sendArrivalCardReminderForJob = async (job) => {
    const booking = await getPersonalizedReminderDetails(job.booking_id, "arrival card");
    const arrival = new Date(booking.arrival_datetime);

    if (
        !booking.record_active ||
        booking.booking_status !== "TICKETED" ||
        booking.ticketing_status !== "TICKETED" ||
        arrival.getTime() <= Date.now()
    ) {
        const error = new Error("Booking is no longer eligible for an arrival card reminder");
        error.permanent = true;
        throw error;
    }

    let requirement;
    try {
        requirement = await getArrivalCardRequirements(booking);
    } catch (error) {
        console.error("Arrival card requirements lookup failed:", error.message);
        requirement = {
            provider: "fallback",
            headline: "We could not retrieve destination-specific arrival-card rules, so please check the official arrival-card rules for your destination.",
            forms: []
        };
    }

    await sendArrivalCardReminderEmail({
        to: job.recipient_email,
        passengerName: booking.pi_first_name,
        pnr: booking.pnr_reference,
        airlineName: booking.airline_name,
        flightNumber: booking.flight_number,
        origin: booking.origin_airport_code,
        destination: booking.destination_airport_code,
        arrival: booking.arrival_datetime,
        requirement
    });
};

const sendTravelChecklistReminderForJob = async (job) => {
    const booking = await getPersonalizedReminderDetails(job.booking_id, "travel checklist");
    const departure = new Date(booking.departure_datetime);

    if (
        !booking.record_active ||
        booking.booking_status !== "TICKETED" ||
        booking.ticketing_status !== "TICKETED" ||
        departure.getTime() <= Date.now()
    ) {
        const error = new Error("Booking is no longer eligible for a travel checklist reminder");
        error.permanent = true;
        throw error;
    }

    await sendTravelChecklistReminderEmail({
        to: job.recipient_email,
        passengerName: booking.pi_first_name,
        pnr: booking.pnr_reference,
        airlineName: booking.airline_name,
        flightNumber: booking.flight_number,
        origin: booking.origin_airport_code,
        destination: booking.destination_airport_code,
        departure: booking.departure_datetime
    });
};

const processReminderTable = async ({ tableName, label, sender }) => {
    await pool.query(`
        UPDATE ${tableName}
        SET status = 'PENDING', updated_at = LOCALTIMESTAMP
        WHERE status = 'SENDING'
          AND updated_at < LOCALTIMESTAMP - INTERVAL '15 minutes'
          AND attempts < $1
    `, [MAX_ATTEMPTS]);

    const jobs = await pool.query(`
        SELECT *
        FROM ${tableName}
        WHERE status = 'PENDING'
          AND due_at <= LOCALTIMESTAMP
          AND attempts < $1
        ORDER BY due_at
        LIMIT 10
    `, [MAX_ATTEMPTS]);

    for (const job of jobs.rows) {
        const claimed = await pool.query(`
            UPDATE ${tableName}
            SET status = 'SENDING', attempts = attempts + 1,
                updated_at = LOCALTIMESTAMP
            WHERE job_id = $1 AND status = 'PENDING'
            RETURNING *
        `, [job.job_id]);
        if (claimed.rows.length === 0) continue;

        try {
            await sender(claimed.rows[0]);
            await pool.query(`
                UPDATE ${tableName}
                SET status = 'SENT', sent_at = LOCALTIMESTAMP,
                    last_error = NULL, updated_at = LOCALTIMESTAMP
                WHERE job_id = $1
            `, [job.job_id]);
        } catch (error) {
            console.error(`${label} reminder failed:`, error.message);
            await pool.query(`
                UPDATE ${tableName}
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

const processDuePersonalizedReminders = async () => {
    await processReminderTable({
        tableName: "arrival_card_reminder_jobs",
        label: "Arrival card",
        sender: sendArrivalCardReminderForJob
    });
    await processReminderTable({
        tableName: "travel_checklist_reminder_jobs",
        label: "Travel checklist",
        sender: sendTravelChecklistReminderForJob
    });
};

const startPersonalizedReminderWorker = () => {
    if (workerStarted) return;
    workerStarted = true;

    processDuePersonalizedReminders().catch(error =>
        console.error("Personalized reminder worker failed:", error.message)
    );
    const timer = setInterval(() => {
        processDuePersonalizedReminders().catch(error =>
            console.error("Personalized reminder worker failed:", error.message)
        );
    }, SCAN_INTERVAL_MS);
    timer.unref();
};

module.exports = {
    scheduleArrivalCardReminder,
    scheduleTravelChecklistReminder,
    processDuePersonalizedReminders,
    startPersonalizedReminderWorker
};
