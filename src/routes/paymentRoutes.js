const express =
require("express");

const router =
express.Router();

const optionalAuthMiddleware =
require("../middlewares/optionalAuthMiddleware");

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
    optionalAuthMiddleware,
    createPayment
);

router.post(
    "/charge",
    optionalAuthMiddleware,
    chargePayment
);

router.post(
    "/simulate-success",
    optionalAuthMiddleware,
    simulatePaymentSuccess
);

module.exports =
router;
