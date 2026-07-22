const axios = require("axios");

const headers = {
    Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
    "Duffel-Version": "v2",
    "Content-Type": "application/json"
};

// STEP 1: CREATE ORDER FIRST (NOT OPTIONAL)
const createOrder = async (offerId, passengers) => {

    const response = await axios.post(
        "https://api.duffel.com/air/orders",
        {
            data: {
                type: "instant",
                selected_offers: [offerId],
                passengers
            }
        },
        { headers }
    );

    return response.data.data;
};

// STEP 2: GET SEAT MAP (USES ORDER)
const getSeatMap = async (orderId) => {

    const response = await axios.post(
        "https://api.duffel.com/air/order_seat_maps",
        {
            data: {
                order_id: orderId
            }
        },
        { headers }
    );

    return response.data;
};

const selectSeat = async (orderId, passengerId, seatId) => {

    const response = await axios.post(
        `https://api.duffel.com/air/orders/${orderId}/actions/update`,
        {
            data: {
                services: [
                    {
                        type: "seat",
                        passenger_id: passengerId,
                        seat_id: seatId
                    }
                ]
            }
        },
        { headers }
    );

    return response.data;
};

module.exports = {
    createOrder,
    getSeatMap,
    selectSeat
};
