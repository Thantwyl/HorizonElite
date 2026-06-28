const pool = require("../config/db");

const createPassenger = async (passengerData) => {

    const {
        selected_flight_id,
        pi_title,
        pi_first_name,
        pi_middle_name,
        pi_last_name,
        pi_gender,
        pi_date_of_birth,
        pi_nationality,
        pi_passenger_type_code,
        pi_passport_number,
        pi_passport_issuing_country,
        pi_passport_expiry_date,
        pi_contact_email,
        pi_contact_phone
    } = passengerData;

    const selectedFlightResult = await pool.query(
        `
        SELECT selected_flight_id
        FROM selected_flights
        WHERE selected_flight_id = $1
        `,
        [selected_flight_id]
    );

    if (selectedFlightResult.rows.length === 0) {
        const error = new Error(
            "selected_flight_id not found"
        );
        error.statusCode = 400;
        throw error;
    }

    const result = await pool.query(
        `
        INSERT INTO passengers
        (
            selected_flight_id,
            pi_title,
            pi_first_name,
            pi_middle_name,
            pi_last_name,
            pi_gender,
            pi_date_of_birth,
            pi_nationality,
            pi_passenger_type_code,
            pi_passport_number,
            pi_passport_issuing_country,
            pi_passport_expiry_date,
            pi_contact_email,
            pi_contact_phone
        )
        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,
            $8,$9,$10,$11,$12,$13,$14
        )
        RETURNING *
        `,
        [
            selected_flight_id,
            pi_title,
            pi_first_name,
            pi_middle_name,
            pi_last_name,
            pi_gender,
            pi_date_of_birth,
            pi_nationality,
            pi_passenger_type_code,
            pi_passport_number,
            pi_passport_issuing_country,
            pi_passport_expiry_date,
            pi_contact_email,
            pi_contact_phone
        ]
    );

    return result.rows[0];
};

const getPassengersBySelectedFlight =
async (selectedFlightId) => {

    const result = await pool.query(
        `
        SELECT *
        FROM passengers
        WHERE selected_flight_id = $1
        `,
        [selectedFlightId]
    );

    return result.rows;
};

const deletePassenger =
async (passengerId) => {

    const result = await pool.query(
        `
        DELETE FROM passengers
        WHERE passenger_id = $1
        RETURNING *
        `,
        [passengerId]
    );

    return result.rows[0];
};

module.exports = {
    createPassenger,
    getPassengersBySelectedFlight,
    deletePassenger
};