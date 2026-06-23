const pool =
require("../config/db");

const generatePNR =
require("../utils/generatePNR");

const createBooking = async (

    user_email_address,
    selected_flight_id,
    passenger_ids,
    total_payment_amount,
    currency_code,
    trip_type,
    cabin_class,
    fare_brand_id

) => {

    const client =
    await pool.connect();

    try {

        await client.query("BEGIN");

        const pnr_reference =
        generatePNR();

        const bookingQuery = `
        INSERT INTO bookings (

            pnr_reference,
            user_email_address,
            selected_flight_id,
            booking_status,
            ticketing_status,
            total_payment_amount,
            currency_code,
            trip_type,
            cabin_class,
            fare_brand_id

        )
        VALUES (
            $1,$2,$3,
            'PENDING_PAYMENT',
            'UNTICKETED',
            $4,$5,$6,$7,$8
        )
        RETURNING *;
        `;

        const bookingResult =
        await client.query(

            bookingQuery,

            [
                pnr_reference,
                user_email_address,
                selected_flight_id,
                total_payment_amount,
                currency_code,
                trip_type,
                cabin_class,
                fare_brand_id
            ]

        );

        const booking =
        bookingResult.rows[0];

        for(const passenger_id
            of passenger_ids) {

            await client.query(

                `
                INSERT INTO
                booking_passengers (

                    booking_id,
                    passenger_id

                )
                VALUES (
                    $1,
                    $2
                )
                `,

                [
                    booking.booking_id,
                    passenger_id
                ]

            );

        }

        await client.query(
            "COMMIT"
        );

        return booking;

    }
    catch(error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;

    }
    finally {

        client.release();

    }

};

module.exports = {
    createBooking
};