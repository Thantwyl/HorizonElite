const express = require("express");

const router = express.Router();

const {
    getBooking
} = require("../controllers/manageBookingController");

// Public route (no auth needed for guest booking lookup)
router.post(
    "/search",
    getBooking
);

module.exports = router;