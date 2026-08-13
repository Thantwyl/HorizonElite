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

const sendArrivalCardReminderEmail = async ({
    to,
    passengerName,
    pnr,
    airlineName,
    flightNumber,
    origin,
    destination,
    arrival,
    requirement
}) => {
    const transporter = getTransporter();
    const arrivalText = new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: process.env.ARRIVAL_CARD_REMINDER_TIME_ZONE || "Asia/Yangon"
    }).format(new Date(arrival));
    const formItems = Array.isArray(requirement?.forms) ? requirement.forms : [];
    const safe = {
        passengerName: escapeHtml(passengerName || "traveler"),
        pnr: escapeHtml(pnr),
        airlineName: escapeHtml(airlineName),
        flightNumber: escapeHtml(flightNumber),
        origin: escapeHtml(origin),
        destination: escapeHtml(destination),
        arrivalText: escapeHtml(arrivalText),
        headline: escapeHtml(requirement?.headline || "Check whether your destination requires an arrival card or digital immigration form before you travel.")
    };
    const formText = formItems.length > 0
        ? formItems.map((form, index) =>
            `${index + 1}. ${form.title}${form.url ? ` - ${form.url}` : ""}${form.description ? `\n   ${form.description}` : ""}`
        ).join("\n")
        : "No destination-specific arrival card form was returned by the travel requirements provider. Please verify requirements with the destination government or operating airline.";
    const formHtml = formItems.length > 0
        ? `<ul>${formItems.map(form => {
            const title = escapeHtml(form.title || "Arrival form");
            const description = form.description ? `<br><span>${escapeHtml(form.description)}</span>` : "";
            const url = form.url ? `<br><a href="${escapeHtml(form.url)}">${escapeHtml(form.url)}</a>` : "";
            return `<li><strong>${title}</strong>${description}${url}</li>`;
        }).join("")}</ul>`
        : "<p>No destination-specific arrival card form was returned by the travel requirements provider. Please verify requirements with the destination government or operating airline.</p>";

    const delivery = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Arrival card reminder for ${pnr}: ${destination}`,
        text:
            `Hello ${passengerName || "traveler"},\n\n` +
            "Your arrival is coming up in 3 days.\n\n" +
            `Booking reference: ${pnr}\n` +
            `Flight: ${airlineName || ""} ${flightNumber}\n` +
            `Route: ${origin} to ${destination}\n` +
            `Arrival: ${arrivalText}\n\n` +
            `${requirement?.headline || "Check whether your destination requires an arrival card or digital immigration form before you travel."}\n\n` +
            `${formText}\n\n` +
            "Requirements can change. Please confirm the latest rules with official government or airline sources before departure.",
        html:
            `<p>Hello ${safe.passengerName},</p>` +
            "<p><strong>Your arrival is coming up in 3 days.</strong> Please review any destination arrival card or digital immigration form requirements.</p>" +
            "<table style=\"border-collapse:collapse\">" +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Booking reference</strong></td><td>${safe.pnr}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Flight</strong></td><td>${safe.airlineName} ${safe.flightNumber}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Route</strong></td><td>${safe.origin} to ${safe.destination}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Arrival</strong></td><td>${safe.arrivalText}</td></tr>` +
            "</table>" +
            `<p>${safe.headline}</p>` +
            formHtml +
            "<p>Requirements can change. Please confirm the latest rules with official government or airline sources before departure.</p>"
    });

    const normalizedRecipient = String(to).trim().toLowerCase();
    const accepted = (delivery.accepted || []).map(address =>
        String(address).trim().toLowerCase()
    );
    if (!accepted.includes(normalizedRecipient)) {
        throw new Error("The email provider did not accept the arrival card reminder recipient");
    }

    return { message_id: delivery.messageId, accepted };
};

const sendTravelChecklistReminderEmail = async ({
    to,
    passengerName,
    pnr,
    airlineName,
    flightNumber,
    origin,
    destination,
    departure
}) => {
    const transporter = getTransporter();
    const departureText = new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: process.env.TRAVEL_CHECKLIST_REMINDER_TIME_ZONE || "Asia/Yangon"
    }).format(new Date(departure));
    const safe = {
        passengerName: escapeHtml(passengerName || "traveler"),
        pnr: escapeHtml(pnr),
        airlineName: escapeHtml(airlineName),
        flightNumber: escapeHtml(flightNumber),
        origin: escapeHtml(origin),
        destination: escapeHtml(destination),
        departureText: escapeHtml(departureText)
    };
    const checklist = [
        "Passport is valid for your destination requirements.",
        "Visa, eTA, arrival card, or immigration declaration is completed if required.",
        "Passenger name matches passport or travel document.",
        "Baggage allowance and restricted items are reviewed.",
        "Online check-in, seat, meal, and assistance needs are confirmed.",
        "Travel insurance, payment card, roaming/eSIM, and local transport are ready.",
        "Airport arrival time and terminal details are checked before departure."
    ];

    const delivery = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Travel checklist for ${pnr}: ${origin} to ${destination}`,
        text:
            `Hello ${passengerName || "traveler"},\n\n` +
            "Your trip is coming up. Please review this checklist before departure.\n\n" +
            `Booking reference: ${pnr}\n` +
            `Flight: ${airlineName || ""} ${flightNumber}\n` +
            `Route: ${origin} to ${destination}\n` +
            `Departure: ${departureText}\n\n` +
            checklist.map((item, index) => `${index + 1}. ${item}`).join("\n") +
            "\n\nPlease verify final travel requirements with official government, airport, and airline sources.",
        html:
            `<p>Hello ${safe.passengerName},</p>` +
            "<p><strong>Your trip is coming up.</strong> Please review this checklist before departure.</p>" +
            "<table style=\"border-collapse:collapse\">" +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Booking reference</strong></td><td>${safe.pnr}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Flight</strong></td><td>${safe.airlineName} ${safe.flightNumber}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Route</strong></td><td>${safe.origin} to ${safe.destination}</td></tr>` +
            `<tr><td style=\"padding:4px 16px 4px 0\"><strong>Departure</strong></td><td>${safe.departureText}</td></tr>` +
            "</table>" +
            `<ul>${checklist.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` +
            "<p>Please verify final travel requirements with official government, airport, and airline sources.</p>"
    });

    const normalizedRecipient = String(to).trim().toLowerCase();
    const accepted = (delivery.accepted || []).map(address =>
        String(address).trim().toLowerCase()
    );
    if (!accepted.includes(normalizedRecipient)) {
        throw new Error("The email provider did not accept the travel checklist reminder recipient");
    }

    return { message_id: delivery.messageId, accepted };
};

module.exports = {
    sendVerificationEmail,
    sendTicketEmail,
    sendBoardingPassEmail,
    sendCheckInReminderEmail,
    sendArrivalCardReminderEmail,
    sendTravelChecklistReminderEmail
};
