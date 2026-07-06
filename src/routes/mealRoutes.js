const express = require("express");
const router = express.Router();

const { getMeals } = require("../controllers/mealController");

router.get("/", getMeals);

module.exports = router;