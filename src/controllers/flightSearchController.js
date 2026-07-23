const flightSearchService =
require("../services/flightSearchService");

const duffelService =
require("../services/duffelService");

const flightResultMapper =
require("../services/flightResultMapper");

const flightResultService =
require("../services/flightResultService");

const createFlightSearch = async (
    req,
    res
) => {

    try {

        const { segments } = req.body;

        if (
            !segments ||
            segments.length === 0
        ) {

            return res.status(400).json({
                message:
                    "At least one segment is required"
            });

        }

        // Create flight search record
        const flightSearchId =
            await flightSearchService
            .createFlightSearch(
                req.user?.email_address || null,
                req.body
            );

        // Get first segment to search Duffel
        const firstSegment = segments[0];

        // Call Duffel API
        let duffelResults = [];
        try {
            const duffelResponse =
                await duffelService
                .searchFlights(
                    firstSegment.origin_airport_code,
                    firstSegment.destination_airport_code,
                    firstSegment.departure_date,
                    {
                        adult_passenger_count:
                        req.body.adult_passenger_count,

                        child_passenger_count:
                        req.body.child_passenger_count,

                        infant_passenger_count:
                        req.body.infant_passenger_count,

                        cabin_class:
                        req.body.cabin_class
                    }
                );

            // Debug: log response structure
            // console.log(
            //     "Duffel Response Structure:",
            //     JSON.stringify(duffelResponse, null, 2).slice(0, 500)
            // );

            // Handle different response structures
            const offers = 
                duffelResponse.offers || 
                duffelResponse.data?.offers || 
                [];

            if (!Array.isArray(offers)) {
                console.warn(
                    "Offers is not an array:",
                    typeof offers
                );
                duffelResults = [];
            } else {

                // Save each offer to DB and map for response
                for (const offer of offers) {
                    try {

                        const flightResultId =
                            await flightResultService
                            .saveFlightResult(
                                flightSearchId,
                                offer
                            );

                        const segments =
                            offer.slices?.[0]?.segments || [];

                        for (
                            let i = 0;
                            i < segments.length;
                            i++
                        ) {
                            try {
                                await flightResultService
                                .saveResultSegment(
                                    flightResultId,
                                    segments[i],
                                    i + 1
                                );
                            } catch (segErr) {
                                console.error(
                                    "Segment save error:",
                                    segErr.message
                                );
                            }
                        }

                        const mapped =
                            flightResultMapper
                            .mapDuffelOffer(offer);

                        duffelResults.push({
                            flight_result_id:
                                flightResultId,
                            ...mapped
                        });

                    } catch (saveErr) {
                        console.error(
                            "Result save error:",
                            saveErr.message
                        );
                        duffelResults.push(
                            flightResultMapper
                            .mapDuffelOffer(offer)
                        );
                    }
                }

            }
        }
        catch(duffelError) {
            console.error(
                "Duffel API Error:",
                duffelError.message
            );
            console.error(
                "Full error:",
                duffelError
            );
            // Don't fail entire request if Duffel fails
            duffelResults = [];
        }

        return res.status(201).json({

            message:
                "Flight search created successfully",

            flight_search_id:
                flightSearchId,

            results:
                duffelResults

        });

    }
    catch(error) {

        console.error(error);

        return res.status(500).json({
            error: error.message
        });

    }

};

const getPopularRoutes = async (
    req,
    res
) => {

    try {

        const routes =
            await flightSearchService
            .getPopularRoutes(req.query.limit);

        return res.status(200).json({
            message:
                "Popular routes retrieved successfully",
            data:
                routes
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
    createFlightSearch,
    getPopularRoutes
};
