const express =
require("express");

const router =
express.Router();

const {
    createPayment,
    testOmise,
    chargePayment
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
    createPayment
);

router.post(
    "/charge",
    chargePayment
);

module.exports =
router;
