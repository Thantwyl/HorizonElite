const axios = require("axios");

const getFlightStatus = async (
    flightNumber,
    departureDate
) => {

    const response = await axios.get(
        `https://${process.env.AERODATABOX_API_HOST}/flights/number/${flightNumber}/${departureDate}`,
        {
            headers: {
                "X-RapidAPI-Key": process.env.AERODATABOX_API_KEY,
                "X-RapidAPI-Host": process.env.AERODATABOX_API_HOST
            }
        }
    );

    return response.data;

};

module.exports = {
    getFlightStatus
};