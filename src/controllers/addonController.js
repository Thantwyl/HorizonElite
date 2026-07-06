const {
    createAddon,
    getBookingAddons,
    getBaggageOptions,
    savePassengerBaggage
} = require("../services/addonService");

/**
 * Add Addon (Seat / Meal / etc.)
 */
const addAddon = async (req, res) => {

    try {

        const addon = await createAddon(req.body);

        res.status(201).json({
            message: "Addon added successfully",
            data: addon
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to add addon"
        });

    }
};

/**
 * Get booking addons (Manage Booking)
 */
const getAddons = async (req, res) => {

    try {

        const { booking_id } = req.params;

        const addons = await getBookingAddons(booking_id);

        res.json({
            message: "Booking addons fetched",
            data: addons
        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to fetch addons"
        });

    }
};

/*
|--------------------------------------------------------------------------
| Get Baggage Options
|--------------------------------------------------------------------------
*/

const fetchBaggageOptions = async (req, res) => {

    try {

        const baggageOptions =
            await getBaggageOptions();

        return res.status(200).json({

            message:
                "Baggage options fetched successfully",

            data:
                baggageOptions

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            message:
                "Failed to fetch baggage options"

        });

    }

};

/*
|--------------------------------------------------------------------------
| Select Passenger Baggage
|--------------------------------------------------------------------------
*/

const selectPassengerBaggage = async (

    req,

    res

) => {

    try {

        const {

            booking_id,

            passenger_id,

            selected_flight_id,

            baggage_code

        } = req.body;

        /*
        ------------------------------------
        Basic Validation
        ------------------------------------
        */

        if (

            !booking_id ||

            !passenger_id ||

            !selected_flight_id ||

            !baggage_code

        ) {

            return res.status(400).json({

                message:

                "booking_id, passenger_id, selected_flight_id and baggage_code are required."

            });

        }

        const result = await savePassengerBaggage(

            booking_id,

            passenger_id,

            selected_flight_id,

            baggage_code

        );

        return res.status(200).json({

            message:

            `Passenger baggage ${result.action.toLowerCase()} successfully.`,

            data: result

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            message:

            error.message

        });

    }

};

module.exports = {
    addAddon,
    getAddons,
    fetchBaggageOptions,
    selectPassengerBaggage
};