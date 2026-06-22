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

module.exports = {
    searchFlights
};