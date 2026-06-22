const passengerService =
require("../services/passengerService");

const createPassenger =
async (req, res) => {

    try {

        const passenger =
        await passengerService.createPassenger(
            req.body
        );

        res.status(201).json({
            message:
            "Passenger created successfully",
            passenger
        });

    } catch(error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

const getPassengersBySelectedFlight =
async (req, res) => {

    try {

        const passengers =
        await passengerService
        .getPassengersBySelectedFlight(
            req.params.selectedFlightId
        );

        res.status(200).json(passengers);

    } catch(error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

const deletePassenger =
async (req, res) => {

    try {

        const passenger =
        await passengerService
        .deletePassenger(
            req.params.passengerId
        );

        res.status(200).json({
            message:
            "Passenger removed successfully",
            passenger
        });

    } catch(error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

module.exports = {
    createPassenger,
    getPassengersBySelectedFlight,
    deletePassenger
};