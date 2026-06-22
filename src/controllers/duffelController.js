const {
    searchFlights
}
=
require("../services/duffelService");

const {
    mapDuffelOffers
}
=
require("../services/flightResultMapper");

const search =
async (req, res) => {

    try {

        const {
            origin,
            destination,
            departure_date
        } = req.body;

        const duffelResponse =
        await searchFlights(
            origin,
            destination,
            departure_date
        );

        const offers =
        duffelResponse.data.offers ||
        duffelResponse.offers ||
        [];

        const results =
        mapDuffelOffers(
            offers
        );

        return res.status(200).json({
            total_results:
                results.length,
            results
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
    search
};