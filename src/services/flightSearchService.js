const pool = require("../config/db");

const createFlightSearch = async (
    userEmail,
    flightSearchData
) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const {
            trip_type,
            adult_passenger_count,
            child_passenger_count,
            infant_passenger_count,
            cabin_class,
            preferred_airline,
            direct_flight_only,
            promo_fare_type,
            currency_code,
            segments
        } = flightSearchData;

        const searchResult =
            await client.query(
                `
                INSERT INTO flight_searches
                (
                    user_email_address,
                    trip_type,
                    adult_passenger_count,
                    child_passenger_count,
                    infant_passenger_count,
                    cabin_class,
                    preferred_airline,
                    direct_flight_only,
                    promo_fare_type,
                    currency_code
                )
                VALUES
                (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
                )
                RETURNING flight_search_id
                `,
                [
                    userEmail,
                    trip_type,
                    adult_passenger_count,
                    child_passenger_count,
                    infant_passenger_count,
                    cabin_class,
                    preferred_airline,
                    direct_flight_only,
                    promo_fare_type,
                    currency_code
                ]
            );

        const flightSearchId =
            searchResult.rows[0].flight_search_id;

        for (
            let i = 0;
            i < segments.length;
            i++
        ) {

            await client.query(
                `
                INSERT INTO flight_search_segments
                (
                    flight_search_id,
                    segment_number,
                    origin_airport_code,
                    destination_airport_code,
                    departure_date
                )
                VALUES
                (
                    $1,$2,$3,$4,$5
                )
                `,
                [
                    flightSearchId,
                    i + 1,
                    segments[i].origin_airport_code,
                    segments[i].destination_airport_code,
                    segments[i].departure_date
                ]
            );

        }

        await client.query("COMMIT");

        return flightSearchId;

    }
    catch(error) {

        await client.query("ROLLBACK");

        throw error;

    }
    finally {

        client.release();

    }

};

const getPopularRoutes = async (limit = 6) => {
    const normalizedLimit =
        Math.min(Math.max(Number(limit) || 6, 1), 12);

    const result = await pool.query(
        `
        SELECT
            TRIM(origin_airport_code) AS origin_airport_code,
            TRIM(destination_airport_code) AS destination_airport_code,
            COUNT(*)::int AS search_count,
            MAX(fs.flight_search_timestamp) AS last_searched_at
        FROM flight_search_segments fss
        INNER JOIN flight_searches fs
            ON fs.flight_search_id = fss.flight_search_id
        WHERE fss.segment_number = 1
        GROUP BY
            TRIM(origin_airport_code),
            TRIM(destination_airport_code)
        ORDER BY
            search_count DESC,
            last_searched_at DESC
        LIMIT $1
        `,
        [normalizedLimit]
    );

    return result.rows;
};

module.exports = {
    createFlightSearch,
    getPopularRoutes
};
