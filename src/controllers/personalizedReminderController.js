const {
    scheduleArrivalCardReminder,
    scheduleTravelChecklistReminder,
    processDuePersonalizedReminders
} = require("../services/personalizedReminderService");

const scheduleArrivalCard = async (req, res) => {
    try {
        const bookingIdentifier = String(req.body.booking_id || req.body.pnr_reference || "").trim();
        if (!bookingIdentifier) {
            return res.status(400).json({ error: "booking_id or pnr_reference is required" });
        }

        const job = await scheduleArrivalCardReminder(bookingIdentifier);
        return res.status(201).json({
            message: job.status === "SENT"
                ? "The arrival card reminder was already sent"
                : "Arrival card reminder scheduled",
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

const scheduleTravelChecklist = async (req, res) => {
    try {
        const bookingIdentifier = String(req.body.booking_id || req.body.pnr_reference || "").trim();
        if (!bookingIdentifier) {
            return res.status(400).json({ error: "booking_id or pnr_reference is required" });
        }

        const forceResend = req.body.force_resend === true || req.body.forceResend === true;
        const job = await scheduleTravelChecklistReminder(bookingIdentifier, { forceResend });
        if (new Date(job.due_at).getTime() <= Date.now()) {
            await processDuePersonalizedReminders();
        }
        return res.status(201).json({
            message: job.status === "SENT"
                ? "The travel checklist reminder was already sent"
                : "Travel checklist reminder scheduled",
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

module.exports = {
    scheduleArrivalCard,
    scheduleTravelChecklist
};
