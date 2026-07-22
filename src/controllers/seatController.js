const seatService = require("../services/seatService");

// Get seat map
const getSeatMap = async (req, res) => {

    try {

        const { offer_id } = req.params;

        if (!offer_id || !offer_id.startsWith("ord_")) {
            return res.status(400).json({
                message: "A Duffel order ID starting with ord_ is required for seat maps"
            });
        }

        const data = await seatService.getSeatMap(offer_id);

        res.json({
            message: "Seat map fetched",
            data
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// Select seat
const selectSeat = async (req, res) => {

    try {

        const {
            order_id,
            passenger_id,
            seat_id
        } = req.body;

        if (!order_id || !passenger_id || !seat_id) {
            return res.status(400).json({
                message: "order_id, passenger_id, and seat_id are required"
            });
        }

        const data = await seatService.selectSeat(
            order_id,
            passenger_id,
            seat_id
        );

        res.json({
            message: "Seat selected",
            data
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

module.exports = {
    getSeatMap,
    selectSeat
};
