const axios = require("axios");

/*
|--------------------------------------------------------------------------
| CHECK DUFFEL FLIGHT ADD-ON CAPABILITY
|--------------------------------------------------------------------------
*/

const getDuffelOfferServices = async (offerId) => {

    console.log("==================================");
    console.log("Offer ID received:", offerId);
    console.log("==================================");

    try {

        const response = await axios.get(
            `https://api.duffel.com/air/offers/${offerId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
                    "Duffel-Version": "v2",
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error("Duffel Offer Fetch Error:", error.response?.data);

        return null;

    }

};

/*
|--------------------------------------------------------------------------
| MAIN AVAILABILITY FUNCTION
|--------------------------------------------------------------------------
*/

const getAddonAvailability = async (offerId) => {

    const offerData = await getDuffelOfferServices(offerId);

    // Default fallback (VERY IMPORTANT)
    const availability = {
        seat: false,
        meal: true,          // your system always supports
        baggage: true,       // your system always supports
        insurance: false,
        lounge: false,
        assistance: false
    };

    if (!offerData) {
        return availability;
    }

    const services = offerData?.data?.services || [];

    /*
    |--------------------------------------------------------------------------
    | SEAT CHECK
    |--------------------------------------------------------------------------
    */

    availability.seat =
        services.includes("seats") ||
        offerData?.data?.available_services?.seat_maps === true;

    /*
    |--------------------------------------------------------------------------
    | INSURANCE CHECK (usually external or optional)
    |--------------------------------------------------------------------------
    */

    availability.insurance =
        offerData?.data?.available_services?.ancillaries?.insurance === true;

    /*
    |--------------------------------------------------------------------------
    | LOUNGE / ASSISTANCE CHECK (fallback rules)
    |--------------------------------------------------------------------------
    */

    availability.lounge =
        offerData?.data?.available_services?.lounges === true;

    availability.assistance =
        offerData?.data?.available_services?.special_assistance === true;

    return availability;

};

module.exports = {
    getAddonAvailability
};