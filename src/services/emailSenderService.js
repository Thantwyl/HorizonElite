require("../config/loadEnv");

const nodemailer = require("nodemailer");

const getTransporter = () => {

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (
        !host ||
        !user ||
        !pass
    ) {
        throw new Error(
            "SMTP email settings are missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM."
        );
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass
        }
    });

};

const sendVerificationEmail = async ({
    to,
    firstName,
    verificationUrl
}) => {

    const from =
        process.env.SMTP_FROM ||
        process.env.SMTP_USER;

    const transporter =
        getTransporter();

    await transporter.sendMail({
        from,
        to,
        subject: "Verify your Horizon Elite account",
        text:
            `Hello ${firstName || "there"},\n\n` +
            "Please verify your Horizon Elite account by opening this link:\n" +
            `${verificationUrl}\n\n` +
            "This link expires in 60 minutes.\n\n" +
            "If you did not create this account, you can ignore this email.",
        html:
            `<p>Hello ${firstName || "there"},</p>` +
            "<p>Please verify your Horizon Elite account by clicking the button below.</p>" +
            `<p><a href="${verificationUrl}" style="display:inline-block;background:#063b70;color:#ffffff;padding:12px 20px;text-decoration:none;font-weight:700;border-radius:4px;">Verify Email</a></p>` +
            `<p>If the button does not work, copy and paste this link into your browser:<br><a href="${verificationUrl}">${verificationUrl}</a></p>` +
            "<p>This link expires in 60 minutes.</p>" +
            "<p>If you did not create this account, you can ignore this email.</p>"
    });

};

const sendTicketEmail = async ({
    to,
    pnr,
    pdfBuffer
}) => {

    const from =
        process.env.SMTP_FROM ||
        process.env.SMTP_USER;

    const transporter =
        getTransporter();

    await transporter.sendMail({
        from,
        to,
        subject: `Your Horizon Elite e-ticket ${pnr}`,
        text:
            "Thank you for booking with Horizon Elite.\n\n" +
            `Your e-ticket for booking reference ${pnr} is attached.\n\n` +
            "Please keep this email for your travel records.",
        html:
            "<p>Thank you for booking with Horizon Elite.</p>" +
            `<p>Your e-ticket for booking reference <strong>${pnr}</strong> is attached.</p>` +
            "<p>Please keep this email for your travel records.</p>",
        attachments: [
            {
                filename: `horizon-elite-eticket-${pnr}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf"
            }
        ]
    });

};

const sendBoardingPassEmail = async ({ to, pnr, pdfBuffer }) => {
    const transporter = getTransporter();
    const delivery = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Your Horizon Elite boarding pass ${pnr}`,
        text: `Your boarding pass for booking reference ${pnr} is attached. Please present it with valid travel identification at the airport.`,
        html: `<p>Your boarding pass for booking reference <strong>${pnr}</strong> is attached.</p><p>Please present it with valid travel identification at the airport.</p>`,
        attachments: [{ filename: `horizon-elite-boarding-pass-${pnr}.pdf`, content: pdfBuffer, contentType: "application/pdf" }]
    });

    const normalizedRecipient = String(to).trim().toLowerCase();
    const accepted = (delivery.accepted || []).map(address => String(address).trim().toLowerCase());
    if (!accepted.includes(normalizedRecipient)) {
        const rejected = (delivery.rejected || []).join(", ");
        throw new Error(rejected
            ? `The email provider rejected the recipient: ${rejected}`
            : "The email provider did not accept the recipient address");
    }

    return { message_id: delivery.messageId, accepted };
};

module.exports = {
    sendVerificationEmail,
    sendTicketEmail,
    sendBoardingPassEmail
};
