const express =
require("express");

const router =
express.Router();

const {
    createBooking
} = require(
    "../controllers/bookingController"
);

router.post(
    "/",
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