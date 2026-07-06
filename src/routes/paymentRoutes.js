const express =
require("express");

const router =
express.Router();

const authenticateUser =
require("../middlewares/authMiddleware");

const {
    createPayment,
    testOmise,
    chargePayment,
    simulatePaymentSuccess
    
} = require(
    "../controllers/paymentController"
);

router.get(
    "/hello",
    (req, res) => {

        res.json({

            message:
            "Payment Route Working"

        });

    }
);

router.get(
    "/test-omise",
    testOmise
);

router.post(
    "/create",
    authenticateUser,
    createPayment
);

router.post(
    "/charge",
    authenticateUser,
    chargePayment
);

router.post(
    "/simulate-success",
    authenticateUser,
    simulatePaymentSuccess
);

module.exports =
router;