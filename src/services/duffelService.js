const axios = require("axios");

const searchFlights = async (
    origin,
    destination,
    departureDate
) => {

    const response = await axios.post(

        "https://api.duffel.com/air/offer_requests",

        {
            data: {

                slices: [
                    {
                        origin,
                        destination,
                        departure_date:
                        departureDate
                    }
                ],

                passengers: [
                    {
                        type: "adult"
                    }
                ],

                cabin_class:
                "economy"
            }
        },

        {
            headers: {

                Authorization:
                `Bearer ${process.env.DUFFEL_API_KEY}`,

                "Duffel-Version":
                "v2",

                "Content-Type":
                "application/json"
            }
        }
    );

    return response.data;
};

module.exports = {
    searchFlights
};