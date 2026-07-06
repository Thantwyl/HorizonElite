const express = require("express");
const router = express.Router();

const {
    addAddon,
    getAddons,
    fetchBaggageOptions,
    selectPassengerBaggage
} = require("../controllers/addonController");

// Add addon (seat/meal/baggage/etc.)
router.post("/", addAddon);

// Get all addons for booking (manage booking)
router.get("/:booking_id", getAddons);

router.get("/baggage/options",fetchBaggageOptions);

router.post("/baggage/select",selectPassengerBaggage);

module.exports = router;