const express = require("express");

const router = express.Router();

const {
    register,
    login,
    facebookLogin,
    facebookCallback,
    googleLogin,
    googleCallback,
    verifyEmail,
    resendVerificationEmail,
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

// Verify Registration Email Link
router.get(
    "/verify-email",
    verifyEmail
);

router.post(
    "/verify-email",
    verifyEmail
);

// Resend Registration Verification Email
router.post(
    "/resend-verification-email",
    resendVerificationEmail
);

// Login User
router.post(
    "/login",
    login
);

router.get(
    "/facebook",
    facebookLogin
);

router.get(
    "/facebook/callback",
    facebookCallback
);

router.get(
    "/google",
    googleLogin
);

router.get(
    "/google/callback",
    googleCallback
);

// Get Logged In User Profile
router.get(
    "/profile",
    authenticateUser,
    profile
);

module.exports = router;
