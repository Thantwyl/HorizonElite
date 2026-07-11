const pool = require("../config/db");
const bookingService = require("./bookingService");

const normalize = (value) => String(value || "").trim();

const getEligibility = (details, checkedIn) => {
    const departure = new Date(details.flight.departure);
    if (Number.isNaN(departure.getTime())) return { eligible: false, reason: "Flight departure time is unavailable" };
    if (details.booking.booking_status !== "TICKETED" || details.booking.ticketing_status !== "TICKETED") {
        return { eligible: false, reason: "This booking has not been ticketed yet" };
    }
    if (checkedIn) return { eligible: true, already_checked_in: true, reason: "Check-in is already complete" };

    const minutesUntilDeparture = (departure.getTime() - Date.now()) / 60000;
    if (minutesUntilDeparture > 48 * 60) {
        return { eligible: false, reason: "Online check-in opens 48 hours before departure", opens_at: new Date(departure.getTime() - 48 * 60 * 60000).toISOString() };
    }
    if (minutesUntilDeparture < 90) {
        return { eligible: false, reason: minutesUntilDeparture < 0 ? "This flight has already departed" : "Online check-in closed 90 minutes before departure" };
    }
    return { eligible: true, already_checked_in: false, reason: "Online check-in is available" };
};

const lookup = async (pnr, lastName) => {
    const normalizedPnr = normalize(pnr).toUpperCase();
    const normalizedLastName = normalize(lastName);
    if (!normalizedPnr || !normalizedLastName) {
        const error = new Error("PNR and passenger last name are required"); error.statusCode = 400; throw error;
    }
    const details = await bookingService.getManageBooking(normalizedPnr, normalizedLastName);
    const checkin = await pool.query("SELECT checked_in_at FROM booking_checkins WHERE booking_id = $1", [details.booking.booking_id]);
    return { details, eligibility: getEligibility(details, checkin.rows.length > 0), checked_in_at: checkin.rows[0]?.checked_in_at || null };
};

const confirm = async (pnr, lastName) => {
    const result = await lookup(pnr, lastName);
    if (!result.eligibility.eligible) {
        const error = new Error(result.eligibility.reason); error.statusCode = 409; throw error;
    }
    if (!result.eligibility.already_checked_in) {
        const saved = await pool.query(`
            INSERT INTO booking_checkins (booking_id) VALUES ($1)
            ON CONFLICT (booking_id) DO UPDATE SET checked_in_at = booking_checkins.checked_in_at
            RETURNING checked_in_at`, [result.details.booking.booking_id]);
        result.checked_in_at = saved.rows[0].checked_in_at;
    }
    return { ...result, eligibility: { ...result.eligibility, already_checked_in: true, reason: "Check-in is complete" } };
};

module.exports = { lookup, confirm };
