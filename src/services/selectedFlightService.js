const pool =
require("../config/db");

const createSelectedFlight =
async (data) => {

    const result =
    await pool.query(

        `
        INSERT INTO selected_flights
        (
            flight_search_id,
            flight_result_id,
            flight_offer_id,
            selected_trip_type,
            airline_name,
            flight_number,
            origin_airport_code,
            destination_airport_code,
            departure_datetime,
            arrival_datetime,
            cabin_class,
            baggage_allowance,
            refundable_status,
            selected_fare_price,
            currency_code
        )
        VALUES
        (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9,$10,
            $11,$12,$13,$14,$15
        )
        RETURNING *
        `,

        [
            data.flight_search_id,
            data.flight_result_id,
            data.flight_offer_id,
            data.selected_trip_type,
            data.airline_name,
            data.flight_number,
            data.origin_airport_code,
            data.destination_airport_code,
            data.departure_datetime,
            data.arrival_datetime,
            data.cabin_class,
            data.baggage_allowance,
            data.refundable_status,
            data.selected_fare_price,
            data.currency_code
        ]
    );

    return result.rows[0];

};

module.exports = {
    createSelectedFlight
};