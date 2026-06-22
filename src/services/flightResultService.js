const pool =
require("../../config/db");

const saveFlightResult =
async (
    flightSearchId,
    offer
) => {

    const result =
    await pool.query(
        `
        INSERT INTO flight_results
        (
            flight_search_id,
            flight_offer_id,
            airline_name,
            total_duration,
            total_stop_count,
            cabin_class,
            total_fare_price,
            currency_code,
            direct_flight_flag
        )
        VALUES
        (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9
        )
        RETURNING flight_result_id
        `,
        [
            flightSearchId,

            offer.id,

            offer.owner?.name,

            offer.slices?.[0]?.duration,

            offer.slices?.[0]?.segments
                ?.length - 1,

            offer.slices?.[0]?.segments?.[0]
                ?.passengers?.[0]
                ?.cabin_class
                ?.toUpperCase(),

            offer.total_amount,

            offer.total_currency,

            offer.slices?.[0]?.segments
                ?.length === 1
        ]
    );

    return result.rows[0]
        .flight_result_id;
};

const saveResultSegment =
async (
    flightResultId,
    segment,
    segmentNumber
) => {

    await pool.query(
        `
        INSERT INTO result_segments
        (
            flight_result_id,
            segment_number,

            departure_airport_code,
            arrival_airport_code,

            departure_datetime,
            arrival_datetime,

            marketing_carrier_code,
            operating_carrier_code,

            flight_number,

            aircraft_code,
            aircraft_type,

            segment_duration
        )
        VALUES
        (
            $1,$2,$3,$4,$5,$6,
            $7,$8,$9,$10,$11,
            $12
        )
        `,
        [
            flightResultId,

            segmentNumber,

            segment.origin?.iata_code || 'UNK',

            segment.destination?.iata_code || 'UNK',

            segment.departing_at,

            segment.arriving_at,

            segment.marketing_carrier?.iata_code || 'XX',

            segment.operating_carrier?.iata_code || null,

            segment.marketing_carrier_flight_number || 'UNKNOWN',

            segment.aircraft?.iata_code || null,

            segment.aircraft?.name || null,

            segment.duration || 'PT0H'
        ]
    );
};

module.exports = {
    saveFlightResult,
    saveResultSegment
};