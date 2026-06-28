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
        actor_email_address,
        payment_method,
        currency_code,
        total_payment_amount

    } = data;

    if (!booking_id && !pnr_reference) {
        const error = new Error(
            "booking_id or pnr_reference is required"
        );
        error.statusCode = 400;
        throw error;
    }

    const bookingLookupResult =
    await pool.query(
        `
        SELECT
            booking_id,
            pnr_reference,
            user_email_address,
            currency_code,
            total_payment_amount
        FROM bookings
        WHERE
            ($1::uuid IS NOT NULL AND booking_id = $1)
            OR
            ($2::char(6) IS NOT NULL AND pnr_reference = $2)
        ORDER BY booking_created_at DESC
        LIMIT 1
        `,
        [
            booking_id || null,
            pnr_reference || null
        ]
    );

    if (bookingLookupResult.rows.length === 0) {
        const error = new Error(
            "Booking not found for payment"
        );
        error.statusCode = 400;
        throw error;
    }

    const booking = bookingLookupResult.rows[0];

    const resolvedBookingId =
    booking.booking_id || booking_id;

    const resolvedPnr =
    booking.pnr_reference;

    const resolvedUserEmail =
    booking.user_email_address;

    if (
        actor_email_address &&
        actor_email_address !== resolvedUserEmail
    ) {
        const error = new Error(
            "You are not allowed to pay for this booking"
        );
        error.statusCode = 403;
        throw error;
    }

    const resolvedCurrency =
    currency_code || booking.currency_code;

    const resolvedAmount =
    total_payment_amount || booking.total_payment_amount;

    if (!payment_method) {
        const error = new Error(
            "payment_method is required"
        );
        error.statusCode = 400;
        throw error;
    }

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

            resolvedBookingId,
            resolvedPnr,
            resolvedUserEmail,
            payment_method,
            resolvedCurrency,
            resolvedAmount

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

/*
|--------------------------------------------------------------------------
| Simulate Payment Success (Development Only)
|--------------------------------------------------------------------------
*/

const simulatePaymentSuccess = async (payment_id) => {

    const result = await pool.query(
        `
        UPDATE payments
        SET

            payment_status_code = 'PAID',

            gateway_transaction_reference =
                'SIM_' || substr(md5(random()::text),1,12),

            payment_timestamp = NOW(),

            updated_at = NOW()

        WHERE payment_id = $1

        RETURNING *
        `,
        [payment_id]
    );

    if(result.rows.length === 0){

        throw new Error("Payment not found");

    }

    return result.rows[0];

};

module.exports = {

    testConnection,
    createPayment,
    chargePayment,
    simulatePaymentSuccess

};


