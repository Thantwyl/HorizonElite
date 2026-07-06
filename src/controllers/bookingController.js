const bookingService =
require("../services/bookingService");

const createBooking =
async (req, res) => {
    console.log("========== BOOKING REQUEST ==========");
    console.log(req.body);
    console.log("=====================================");
    try {
        console.log("========== REQUEST ARRIVED ==========");
        console.log("req.user =", req.user);
        console.log("req.body =", req.body);
        console.log("=====================================");

        const {

            selected_flight_id,
            passenger_ids,
            total_payment_amount,
            currency_code,
            trip_type,
            cabin_class,
            fare_brand_id

        } = req.body;

        const userEmailAddress =
        req.user?.email_address ||
        req.body.user_email_address;

        if (!userEmailAddress) {
            return res.status(400).json({
                error: "user_email_address is required"
            });
        }

        const booking =
        await bookingService
        .createBooking(

            userEmailAddress,
            selected_flight_id,
            passenger_ids,
            total_payment_amount,
            currency_code,
            trip_type,
            cabin_class,
            fare_brand_id

        );
        
        console.log("========== CONTROLLER RESPONSE ==========");
        console.log(booking);
        console.log("=========================================");
        res.status(201).json({

            message:
            "Booking created successfully",

            booking

        });

    }
    catch(error) {

        console.error(error);

        res.status(
            error.statusCode || 500
        ).json({

            error:
            error.message

        });

    }

};

const getManageBooking = async (req, res) => {

    try {

        const { pnr, lastName } = req.params;

        const data = await bookingService.getManageBooking(
            pnr,
            lastName
        );

        res.json({
            message: "Booking found",
            data
        });

    } catch (error) {

        res.status(404).json({
            error: error.message
        });

    }
};

const bookingActionService =
require("../services/bookingActionService");

const getBookingActions =
async (req,res)=>{

    try{

        const {

            pnr,

            lastName

        } = req.params;

        const actions =
        await bookingActionService
        .getBookingActions(

            pnr,

            lastName

        );

        return res.json({

            message:
            "Booking actions",

            data:
            actions

        });

    }
    catch(error){

        return res.status(404).json({

            error:
            error.message

        });

    }

};

module.exports = {
    createBooking,
    getManageBooking,
    getBookingActions
};