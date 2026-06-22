const express = require("express");

const router = express.Router();

const {
    createPassenger,
    getPassengersBySelectedFlight,
    deletePassenger
} = require(
    "../controllers/passengerController"
);

router.post(
    "/",
    createPassenger
);

router.get(
    "/:selectedFlightId",
    getPassengersBySelectedFlight
);

router.delete(
    "/:passengerId",
    deletePassenger
);

module.exports = router;