const {
    scheduleCheckInReminder,
    scheduleCheckInWhatsAppReminder
} = require("../services/checkInReminderService");

const isValidBookingId = (bookingId) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId);

const scheduleEmail = async (req, res) => {
    try {
        const bookingId = String(req.body.booking_id || "").trim();
        if (!isValidBookingId(bookingId)) {
            return res.status(400).json({ error: "A valid booking_id is required" });
        }
        const job = await scheduleCheckInReminder(bookingId);
        return res.status(201).json({
            message: job.status === "SENT"
                ? "The check-in reminder email was already sent"
                : "Check-in reminder email scheduled",
            data: {
                booking_id: job.booking_id,
                recipient_email: job.recipient_email,
                due_at: job.due_at,
                status: job.status
            }
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.message
        });
    }
};

const scheduleWhatsApp = async (req, res) => {
    try {
        const bookingId = String(req.body.booking_id || "").trim();
        if (!isValidBookingId(bookingId)) {
            return res.status(400).json({ error: "A valid booking_id is required" });
        }
        const job = await scheduleCheckInWhatsAppReminder(bookingId);
        return res.status(201).json({
            message: job.status === "SENT"
                ? "The check-in WhatsApp reminder was already sent"
                : "Check-in WhatsApp reminder scheduled",
            data: {
                booking_id: job.booking_id,
                recipient_phone: job.recipient_phone,
                due_at: job.due_at,
                status: job.status
            }
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.message
        });
    }
};

module.exports = { scheduleEmail, scheduleWhatsApp };
