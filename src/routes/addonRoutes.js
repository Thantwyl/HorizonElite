const express = require("express");
const router = express.Router();

const {
    addAddon,
    getAddons,
    fetchBaggageOptions,
    markAddonsPaid,
    selectPassengerBaggage
} = require("../controllers/addonController");

router.get("/baggage/options",fetchBaggageOptions);

router.post("/baggage/select",selectPassengerBaggage);

router.post("/mark-paid", markAddonsPaid);

// Add addon (seat/meal/baggage/etc.)
router.post("/", addAddon);

// Get all addons for booking (manage booking)
router.get("/:booking_id", getAddons);

module.exports = router;
