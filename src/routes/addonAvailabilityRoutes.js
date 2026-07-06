const express = require("express");
const router = express.Router();

const controller =
require("../controllers/addonAvailabilityController");

router.get(
    "/availability/:offerId",
    controller.getAvailability
);

module.exports = router;