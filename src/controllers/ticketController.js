const ticketService =
require("../services/ticketService");

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

module.exports={
    downloadETicket
};