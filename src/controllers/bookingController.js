const bookingService =
require("../services/bookingService");

const createBooking =
async (req, res) => {
    console.log("========== BOOKING REQUEST ==========");
    console.log(req.body);
    console.log("=====================================");
    try {

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

module.exports = {
    createBooking
};