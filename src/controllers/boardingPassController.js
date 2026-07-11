const service = require("../services/boardingPassService");
const { sendBoardingPassEmail } = require("../services/emailSenderService");

const download = async (req, res) => {
    try {
        const pdf = await service.generateBoardingPass(req.params.bookingId);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=boarding-pass.pdf");
        res.send(pdf);
    } catch (error) { res.status(error.message.includes("not found") ? 404 : 400).json({ error: error.message }); }
};

const email = async (req, res) => {
    try {
        const booking = await service.getBoardingPass(req.params.bookingId);
        const pdfBuffer = await service.generateBoardingPass(req.params.bookingId);
        const delivery = await sendBoardingPassEmail({ to: booking.recipient_email, pnr: booking.pnr_reference, pdfBuffer });
        res.json({
            message: "Boarding pass accepted by email provider",
            data: {
                recipient_email: booking.recipient_email,
                pnr_reference: booking.pnr_reference,
                message_id: delivery.message_id
            }
        });
    } catch (error) { res.status(error.message.includes("not found") ? 404 : 400).json({ error: error.message }); }
};

module.exports = { download, email };
