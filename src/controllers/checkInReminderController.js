const {
    scheduleCheckInReminder,
    scheduleCheckInWhatsAppReminder
} = require("../services/checkInReminderService");

const getBookingIdentifier = (body) =>
    String(body.booking_id || body.pnr_reference || "").trim();

const scheduleEmail = async (req, res) => {
    try {
        const bookingIdentifier = getBookingIdentifier(req.body);
        if (!bookingIdentifier) {
            return res.status(400).json({ error: "booking_id or pnr_reference is required" });
        }
        const job = await scheduleCheckInReminder(bookingIdentifier);
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
        const bookingIdentifier = getBookingIdentifier(req.body);
        if (!bookingIdentifier) {
            return res.status(400).json({ error: "booking_id or pnr_reference is required" });
        }
        const job = await scheduleCheckInWhatsAppReminder(bookingIdentifier);
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
