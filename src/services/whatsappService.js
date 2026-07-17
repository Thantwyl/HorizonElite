const axios = require("axios");

const requiredConfigKeys = [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_BUSINESS_ACCOUNT_ID",
];

const getConfigStatus = () => ({
    api_version: process.env.WHATSAPP_API_VERSION || "v25.0",
    configured: requiredConfigKeys.every((key) => Boolean(process.env[key])),
    missing: requiredConfigKeys.filter((key) => !process.env[key]),
    phone_number_id_present: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    business_account_id_present: Boolean(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID),
    access_token_present: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
    template_name: process.env.WHATSAPP_TEMPLATE_NAME || null,
    template_language: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
});

const assertConfigured = () => {
    const status = getConfigStatus();

    if (!status.configured) {
        const error = new Error(`WhatsApp Cloud API is not configured. Missing: ${status.missing.join(", ")}.`);
        error.status = 503;
        throw error;
    }
};

const normalizeWhatsAppNumber = (phoneNumber) => String(phoneNumber || "").replace(/[^\d]/g, "");

const formatFlightDateTime = (value) => {
    if (!value) return "your scheduled departure time";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const buildCheckInReminderMessage = ({
    passengerName,
    pnrReference,
    flightNumber,
    origin,
    destination,
    departureDatetime,
}) => [
    `Hello ${passengerName || "traveler"}, this is your Horizon Elite check-in reminder.`,
    `Flight: ${flightNumber || "your flight"} (${origin || "origin"} to ${destination || "destination"})`,
    `Departure: ${formatFlightDateTime(departureDatetime)}`,
    `Booking reference: ${pnrReference || "not available"}`,
    "Please prepare your travel documents and complete online check-in when it opens.",
].join("\n");

const getCheckInReminderTemplateParameters = ({
    passengerName,
    pnrReference,
    flightNumber,
    origin,
    destination,
    departureDatetime,
}) => [
    passengerName || "traveler",
    flightNumber || "your flight",
    origin || "origin",
    destination || "destination",
    formatFlightDateTime(departureDatetime),
    pnrReference || "not available",
].map((text) => ({
    type: "text",
    text,
}));

const getTemplateComponents = () => {
    if (!process.env.WHATSAPP_TEMPLATE_COMPONENTS_JSON) return undefined;

    try {
        return JSON.parse(process.env.WHATSAPP_TEMPLATE_COMPONENTS_JSON);
    } catch (error) {
        const configError = new Error("WHATSAPP_TEMPLATE_COMPONENTS_JSON must be valid JSON.");
        configError.status = 500;
        throw configError;
    }
};

const buildTextPayload = ({ recipient, body }) => ({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: {
        preview_url: false,
        body,
    },
});

const buildTemplatePayload = ({ recipient, parameters }) => {
    const configuredComponents = getTemplateComponents();
    const shouldUseGeneratedParameters =
        process.env.WHATSAPP_TEMPLATE_NAME === "flight_check_in_reminder" ||
        process.env.WHATSAPP_TEMPLATE_INCLUDE_PARAMETERS === "true";
    const generatedComponents = shouldUseGeneratedParameters && parameters?.length
        ? [
            {
                type: "body",
                parameters,
            },
        ]
        : undefined;
    const components = configuredComponents || generatedComponents;

    return {
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
            name: process.env.WHATSAPP_TEMPLATE_NAME,
            language: {
                code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
            },
            ...(components ? { components } : {}),
        },
    };
};

const sendMessage = async ({ to, body, parameters }) => {
    assertConfigured();

    const recipient = normalizeWhatsAppNumber(to);
    if (!recipient) {
        const error = new Error("A valid WhatsApp recipient phone number is required.");
        error.status = 400;
        throw error;
    }

    if (!body) {
        const error = new Error("WhatsApp message body is required.");
        error.status = 400;
        throw error;
    }

    const apiVersion = process.env.WHATSAPP_API_VERSION || "v25.0";
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const useTemplate = Boolean(process.env.WHATSAPP_TEMPLATE_NAME);
    const payload = useTemplate
        ? buildTemplatePayload({ recipient, parameters })
        : buildTextPayload({ recipient, body });

    const response = await axios.post(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
        }
    );

    return {
        recipient_phone: recipient,
        message_type: useTemplate ? "template" : "text",
        template_name: process.env.WHATSAPP_TEMPLATE_NAME || null,
        meta_response: response.data,
    };
};

const sendCheckInReminder = async (details) => {
    const body = buildCheckInReminderMessage(details);
    const parameters = getCheckInReminderTemplateParameters(details);
    const delivery = await sendMessage({
        to: details.phoneNumber,
        body,
        parameters,
    });

    return {
        ...delivery,
        message_preview: body,
    };
};

module.exports = {
    getConfigStatus,
    sendMessage,
    sendCheckInReminder,
};
