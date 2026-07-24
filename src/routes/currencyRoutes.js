const express = require("express");
const currencyController = require("../controllers/currencyController");

const router = express.Router();

router.get("/rates", currencyController.getExchangeRates);

module.exports = router;
