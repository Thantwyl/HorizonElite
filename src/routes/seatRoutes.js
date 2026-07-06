const express = require("express");
const router = express.Router();

const seatController = require("../controllers/seatController");

// Get seat map
router.get("/map/:offer_id", seatController.getSeatMap);

// Select seat
router.post("/select", seatController.selectSeat);

module.exports = router;