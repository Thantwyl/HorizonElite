const {
    createOfferRequest,
    getOffersByRequestId
} = require(
    "../services/duffelService"
);

const {
    saveFlightResult,
    saveResultSegment
} = require(
    "../services/flightResultService"
);

const searchFlights =
async (req, res) => {

    try {

        const {
            flight_search_id,
            origin,
            destination,
            departure_date,
            adults,
            cabin_class
        } = req.body;

        const offerRequest =
        await createOfferRequest(

            [
                {
                    origin,
                    destination,
                    departure_date
                }
            ],

            Array(adults)
                .fill({
                    type: "adult"
                }),

            cabin_class
        );

        const offerRequestId =
            offerRequest.data.id;

        const offersResponse =
        await getOffersByRequestId(
            offerRequestId
        );

        const offers =
            offersResponse.data;

        for (const offer of offers) {

            const flightResultId =
            await saveFlightResult(
                flight_search_id,
                offer
            );

            let segmentCounter = 1;

            for (
                const slice
                of offer.slices
            ) {

                for (
                    const segment
                    of slice.segments
                ) {

                    await saveResultSegment(
                        flightResultId,
                        segment,
                        segmentCounter++
                    );

                }

            }

        }

        res.status(200).json({
            message:
            "Flight Results Saved",

            total_results:
            offers.length
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
            error.response?.data ||
            error.message
        });

    }

};

const pool = require("../config/db");

const getResultsBySearchId =
async (req, res) => {

    try {

        const { flight_search_id } =
            req.params;

        const results = await pool.query(
            `
            SELECT
                fr.flight_result_id,
                fr.flight_offer_id,
                fr.airline_name,
                fr.total_duration,
                fr.total_stop_count,
                fr.cabin_class,
                fr.total_fare_price,
                fr.currency_code,
                fr.direct_flight_flag,
                fr.flight_result_status,
                fr.result_generated_timestamp,
                json_agg(
                    json_build_object(
                        'segment_number',
                        rs.segment_number,
                        'departure_airport_code',
                        rs.departure_airport_code,
                        'arrival_airport_code',
                        rs.arrival_airport_code,
                        'departure_datetime',
                        rs.departure_datetime,
                        'arrival_datetime',
                        rs.arrival_datetime,
                        'marketing_carrier_code',
                        rs.marketing_carrier_code,
                        'flight_number',
                        rs.flight_number,
                        'segment_duration',
                        rs.segment_duration
                    )
                    ORDER BY rs.segment_number
                ) AS segments
            FROM flight_results fr
            LEFT JOIN result_segments rs
                ON fr.flight_result_id =
                    rs.flight_result_id
            WHERE fr.flight_search_id = $1
            GROUP BY fr.flight_result_id
            ORDER BY fr.total_fare_price ASC
            `,
            [flight_search_id]
        );

        return res.status(200).json({
            flight_search_id,
            total_results: results.rows.length,
            results: results.rows
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: error.message
        });

    }

};

module.exports = {
    searchFlights,
    getResultsBySearchId
};