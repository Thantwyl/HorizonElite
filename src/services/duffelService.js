const axios = require("axios");

const normalizeCabinClass = (
    cabinClass
) => {
    const value =
    (cabinClass || "ECONOMY")
    .toString()
    .trim()
    .toUpperCase();

    const map = {
        ECONOMY: "economy",
        PREMIUM_ECONOMY: "premium_economy",
        BUSINESS: "business",
        FIRST_CLASS: "first"
    };

    return map[value] || "economy";
};

const buildDuffelPassengers = ({
    adultCount,
    childCount,
    infantCount
}) => {
    const passengers = [];

    for (let i = 0; i < adultCount; i++) {
        passengers.push({ type: "adult" });
    }

    for (let i = 0; i < childCount; i++) {
        passengers.push({ type: "child" });
    }

    for (let i = 0; i < infantCount; i++) {
        passengers.push({ type: "infant_without_seat" });
    }

    return passengers;
};

const searchFlights = async (
    origin,
    destination,
    departureDate,
    options = {}
) => {

    const adultCount =
    Number(options.adult_passenger_count || 1);

    const childCount =
    Number(options.child_passenger_count || 0);

    const infantCount =
    Number(options.infant_passenger_count || 0);

    const passengers =
    buildDuffelPassengers({
        adultCount,
        childCount,
        infantCount
    });

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

                passengers,

                cabin_class:
                normalizeCabinClass(
                    options.cabin_class
                )
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