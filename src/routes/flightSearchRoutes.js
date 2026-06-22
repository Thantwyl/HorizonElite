const express = require("express");

console.log("Flight Search Routes Loaded");

const router = express.Router();

const authenticateUser =
require("../middlewares/authMiddleware");

const {
    createFlightSearch
} = require("../controllers/flightSearchController");

router.post(
    "/search",
    authenticateUser,
    createFlightSearch
);

module.exports = router;