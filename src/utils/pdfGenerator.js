const PDFDocument = require("pdfkit");

const COLORS = {
    navy: "#073B70",
    blue: "#0E7490",
    cyan: "#22D3EE",
    ink: "#172033",
    muted: "#64748B",
    line: "#DCE5EE",
    soft: "#F3F7FA",
    white: "#FFFFFF",
    green: "#15803D"
};

const displayValue = (value, fallback = "Not provided") => {
    if (value === null || value === undefined || String(value).trim() === "") {
        return fallback;
    }
    return String(value);
};

const formatDateTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return displayValue(value);

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: process.env.TICKET_TIME_ZONE || "Asia/Yangon"
    }).format(date);
};

const formatMoney = (amount, currency) => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
        return `${displayValue(amount, "0.00")} ${displayValue(currency, "")}`.trim();
    }

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: displayValue(currency, "USD")
        }).format(numericAmount);
    } catch (_) {
        return `${numericAmount.toFixed(2)} ${displayValue(currency, "")}`.trim();
    }
};

const drawSectionTitle = (doc, title, y) => {
    doc
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(title.toUpperCase(), 50, y, { characterSpacing: 1.2 });
    doc
        .moveTo(50, y + 19)
        .lineTo(545, y + 19)
        .lineWidth(1)
        .strokeColor(COLORS.line)
        .stroke();
    return y + 30;
};

const drawDetailTable = (doc, rows, y) => {
    const x = 50;
    const width = 495;
    const labelWidth = 155;
    const rowHeight = 32;
    const height = rows.length * rowHeight;

    doc.roundedRect(x, y, width, height, 5).fill(COLORS.soft);

    rows.forEach(([label, value], index) => {
        const rowY = y + index * rowHeight;
        if (index > 0) {
            doc
                .moveTo(x, rowY)
                .lineTo(x + width, rowY)
                .lineWidth(0.7)
                .strokeColor(COLORS.line)
                .stroke();
        }

        doc
            .fillColor(COLORS.muted)
            .font("Helvetica-Bold")
            .fontSize(9)
            .text(label.toUpperCase(), x + 14, rowY + 11, {
                width: labelWidth - 20
            });
        doc
            .fillColor(COLORS.ink)
            .font("Helvetica")
            .fontSize(10)
            .text(displayValue(value), x + labelWidth, rowY + 10, {
                width: width - labelWidth - 14,
                ellipsis: true
            });
    });

    return y + height;
};

const drawRoute = (doc, ticketData, y) => {
    doc.roundedRect(50, y, 495, 116, 8).fill(COLORS.navy);

    doc
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .fontSize(26)
        .text(displayValue(ticketData.origin, "---"), 72, y + 28, {
            width: 100,
            align: "center"
        })
        .text(displayValue(ticketData.destination, "---"), 423, y + 28, {
            width: 100,
            align: "center"
        });

    doc
        .moveTo(190, y + 43)
        .lineTo(405, y + 43)
        .lineWidth(1.5)
        .strokeColor(COLORS.cyan)
        .stroke();
    doc
        .fillColor(COLORS.cyan)
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("AIR", 272, y + 31, { width: 50, align: "center" });

    doc
        .fillColor("#CDE6F4")
        .font("Helvetica")
        .fontSize(8)
        .text("ORIGIN", 72, y + 62, { width: 100, align: "center" })
        .text("DESTINATION", 423, y + 62, { width: 100, align: "center" });

    doc
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(
            `${displayValue(ticketData.airline, "Airline")}  |  ${displayValue(ticketData.flight_number, "Flight")}`,
            180,
            y + 78,
            { width: 235, align: "center" }
        );

    return y + 116;
};

const generateTicketPDF = (ticketData) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({
        size: "A4",
        margins: { top: 42, right: 50, bottom: 20, left: 50 },
        info: {
            Title: `Horizon Elite e-ticket ${displayValue(ticketData.pnr, "")}`,
            Author: "Horizon Elite"
        }
    });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Brand header
    doc.roundedRect(50, 42, 495, 76, 8).fill(COLORS.soft);
    doc.rect(50, 42, 9, 76).fill(COLORS.cyan);
    doc
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .fontSize(21)
        .text("HORIZON ELITE", 76, 61);
    doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(9)
        .text("ELECTRONIC TICKET & ITINERARY RECEIPT", 76, 89, {
            characterSpacing: 0.9
        });
    doc
        .fillColor(COLORS.muted)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("BOOKING REFERENCE", 391, 60, { width: 132, align: "right" });
    doc
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(displayValue(ticketData.pnr, "------"), 391, 77, {
            width: 132,
            align: "right",
            characterSpacing: 1.5
        });

    let y = drawRoute(doc, ticketData, 136) + 20;

    y = drawSectionTitle(doc, "Flight schedule", y);
    y = drawDetailTable(doc, [
        ["Departure", formatDateTime(ticketData.departure)],
        ["Arrival", formatDateTime(ticketData.arrival)],
        ["Flight", `${displayValue(ticketData.airline)} · ${displayValue(ticketData.flight_number)}`]
    ], y) + 18;

    y = drawSectionTitle(doc, "Passenger details", y);
    y = drawDetailTable(doc, [
        ["Passenger", ticketData.passenger_name],
        ["Passport", displayValue(ticketData.passport_number, "Not provided")],
        ["Contact email", ticketData.email]
    ], y) + 18;

    y = drawSectionTitle(doc, "Ticket and payment", y);
    y = drawDetailTable(doc, [
        ["Ticket number", displayValue(ticketData.ticket_number, "Not issued")],
        ["Booking status", ticketData.booking_status],
        ["Ticket status", ticketData.ticketing_status],
        ["Total paid", formatMoney(ticketData.amount, ticketData.currency)]
    ], y) + 18;

    doc.roundedRect(50, y, 495, 51, 5).fill("#ECFDF3");
    doc
        .fillColor(COLORS.green)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("TRAVEL READY", 65, y + 11);
    doc
        .fillColor("#35634A")
        .font("Helvetica")
        .fontSize(8.5)
        .text(
            "Keep this document with your valid passport or travel ID. Check-in and boarding requirements remain subject to the operating airline's rules.",
            65,
            y + 27,
            { width: 462 }
        );

    doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(8)
        .text(
            `Generated by Horizon Elite  •  ${new Date().toISOString().slice(0, 10)}  •  This document is your itinerary receipt, not a boarding pass.`,
            50,
            805,
            { width: 495, align: "center" }
        );

    doc.end();
});

module.exports = generateTicketPDF;
