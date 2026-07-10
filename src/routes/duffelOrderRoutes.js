const express = require("express");

const router = express.Router();

const {
    createDuffelOrder,
    validateBookingOffer
} = require(
    "../controllers/duffelOrderController"
);

router.post(
    "/validate-offer",
    validateBookingOffer
);

router.post(
    "/create",
    createDuffelOrder
);

module.exports = router;
