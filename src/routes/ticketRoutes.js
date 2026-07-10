const express = require("express");

const router = express.Router();

const {
    downloadETicket,
    sendETicketEmail
} = require("../controllers/ticketController");

router.post(
    "/:bookingId/email",
    sendETicketEmail
);

router.get(
    "/:bookingId",
    downloadETicket
);

module.exports = router;
