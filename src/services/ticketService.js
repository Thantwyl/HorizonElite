const pool = require("../config/db");

const generateTicketPDF =
require("../utils/pdfGenerator");

const generateTicket =
async (bookingId) => {

    const result =
    await pool.query(

        `
        SELECT

            b.booking_id,

            b.pnr_reference,

            b.booking_status,

            b.ticketing_status,

            b.ticket_number,

            b.total_payment_amount,

            b.currency_code,

            sf.airline_name,

            sf.flight_number,

            sf.origin_airport_code,

            sf.destination_airport_code,

            sf.departure_datetime,

            sf.arrival_datetime,

            p.pi_first_name,

            p.pi_last_name,

            p.pi_passport_number,

            p.pi_contact_email

        FROM bookings b

        INNER JOIN booking_passengers bp

            ON bp.booking_id = b.booking_id

        INNER JOIN passengers p

            ON p.passenger_id = bp.passenger_id

        INNER JOIN selected_flights sf

            ON sf.selected_flight_id = b.selected_flight_id

        WHERE b.booking_id = $1

        LIMIT 1
        `,
        [bookingId]

    );

    if(result.rows.length === 0){

        throw new Error("Booking not found");

    }

    const booking =
    result.rows[0];

    return await generateTicketPDF({

        passenger_name:
        `${booking.pi_first_name} ${booking.pi_last_name}`,

        passport_number:
        booking.pi_passport_number,

        email:
        booking.pi_contact_email,

        pnr:
        booking.pnr_reference,

        ticket_number:
        booking.ticket_number,

        booking_status:
        booking.booking_status,

        ticketing_status:
        booking.ticketing_status,

        airline:
        booking.airline_name,

        flight_number:
        booking.flight_number,

        origin:
        booking.origin_airport_code,

        destination:
        booking.destination_airport_code,

        departure:
        booking.departure_datetime,

        arrival:
        booking.arrival_datetime,

        amount:
        booking.total_payment_amount,

        currency:
        booking.currency_code

    });

};

module.exports = {

    generateTicket

};