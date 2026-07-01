const pool =
require("../config/db");

const searchBooking = async (
    pnr_reference,
    passenger_last_name
) => {

    const result =
    await pool.query(

        `
        SELECT

            b.*,

            p.pi_first_name,
            p.pi_last_name,
            p.pi_contact_email

        FROM bookings b

        INNER JOIN booking_passengers bp

            ON b.booking_id = bp.booking_id

        INNER JOIN passengers p

            ON bp.passenger_id = p.passenger_id

        WHERE

            b.pnr_reference = $1

        AND

            LOWER(p.pi_last_name)
            =
            LOWER($2)

        LIMIT 1
        `,

        [

            pnr_reference,
            passenger_last_name

        ]

    );

    if(result.rows.length === 0){

        throw new Error(
            "Booking not found"
        );

    }

    return result.rows[0];

};

module.exports = {

    searchBooking

};