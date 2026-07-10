const {
    getFlightStatus
} = require("../services/flightStatusService");

const checkFlightStatus = async (
    req,
    res
) => {

    try {

        const {

            flight_number,

            departure_date

        } = req.query;

        if (
            !flight_number ||
            !departure_date
        ) {

            return res.status(400).json({

                message:
                "flight_number and departure_date are required"

            });

        }

        const data =
        await getFlightStatus(

            flight_number,

            departure_date

        );

        return res.status(200).json({

            message:
            "Flight status retrieved successfully",

            data

        });

    }

    catch(error){

        console.error(error);

        return res.status(500).json({

            message:
            "Unable to retrieve flight status"

        });

    }

};

module.exports = {

    checkFlightStatus

};