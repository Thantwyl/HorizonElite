const paymentService =
require("../services/paymentService");

const testOmise =
async (req, res) => {

    try {

        const connection =
        await paymentService
        .testConnection();

        res.status(200).json({

            message:
            "Payment service connected",

            connection

        });

    }
    catch(error){

        res.status(500).json({

            error:
            error.message

        });

    }

};

const createPayment =
async (req, res) => {

    try {

        const payment =
        await paymentService
        .createPayment(req.body);

        res.status(201).json({

            message:
            "Payment created",

            payment

        });

    }
    catch(error){

        res.status(500).json({

            error:
            error.message

        });

    }

};

const chargePayment =
async (req,res) => {

    try {

        const result =
        await paymentService
        .chargePayment(req.body);

        res.status(200).json(result);

    }
    catch(error){

        res.status(500).json({

            error:
            error.message

        });

    }

};

module.exports = {

    testOmise,
    createPayment,
    chargePayment

};
