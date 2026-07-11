const PDFDocument = require("pdfkit");

module.exports = (pass) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    doc.rect(45, 45, 505, 310).lineWidth(2).stroke("#073b70");
    doc.fillColor("#073b70").fontSize(24).text("HORIZON ELITE", 65, 65);
    doc.fontSize(15).text("BOARDING PASS", 400, 70, { align: "right", width: 125 });
    doc.moveTo(65, 110).lineTo(530, 110).stroke("#9ca3af");
    doc.fillColor("#111827").fontSize(10).text("PASSENGER", 65, 130);
    doc.fontSize(16).text(pass.passenger_name, 65, 146);
    doc.fontSize(10).text("BOOKING REFERENCE", 365, 130);
    doc.fontSize(16).text(pass.pnr, 365, 146);
    doc.fontSize(10).text("FLIGHT", 65, 195).text("DATE", 175, 195).text("CABIN", 340, 195);
    doc.fontSize(14).text(pass.flight_number || "-", 65, 212)
        .text(new Date(pass.departure).toLocaleDateString("en-US"), 175, 212)
        .text(pass.cabin || "Economy", 340, 212);
    doc.fontSize(28).fillColor("#073b70").text(pass.origin, 65, 265)
        .text("->", 205, 265).text(pass.destination, 280, 265);
    doc.fillColor("#111827").fontSize(11)
        .text(`Departure: ${new Date(pass.departure).toLocaleString("en-US")}`, 65, 315);
    doc.fontSize(10).fillColor("#4b5563").text("Present this boarding pass with valid travel identification at the airport.", 65, 385);
    doc.end();
});
