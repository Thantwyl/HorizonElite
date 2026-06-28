const axios = require("axios");

const duffelHeaders = {
    Authorization:
    `Bearer ${process.env.DUFFEL_API_KEY}`,

    "Duffel-Version": "v2",

    "Content-Type":
    "application/json"
};

const getDuffelOfferById = async (
    offerId
) => {

    const response = await axios.get(
        `https://api.duffel.com/air/offers/${offerId}`,
        {
            headers: duffelHeaders
        }
    );

    return response.data;

};

const createDuffelOrder = async (
    offerId,
    passengers,
    amount,
    currency
) => {

    console.log("========== Duffel Order Request ==========");
    console.log({
        offerId,
        amount,
        currency,
        passengers
    });

    try {
        const response = await axios.post(

            "https://api.duffel.com/air/orders",

            {
                data: {

                    type: "instant",

                    selected_offers: [
                        offerId
                    ],

                    passengers,

                    payments: [
                        {
                            type: "balance",

                            amount: amount.toString(),

                            currency: currency
                        }
                    ]
                }
            },

            {

                headers: duffelHeaders

            }

        );

        return response.data;
    } catch (error) {
        console.error("========== DUFFEL API ERROR ==========");
        console.error("Status:", error.response?.status);
        console.error("Status Text:", error.response?.statusText);
        console.error("Error Details:", JSON.stringify(error.response?.data, null, 2));
        if (error.response?.data?.errors) {
            const messages =
            error.response.data.errors
            .map((item) => item.message)
            .filter(Boolean);

            console.error(
                "Duffel Validation Messages:",
                messages
            );
        }
        console.error("========== END ERROR ==========");
        throw error;
    }

};

module.exports = {
    getDuffelOfferById,
    createDuffelOrder
};