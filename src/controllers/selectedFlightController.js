const {
    createSelectedFlight
}
=
require(
    "../services/selectedFlightService"
);

const selectFlight =
async (req, res) => {

    try {

        const {

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

        } = req.body;

        const selectedFlight =
        await createSelectedFlight({

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

        });

        return res.status(201).json({

            message:
            "Flight selected successfully",

            selectedFlight

        });

    }
    catch(error) {

        console.error(error);

        return res.status(500).json({

            error:
            error.message

        });

    }

};

module.exports = {
    selectFlight
};