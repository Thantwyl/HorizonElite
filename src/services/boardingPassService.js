const pool = require("../config/db");
const generateBoardingPassPDF = require("../utils/boardingPassPdfGenerator");

const getBoardingPass = async (bookingId) => {
    const result = await pool.query(`
        SELECT b.booking_id, b.pnr_reference, b.booking_status, b.ticketing_status,
            b.user_email_address,
            sf.flight_number, sf.origin_airport_code, sf.destination_airport_code,
            sf.departure_datetime, p.pi_title, p.pi_first_name, p.pi_last_name,
            p.pi_contact_email,
            EXISTS (
                SELECT 1 FROM booking_checkins ci WHERE ci.booking_id = b.booking_id
            ) AS is_checked_in
        FROM bookings b
        INNER JOIN booking_passengers bp ON bp.booking_id = b.booking_id
        INNER JOIN passengers p ON p.passenger_id = bp.passenger_id
        INNER JOIN selected_flights sf ON sf.selected_flight_id = b.selected_flight_id
        WHERE b.booking_id = $1
        ORDER BY bp.passenger_id LIMIT 1`, [bookingId]);
    if (!result.rows.length) throw new Error("Booking not found");
    const booking = result.rows[0];
    if (booking.booking_status !== "TICKETED" || booking.ticketing_status !== "TICKETED") {
        throw new Error("Boarding pass is available only after the booking is ticketed");
    }
    if (!booking.is_checked_in) throw new Error("Please complete online check-in before requesting a boarding pass");
    booking.recipient_email = booking.user_email_address || booking.pi_contact_email;
    if (!booking.recipient_email) throw new Error("No email address is saved for this booking");
    return booking;
};

const generateBoardingPass = async (bookingId) => {
    const booking = await getBoardingPass(bookingId);
    return generateBoardingPassPDF({
        passenger_name: [booking.pi_title, booking.pi_first_name, booking.pi_last_name].filter(Boolean).join(" "),
        pnr: booking.pnr_reference, flight_number: booking.flight_number,
        origin: booking.origin_airport_code, destination: booking.destination_airport_code,
        departure: booking.departure_datetime
    });
};

module.exports = { getBoardingPass, generateBoardingPass };
