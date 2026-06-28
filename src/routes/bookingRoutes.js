const express =
require("express");

const router =
express.Router();

const authenticateUser =
require("../middlewares/authMiddleware");

const {
    createBooking
} = require(
    "../controllers/bookingController"
);

router.post(
    "/",
    authenticateUser,
    createBooking
);

router.get(
    "/hello",
    (req, res) => {

        res.json({

            message:
            "Booking Route Working"

        });

    }
);

module.exports =
router;