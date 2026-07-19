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

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const sendCheckInReminderEmail = async ({
    to,
    passengerName,
    passengerLastName,
    pnr,
    airlineName,
    flightNumber,
    origin,
    destination,
    departure,
    checkInUrl
}) => {
    const transporter = getTransporter();
    const departureText = new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: process.env.CHECK_IN_REMINDER_TIME_ZONE || "Asia/Yangon"
    }).format(new Date(departure));
    const safe = {
        passengerName: escapeHtml(passengerName || "traveler"),
        passengerLastName: escapeHtml(passengerLastName),
        pnr: escapeHtml(pnr),
        airlineName: escapeHtml(airlineName),
        flightNumber: escapeHtml(flightNumber),
        origin: escapeHtml(origin),
        destination: escapeHtml(destination),
        departureText: escapeHtml(departureText),
        checkInUrl: escapeHtml(checkInUrl)
    };

    const delivery = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Check-in reminder for ${pnr}: ${origin} to ${destination}`,
        text:
            `Hello ${passengerName || "traveler"},\n\n` +
            "Your flight departs in 4 days.\n\n" +
            `Booking reference: ${pnr}\n` +
            `Passenger last name: ${passengerLastName}\n` +
            `Flight: ${airlineName || ""} ${flightNumber}\n` +
            `Route: ${origin} to ${destination}\n` +
            `Departure: ${departureText}\n\n` +
            "Online check-in opens 48 hours before departure and closes 90 minutes before take-off. " +
            "Have your passport or travel ID and booking reference ready. After checking in, download your boarding pass and review the airline's baggage and airport requirements.\n\n" +
            `Check in: ${checkInUrl}\n\n` +
            "Please verify the latest check-in time with the operating airline, as airline rules can vary.",
        html:
            `<p>Hello ${safe.passengerName},</p>` +
            "<p><strong>Your flight departs in 4 days.</strong> Here is your check-in guide.</p>" +
            "<table style=\"border-collapse:collapse\">" +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Booking reference</strong></td><td>${safe.pnr}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Passenger last name</strong></td><td>${safe.passengerLastName}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Flight</strong></td><td>${safe.airlineName} ${safe.flightNumber}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Route</strong></td><td>${safe.origin} to ${safe.destination}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Departure</strong></td><td>${safe.departureText}</td></tr>` +
            "</table>" +
            "<h3>Before you check in</h3>" +
            "<ul><li>Online check-in opens 48 hours before departure and closes 90 minutes before take-off.</li>" +
            "<li>Have your passport or travel ID and booking reference ready.</li>" +
            "<li>Confirm passenger details, seats, baggage, and required travel documents.</li>" +
            "<li>After check-in, download your boarding pass and keep it available at the airport.</li></ul>" +
            `<p><a href=\"${safe.checkInUrl}\" style=\"display:inline-block;background:#063b70;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700;border-radius:4px\">Go to online check-in</a></p>` +
            "<p>Please verify the latest check-in time with the operating airline, as airline rules can vary.</p>"
    });

    const normalizedRecipient = String(to).trim().toLowerCase();
    const accepted = (delivery.accepted || []).map(address =>
        String(address).trim().toLowerCase()
    );
    if (!accepted.includes(normalizedRecipient)) {
        throw new Error("The email provider did not accept the reminder recipient");
    }

    return { message_id: delivery.messageId, accepted };
};

module.exports = {
    sendVerificationEmail,
    sendTicketEmail,
    sendBoardingPassEmail,
    sendCheckInReminderEmail
};
