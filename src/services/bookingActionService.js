const pool = require("../config/db");

const getBookingActions = async (
    pnr,
    lastName
) => {

    const result = await pool.query(
        `
        SELECT

            b.booking_status,
            b.ticketing_status,
            b.record_active,
            sf.refundable_status

        FROM bookings b

        JOIN booking_passengers bp
            ON bp.booking_id = b.booking_id

        JOIN passengers p
            ON p.passenger_id = bp.passenger_id

        JOIN selected_flights sf
            ON sf.selected_flight_id = b.selected_flight_id

        WHERE
            b.pnr_reference = $1
        AND
            LOWER(p.pi_last_name) = LOWER($2)

        LIMIT 1
        `,
        [pnr, lastName]
    );

    if (result.rows.length === 0) {
        throw new Error("Booking not found");
    }

    const booking = result.rows[0];

    const actions = {

        download_eticket: false,

        download_invoice: false,

        cancel_booking: false,

        change_booking: false,

        check_in: false

    };

    /*
    -----------------------------------
    PENDING PAYMENT
    -----------------------------------
    */

    if (
        booking.booking_status ===
        "PENDING_PAYMENT"
    ) {

        actions.cancel_booking = true;

    }

    /*
    -----------------------------------
    PAID
    -----------------------------------
    */

    if (
        booking.booking_status ===
        "PAID"
    ) {

        actions.download_invoice = true;

        actions.cancel_booking =
            booking.refundable_status;

    }

    /*
    -----------------------------------
    TICKETED
    -----------------------------------
    */

    if (
        booking.ticketing_status ===
        "TICKETED"
    ) {

        actions.download_eticket = true;

        actions.download_invoice = true;

        actions.check_in = true;

        actions.cancel_booking =
            booking.refundable_status;

    }

    return {

        booking_status:
            booking.booking_status,

        ticketing_status:
            booking.ticketing_status,

        actions

    };

};

module.exports = {

    getBookingActions

};