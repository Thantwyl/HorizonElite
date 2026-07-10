const pool =
require("../config/db");

const { getPaidBookingAddons } =
require("./addonService");

const generatePNR =
require("../utils/generatePNR");

const getPassengerType =
(passengerTypeCode) => {
    const value =
    (passengerTypeCode || "")
    .toString()
    .trim()
    .toUpperCase();

    if (
        value === "INF" ||
        value === "INFANT"
    ) {
        return "infant";
    }

    if (
        value === "CHD" ||
        value === "CNN" ||
        value === "CHILD"
    ) {
        return "child";
    }

    return "adult";
};

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

    const client = await pool.connect();

    console.log("========== BOOKING SERVICE ==========");
    console.log({
        user_email_address,
        selected_flight_id,
        passenger_ids,
        total_payment_amount,
        currency_code,
        trip_type,
        cabin_class,
        fare_brand_id
    });
    console.log("=====================================");

    try {

        await client.query("BEGIN");
        console.log("STEP 1 - BEGIN finished");

        const userResult = await client.query(
            `
            SELECT email_address
            FROM users
            WHERE email_address = $1
            `,
            [user_email_address]
            );

            const is_guest =
            userResult.rows.length === 0;

            console.log("STEP 2 - User Checked");

            console.log({
                is_guest
            });

        const selectedFlightQuery = await client.query(
            `
            SELECT
                sf.selected_flight_id,
                sf.flight_search_id,
                fs.adult_passenger_count,
                fs.child_passenger_count,
                fs.infant_passenger_count
            FROM selected_flights sf
            INNER JOIN flight_searches fs
                ON sf.flight_search_id = fs.flight_search_id
            WHERE sf.selected_flight_id = $1
            `,
            [selected_flight_id]
        );

        console.log("STEP 3 - Selected flight verified");

        if (selectedFlightQuery.rows.length === 0) {
            throw new Error("Selected flight not found");
        }

        if (!Array.isArray(passenger_ids) || passenger_ids.length === 0) {
            throw new Error("Passenger ids required");
        }

        const uniquePassengerIds = [...new Set(passenger_ids)];

        const passengerResult = await client.query(
            `
            SELECT
                passenger_id,
                selected_flight_id,
                pi_passenger_type_code
            FROM passengers
            WHERE passenger_id = ANY($1::uuid[])
            `,
            [uniquePassengerIds]
        );

        console.log("STEP 4 - Passenger query finished");

        if (passengerResult.rows.length !== uniquePassengerIds.length) {
            throw new Error("Passenger not found");
        }

        const expected = selectedFlightQuery.rows[0];

        const actualCount = {
            adult: 0,
            child: 0,
            infant: 0
        };

        for (const passengerRow of passengerResult.rows) {

            const type =
                getPassengerType(
                    passengerRow.pi_passenger_type_code
                );

            actualCount[type]++;

        }

        const expectedCount = {
            adult: Number(expected.adult_passenger_count || 0),
            child: Number(expected.child_passenger_count || 0),
            infant: Number(expected.infant_passenger_count || 0)
        };

        for (const type of ["adult", "child", "infant"]) {

            if (actualCount[type] !== expectedCount[type]) {

                throw new Error(
                    `${type} passenger count mismatch`
                );

            }

        }

        const pnr_reference = generatePNR();

        console.log("STEP 4.5 - Ready to insert booking");

        const bookingResult = await client.query(
            `
            INSERT INTO bookings
            (
                pnr_reference,
                user_email_address,
                is_guest,
                selected_flight_id,
                booking_status,
                ticketing_status,
                total_payment_amount,
                currency_code,
                trip_type,
                cabin_class,
                fare_brand_id
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                'PENDING_PAYMENT',
                'UNTICKETED',
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING *;
            `,
            [
                pnr_reference,
                user_email_address,
                is_guest,
                selected_flight_id,
                total_payment_amount,
                currency_code,
                trip_type,
                cabin_class,
                fare_brand_id
            ]
        );

        console.log("STEP 5 - Booking inserted");

        const booking = bookingResult.rows[0];

        console.log("Booking ID:", booking.booking_id);

        for (const passenger_id of uniquePassengerIds) {

            console.log("STEP 5.1 - Linking passenger", passenger_id);

            await client.query(
                `
                INSERT INTO booking_passengers
                (
                    booking_id,
                    passenger_id
                )
                VALUES
                (
                    $1,
                    $2
                )
                `,
                [
                    booking.booking_id,
                    passenger_id
                ]
            );

            console.log("Passenger linked:", passenger_id);

        }

        console.log("STEP 6 - About to COMMIT");

        await client.query("COMMIT");

        console.log("STEP 7 - COMMIT successful");

        console.log("STEP 8 - Returning booking");

        return booking;

    }
    catch (error) {

        console.log("BOOKING ERROR:");
        console.log(error);

        await client.query("ROLLBACK");

        throw error;

    }
    finally {

        client.release();

    }

};

