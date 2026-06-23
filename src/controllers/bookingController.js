const bookingService =
require("../services/bookingService");

const createBooking =
async (req, res) => {

    try {

        const {

            user_email_address,
            selected_flight_id,
            passenger_ids,
            total_payment_amount,
            currency_code,
            trip_type,
            cabin_class,
            fare_brand_id

        } = req.body;

        const booking =
        await bookingService
        .createBooking(

            user_email_address,
            selected_flight_id,
            passenger_ids,
            total_payment_amount,
            currency_code,
            trip_type,
            cabin_class,
            fare_brand_id

        );

        res.status(201).json({

            message:
            "Booking created successfully",

            booking

        });

    }
    catch(error) {

        console.error(error);

        res.status(500).json({

            error:
            error.message

        });

    }

};

module.exports = {
    createBooking
};