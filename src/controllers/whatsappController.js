const whatsappService = require("../services/whatsappService");

const configStatus = (req, res) => {
    res.json({
        message: "WhatsApp configuration status",
        data: whatsappService.getConfigStatus(),
    });
};

const verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
};

const receiveWebhook = (req, res) => {
    const entries = req.body?.entry || [];

    entries.forEach((entry) => {
        const changes = entry.changes || [];

        changes.forEach((change) => {
            const value = change.value || {};
            const statuses = value.statuses || [];
            const messages = value.messages || [];

            statuses.forEach((status) => {
                console.log("[WhatsApp] Message status", {
                    message_id: status.id,
                    recipient_id: status.recipient_id,
                    status: status.status,
                    timestamp: status.timestamp,
                    conversation_id: status.conversation?.id,
                    error: status.errors?.[0],
                });
            });

            messages.forEach((message) => {
                console.log("[WhatsApp] Incoming message", {
                    from: message.from,
                    id: message.id,
                    type: message.type,
                    timestamp: message.timestamp,
                });
            });
        });
    });

    res.sendStatus(200);
};

const sendCheckInReminder = async (req, res) => {
    try {
        const delivery = await whatsappService.sendCheckInReminder(req.body || {});
        console.log("[WhatsApp] Check-in reminder accepted", {
            recipient_phone: delivery.recipient_phone,
            template_name: delivery.template_name,
            message_id: delivery.meta_response?.messages?.[0]?.id,
            message_status: delivery.meta_response?.messages?.[0]?.message_status,
        });
        res.json({
            message: "WhatsApp check-in reminder accepted by Meta Cloud API",
            data: delivery,
        });
    } catch (error) {
        const metaError = error.response?.data?.error;
        const message = metaError?.message
            ? `WhatsApp Cloud API error: ${metaError.message}`
            : error.message;

        console.error("[WhatsApp] Check-in reminder failed", {
            status: error.status || error.response?.status,
            message,
            details: error.response?.data,
        });

        res.status(error.status || error.response?.status || 400).json({
            error: message,
            details: error.response?.data,
        });
    }
};

module.exports = {
    configStatus,
    verifyWebhook,
    receiveWebhook,
    sendCheckInReminder,
};
