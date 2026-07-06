const express = require("express");

const router = express.Router();

const {
    downloadETicket
} = require("../controllers/ticketController");

router.get(
    "/:bookingId",
    downloadETicket
);

module.exports = router;