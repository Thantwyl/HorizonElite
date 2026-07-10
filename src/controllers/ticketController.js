const ticketService =
require("../services/ticketService");

const {
    sendTicketEmailNow
} = require("../services/ticketEmailService");

const downloadETicket =
async (req, res) => {

    try {

        const pdfBuffer =
        await ticketService.generateTicket(
            req.params.bookingId
        );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=e-ticket.pdf"
        );

        res.send(pdfBuffer);

    }
    catch(error){

        console.error(error);

        res.status(500).json({
            error:error.message
        });

    }

};

const sendETicketEmail =
async (req, res) => {

    try {

        const result =
        await sendTicketEmailNow(
            req.params.bookingId
        );

        res.status(200).json({
            message: "E-ticket sent to email",
            data: result
        });

    }
    catch(error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

module.exports={
    downloadETicket,
    sendETicketEmail
};
