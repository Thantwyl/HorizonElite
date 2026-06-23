const pool = require("../config/db");
const omise = require("../config/omise");

/*
|--------------------------------------------------------------------------
| Test Omise Connection
|--------------------------------------------------------------------------
*/

const testConnection = async () => {

    return {

        connected: true,

        public_key:
        process.env.OMISE_PUBLIC_KEY

    };

};

/*
|--------------------------------------------------------------------------
| Create Payment Record
|--------------------------------------------------------------------------
*/

const createPayment = async (data) => {

    const {

        booking_id,
        pnr_reference,
        user_email_address,
        payment_method,
        currency_code,
        total_payment_amount

    } = data;

    const result = await pool.query(

        `
        INSERT INTO payments (

            booking_id,
            pnr_reference,
            user_email_address,
            payment_method,
            currency_code,
            total_payment_amount

        )

        VALUES (

            $1,$2,$3,$4,$5,$6

        )

        RETURNING *
        `,
        [

            booking_id,
            pnr_reference,
            user_email_address,
            payment_method,
            currency_code,
            total_payment_amount

        ]

    );

    return result.rows[0];

};

/*
|--------------------------------------------------------------------------
| Charge Payment
|--------------------------------------------------------------------------
*/

const chargePayment = async (data) => {

    const {

        payment_id,
        token,
        amount,
        currency

    } = data;

    const charge =
    await omise.charges.create({

        amount:
        Math.round(amount * 100),

        currency,

        card: token

    });

    return charge;

};

module.exports = {

    testConnection,
    createPayment,
    chargePayment

};