const getManageBooking = async (pnr, lastName) => {

    const client = await pool.connect();

    try {

        const result = await client.query(
            `
            SELECT
                b.booking_id,
                b.selected_flight_id,
                b.pnr_reference,
                b.booking_status,
                b.ticketing_status,
                b.total_payment_amount,
                b.currency_code,
                b.trip_type,
                b.cabin_class,
                b.is_guest,

                sf.airline_name,
                sf.flight_number,
                sf.origin_airport_code,
                sf.destination_airport_code,
                sf.departure_datetime,
                sf.arrival_datetime,

                p.passenger_id,
                p.pi_first_name,
                p.pi_last_name,
                p.pi_passenger_type_code,
                p.pi_contact_email,
                p.pi_contact_phone,

                rs.segment_number,
                rs.departure_airport_code,
                rs.arrival_airport_code,
                rs.departure_datetime AS segment_departure,
                rs.arrival_datetime AS segment_arrival

            FROM bookings b

            JOIN selected_flights sf
                ON sf.selected_flight_id = b.selected_flight_id

            JOIN booking_passengers bp
                ON bp.booking_id = b.booking_id

            JOIN passengers p
                ON p.passenger_id = bp.passenger_id

            LEFT JOIN flight_results fr
                ON fr.flight_search_id = sf.flight_search_id

            LEFT JOIN result_segments rs
                ON rs.flight_result_id = sf.flight_result_id

            WHERE b.pnr_reference = $1
            AND LOWER(p.pi_last_name) = LOWER($2)
            `,
            [pnr, lastName]
        );

        if (result.rows.length === 0) {
            throw new Error("Booking not found");
        }

        // 🧠 GROUP DATA PROPERLY (IMPORTANT)
        const booking = {
            booking_id: result.rows[0].booking_id,
            selected_flight_id: result.rows[0].selected_flight_id,
            pnr_reference: result.rows[0].pnr_reference,
            booking_status: result.rows[0].booking_status,
            ticketing_status: result.rows[0].ticketing_status,
            total_payment_amount: result.rows[0].total_payment_amount,
            currency_code: result.rows[0].currency_code,
            trip_type: result.rows[0].trip_type,
            cabin_class: result.rows[0].cabin_class,
            is_guest: result.rows[0].is_guest
        };

        const flight = {
            airline_name: result.rows[0].airline_name,
            flight_number: result.rows[0].flight_number,
            origin: result.rows[0].origin_airport_code,
            destination: result.rows[0].destination_airport_code,
            departure: result.rows[0].departure_datetime,
            arrival: result.rows[0].arrival_datetime
        };

        const passengersMap = new Map();

        const segments = [];

        for (const row of result.rows) {

            // passengers unique
            if (!passengersMap.has(row.passenger_id)) {
                passengersMap.set(row.passenger_id, {
                    passenger_id: row.passenger_id,
                    first_name: row.pi_first_name,
                    last_name: row.pi_last_name,
                    type: row.pi_passenger_type_code,
                    email: row.pi_contact_email,
                    phone: row.pi_contact_phone
                });
            }

            // segments unique
            if (row.segment_number && !segments.find(s => s.segment_number === row.segment_number)) {
                segments.push({
                    segment_number: row.segment_number,
                    departure: row.segment_departure,
                    arrival: row.segment_arrival,
                    from: row.departure_airport_code,
                    to: row.arrival_airport_code
                });
            }
        }

        const addons =
            await getPaidBookingAddons(booking.booking_id);

        return {
            booking,
            flight,
            passengers: Array.from(passengersMap.values()),
            segments,
            addons
        };

    } finally {
        client.release();
    }
};


module.exports = {
    createBooking,
    getManageBooking
};
