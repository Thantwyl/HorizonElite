const whatsappService = require("../services/whatsappService");

const configStatus = (req, res) => {
    res.json({
        message: "WhatsApp configuration status",
        data: whatsappService.getConfigStatus(),
    });
};

const sendCheckInReminder = async (req, res) => {
    try {
        const delivery = await whatsappService.sendCheckInReminder(req.body || {});
        res.json({
            message: "WhatsApp check-in reminder accepted by Meta Cloud API",
            data: delivery,
        });
    } catch (error) {
        res.status(error.status || error.response?.status || 400).json({
            error: error.message,
            details: error.response?.data,
        });
    }
};

module.exports = {
    configStatus,
    sendCheckInReminder,
};
