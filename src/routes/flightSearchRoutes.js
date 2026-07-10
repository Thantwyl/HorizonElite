const express = require("express");

console.log("Flight Search Routes Loaded");

const router = express.Router();

const optionalAuthMiddleware =
require("../middlewares/optionalAuthMiddleware");

const {
    createFlightSearch
} = require("../controllers/flightSearchController");

router.post(
    "/search",
    optionalAuthMiddleware,
    createFlightSearch
);

module.exports = router;
