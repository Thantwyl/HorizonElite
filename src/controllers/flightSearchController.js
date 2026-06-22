const flightSearchService =
require("../services/flightSearchService");

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

        const flightSearchId =
            await flightSearchService
            .createFlightSearch(
                req.user.email_address,
                req.body
            );

        return res.status(201).json({

            message:
                "Flight search created successfully",

            flight_search_id:
                flightSearchId

        });

    }
    catch(error) {

        console.error(error);

        return res.status(500).json({
            error: error.message
        });

    }

};

module.exports = {
    createFlightSearch
};