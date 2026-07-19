const PDFDocument = require("pdfkit");

const COLORS = {
    navy: "#073B70",
    cyan: "#22D3EE",
    ink: "#172033",
    muted: "#64748B",
    line: "#DCE5EE",
    soft: "#F3F7FA",
    white: "#FFFFFF",
    green: "#15803D",
    greenSoft: "#ECFDF3"
};

const value = (input, fallback = "Not available") => {
    if (input === null || input === undefined || String(input).trim() === "") {
        return fallback;
    }
    return String(input);
};

const getDepartureParts = (input) => {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
        return { date: value(input), time: "Not available" };
    }

    const timeZone = process.env.TICKET_TIME_ZONE || "Asia/Yangon";
    return {
        date: new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone
        }).format(date),
        time: new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone
        }).format(date)
    };
};

const drawLabelValue = (doc, label, content, x, y, width) => {
    doc
        .fillColor(COLORS.muted)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(label.toUpperCase(), x, y, {
            width,
            characterSpacing: 0.7
        });
    doc
        .fillColor(COLORS.ink)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(value(content), x, y + 16, {
            width,
            ellipsis: true
        });
};

const drawReferenceBars = (doc, reference, x, y, width, height) => {
    const seed = value(reference, "HORIZON");
    let cursor = x;
    let index = 0;

    while (cursor < x + width) {
        const code = seed.charCodeAt(index % seed.length);
        const barWidth = 1 + (code % 3);
        const gap = 1 + ((code + index) % 2);
        doc.rect(cursor, y, barWidth, height).fill(COLORS.navy);
        cursor += barWidth + gap;
        index += 1;
    }
};

module.exports = (pass) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 42, right: 42, bottom: 30, left: 42 },
        info: {
            Title: `Horizon Elite boarding pass ${value(pass.pnr, "")}`,
            Author: "Horizon Elite"
        }
    });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const departure = getDepartureParts(pass.departure);
    const pageWidth = doc.page.width;
    const cardX = 42;
    const cardY = 64;
    const cardWidth = pageWidth - 84;
    const cardHeight = 420;
    const stubWidth = 190;
    const stubX = cardX + cardWidth - stubWidth;

    // Boarding-pass shell
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 12).fill(COLORS.white);
    doc.roundedRect(cardX, cardY, cardWidth, 82, 12).fill(COLORS.navy);
    doc.rect(cardX, cardY + 70, cardWidth, 12).fill(COLORS.navy);

    doc
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("HORIZON ELITE", cardX + 28, cardY + 23);
    doc
        .fillColor("#CDE6F4")
        .font("Helvetica")
        .fontSize(9)
        .text("DIGITAL BOARDING PASS", cardX + 29, cardY + 51, {
            characterSpacing: 1.2
        });
    doc
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("CHECK-IN CONFIRMED", stubX + 20, cardY + 31, {
            width: stubWidth - 40,
            align: "center"
        });

    // Perforation and stub
    doc
        .moveTo(stubX, cardY + 92)
        .lineTo(stubX, cardY + cardHeight - 20)
        .lineWidth(1)
        .dash(4, { space: 4 })
        .strokeColor(COLORS.line)
        .stroke()
        .undash();

    // Main route area
    const mainLeft = cardX + 30;
    const mainRight = stubX - 30;
    doc
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .fontSize(42)
        .text(value(pass.origin, "---"), mainLeft, cardY + 113, {
            width: 120,
            align: "center"
        })
        .text(value(pass.destination, "---"), mainRight - 120, cardY + 113, {
            width: 120,
            align: "center"
        });
    doc
        .moveTo(mainLeft + 145, cardY + 138)
        .lineTo(mainRight - 145, cardY + 138)
        .lineWidth(2)
        .strokeColor(COLORS.cyan)
        .stroke();
    doc
        .fillColor(COLORS.cyan)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("FLIGHT", mainLeft + 190, cardY + 126, {
            width: mainRight - mainLeft - 380,
            align: "center"
        });
    doc
        .fillColor(COLORS.muted)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("FROM", mainLeft, cardY + 162, { width: 120, align: "center" })
        .text("TO", mainRight - 120, cardY + 162, { width: 120, align: "center" });

    // Passenger and travel detail table
    const tableY = cardY + 204;
    const tableWidth = mainRight - mainLeft;
    doc.roundedRect(mainLeft, tableY, tableWidth, 132, 7).fill(COLORS.soft);
    doc
        .moveTo(mainLeft, tableY + 66)
        .lineTo(mainRight, tableY + 66)
        .lineWidth(0.8)
        .strokeColor(COLORS.line)
        .stroke();
    const colWidth = tableWidth / 3;
    for (let index = 1; index < 3; index += 1) {
        doc
            .moveTo(mainLeft + colWidth * index, tableY)
            .lineTo(mainLeft + colWidth * index, tableY + 132)
            .strokeColor(COLORS.line)
            .stroke();
    }

    drawLabelValue(doc, "Passenger", pass.passenger_name, mainLeft + 15, tableY + 13, colWidth - 30);
    drawLabelValue(doc, "Flight", pass.flight_number, mainLeft + colWidth + 15, tableY + 13, colWidth - 30);
    drawLabelValue(doc, "Cabin", pass.cabin, mainLeft + colWidth * 2 + 15, tableY + 13, colWidth - 30);
    drawLabelValue(doc, "Departure date", departure.date, mainLeft + 15, tableY + 79, colWidth - 30);
    drawLabelValue(doc, "Departure time", departure.time, mainLeft + colWidth + 15, tableY + 79, colWidth - 30);
    drawLabelValue(doc, "Booking reference", pass.pnr, mainLeft + colWidth * 2 + 15, tableY + 79, colWidth - 30);

    doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(8.5)
        .text(
            "Present this boarding pass with a valid passport or travel ID. Gate, boarding time, and seat assignments shown by the operating airline take precedence.",
            mainLeft,
            cardY + 359,
            { width: tableWidth }
        );

    // Detachable reference stub
    const stubContentX = stubX + 22;
    drawLabelValue(doc, "Passenger", pass.passenger_name, stubContentX, cardY + 112, stubWidth - 44);
    drawLabelValue(doc, "Flight", pass.flight_number, stubContentX, cardY + 173, 70);
    drawLabelValue(doc, "Date", departure.date, stubContentX + 77, cardY + 173, stubWidth - 121);
    drawLabelValue(doc, "Route", `${value(pass.origin, "---")} TO ${value(pass.destination, "---")}`, stubContentX, cardY + 234, stubWidth - 44);
    drawLabelValue(doc, "PNR", pass.pnr, stubContentX, cardY + 295, stubWidth - 44);
    drawReferenceBars(doc, pass.pnr, stubContentX, cardY + 347, stubWidth - 44, 32);
    doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(7)
        .text(value(pass.pnr, "------"), stubContentX, cardY + 384, {
            width: stubWidth - 44,
            align: "center",
            characterSpacing: 2
        });

    doc.roundedRect(42, 508, cardWidth, 44, 6).fill(COLORS.greenSoft);
    doc
        .fillColor(COLORS.green)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("READY TO BOARD", 60, 523);
    doc
        .fillColor("#35634A")
        .font("Helvetica")
        .fontSize(8)
        .text(
            "Arrive early, verify the departure screens, and follow the operating airline's document and baggage requirements.",
            163,
            523,
            { width: cardWidth - 181 }
        );

    doc.end();
});
