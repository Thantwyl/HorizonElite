const express = require("express");

const router = express.Router();

console.log(
    "Flight Result Routes Loaded"
);

const {
    getResultsBySearchId
} = require(
    "../controllers/flightResultController"
);

// GET saved flight results by search ID
router.get(
    "/:flight_search_id",
    getResultsBySearchId
);

module.exports = router;