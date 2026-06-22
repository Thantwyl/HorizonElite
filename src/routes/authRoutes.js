const express = require("express");

const router = express.Router();

const {
    register,
    login,
    profile
} = require("../controllers/authController");

const authenticateUser =
    require("../middlewares/authMiddleware");

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

// Register User
router.post(
    "/register",
    register
);

// Login User
router.post(
    "/login",
    login
);

// Get Logged In User Profile
router.get(
    "/profile",
    authenticateUser,
    profile
);

module.exports = router;