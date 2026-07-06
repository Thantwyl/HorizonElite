const { getAllMeals } = require("../services/mealService");

const getMeals = async (req, res) => {

    try {

        const meals = await getAllMeals();

        res.json({
            message: "Meal options fetched successfully",
            data: meals
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch meals"
        });

    }
};

module.exports = { getMeals };