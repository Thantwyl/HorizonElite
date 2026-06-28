const passengerService =
require("../services/passengerService");

const {
    validatePassengerPayload
} = require(
    "../../validations/passengerValidation"
);

const createPassenger =
async (req, res) => {

    try {

        const {
            errors,
            normalized
        } = validatePassengerPayload(
            req.body
        );

        if (errors.length > 0) {
            return res.status(400).json({
                error: "Validation failed",
                details: errors
            });
        }

        const passenger =
        await passengerService.createPassenger(
            normalized
        );

        res.status(201).json({
            message:
            "Passenger created successfully",
            passenger
        });

    } catch(error) {

        console.error(error);

        res.status(
            error.statusCode || 500
        ).json({
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

        res.status(
            error.statusCode || 500
        ).json({
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

        res.status(
            error.statusCode || 500
        ).json({
            error: error.message
        });

    }

};

module.exports = {
    createPassenger,
    getPassengersBySelectedFlight,
    deletePassenger
};