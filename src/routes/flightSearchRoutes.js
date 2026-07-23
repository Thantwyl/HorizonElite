const express = require("express");

console.log("Flight Search Routes Loaded");

const router = express.Router();

const optionalAuthMiddleware =
require("../middlewares/optionalAuthMiddleware");

const {
    createFlightSearch,
    getPopularRoutes
} = require("../controllers/flightSearchController");

router.get(
    "/popular-routes",
    getPopularRoutes
);

router.post(
    "/search",
    optionalAuthMiddleware,
    createFlightSearch
);

module.exports = router;
