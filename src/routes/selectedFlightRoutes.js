const express =
require("express");

const router =
express.Router();

const {
    selectFlight
}
=
require(
    "../controllers/selectedFlightController"
);

router.post(
    "/",
    selectFlight
);

module.exports =
router;