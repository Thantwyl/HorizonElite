const express =
require("express");

const router =
express.Router();

// const authenticateUser =
// require("../middlewares/authMiddleware");

const optionalAuthMiddleware =
require("../middlewares/optionalAuthMiddleware");

const {
    createBooking,
    getManageBooking,
    getBookingSummaryByPnr,
    getBookingActions
} = require(
    "../controllers/bookingController"
);

router.post(
    "/",
    optionalAuthMiddleware,
    createBooking
);

router.get(
    "/summary/:pnr",
    getBookingSummaryByPnr
);

router.get(
    "/manage/:pnr/:lastName",
    getManageBooking
);

router.get(
    "/manage/:pnr/:lastName/actions",
    getBookingActions
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
