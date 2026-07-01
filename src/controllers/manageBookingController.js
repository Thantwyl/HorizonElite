const {
    searchBooking
} = require("../services/manageBookingService");

const getBooking = async (req, res) => {

    try {

        const {
            pnr_reference,
            passenger_last_name
        } = req.body;

        console.log("========== MANAGE BOOKING REQUEST ==========");
        console.log(req.body);
        console.log("============================================");

        if(!pnr_reference || !passenger_last_name){
            return res.status(400).json({
                error: "PNR and Last Name are required"
            });
        }

        const booking =
        await searchBooking(
            pnr_reference,
            passenger_last_name
        );

        return res.status(200).json({
            message: "Booking found",
            booking
        });

    } catch(error){

        console.log("MANAGE BOOKING ERROR:", error.message);

        return res.status(404).json({
            error: error.message
        });

    }
};

module.exports = {
    getBooking
};  