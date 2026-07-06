const pool = require("../config/db");

/**
 * Get all active meal options
 */
const getAllMeals = async () => {

    const result = await pool.query(
        `
        SELECT * FROM meal_options
        WHERE is_active = true
        ORDER BY meal_category, meal_code
        `
    );

    return result.rows;
};

module.exports = {
    getAllMeals
};