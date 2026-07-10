const express =
require("express");

const router =
express.Router();

const {

    checkFlightStatus

} = require(
"../controllers/flightStatusController"
);

router.get(
"/",
checkFlightStatus
);

module.exports =
router;