const axios = require("axios");

const duffelHeaders = {
    Authorization:
    `Bearer ${process.env.DUFFEL_API_KEY}`,

    "Duffel-Version": "v2",

    "Content-Type":
    "application/json"
};

/*
|--------------------------------------------------------------------------
| Get Offer By ID
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Create Duffel Order
|--------------------------------------------------------------------------
*/

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

    }
    catch (error) {

        console.error("========== DUFFEL API ERROR ==========");

        console.error(
            "Status:",
            error.response?.status
        );

        console.error(
            "Status Text:",
            error.response?.statusText
        );

        console.error(
            "Error Details:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        if (
            error.response?.data?.errors
        ) {

            const messages =
            error.response.data.errors
            .map(item => item.message)
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

/*
|--------------------------------------------------------------------------
| Get Duffel Order
|--------------------------------------------------------------------------
*/

const getDuffelOrder = async (
    orderId
) => {

    console.log("========== GET DUFFEL ORDER ==========");

    console.log(
        "Order ID:",
        orderId
    );

    try {

        const response = await axios.get(

            `https://api.duffel.com/air/orders/${orderId}`,

            {

                headers: duffelHeaders

            }

        );

        console.log(
            "Duffel Order Retrieved Successfully"
        );

        return response.data;

    }
    catch (error) {

        console.error(
            "========== GET ORDER ERROR =========="
        );

        console.error(
            "Status:",
            error.response?.status
        );

        console.error(
            "Response:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        console.error(
            "========== END ERROR =========="
        );

        throw error;

    }

};

module.exports = {

    getDuffelOfferById,

    createDuffelOrder,

    getDuffelOrder

};