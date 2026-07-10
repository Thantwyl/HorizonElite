const axios = require("axios");

const duffelHeaders = {
    Authorization:
    `Bearer ${process.env.DUFFEL_API_KEY}`,

    "Duffel-Version": "v2",

    "Content-Type": "application/json"
};

const sleep = (delayMs) =>
    new Promise((resolve) => setTimeout(resolve, delayMs));

const getDuffelStatusCode = (error) =>
    error?.response?.status;

const isRetryableDuffelError = (error) =>
    [503, 504].includes(getDuffelStatusCode(error));

const getDuffelRequestId = (error) =>
    error?.response?.data?.meta?.request_id;

const logDuffelError = (error) => {
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
        "Request ID:",
        getDuffelRequestId(error)
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
};

const requestWithDuffelRetry = async (
    description,
    requestFn,
    retryDelaysMs = [2000, 5000, 10000]
) => {
    let attempt = 0;

    while (attempt <= retryDelaysMs.length) {
        attempt += 1;

        try {
            return await requestFn();
        }
        catch (error) {
            logDuffelError(error);

            if (
                isRetryableDuffelError(error) &&
                attempt <= retryDelaysMs.length
            ) {
                error.isRetryableDuffelError = true;

                console.warn(
                    `Duffel ${description} failed with ${getDuffelStatusCode(error)}. ` +
                    `Retrying attempt ${attempt + 1} of ${retryDelaysMs.length + 1} ` +
                    `after ${retryDelaysMs[attempt - 1]}ms.`
                );

                await sleep(retryDelaysMs[attempt - 1]);
                continue;
            }

            error.isRetryableDuffelError =
            isRetryableDuffelError(error);
            error.duffelRequestId =
            getDuffelRequestId(error);

            throw error;
        }

    }
};

/*
|--------------------------------------------------------------------------
| Get Offer By ID
|--------------------------------------------------------------------------
*/

const getDuffelOfferById = async (
    offerId
) => {

    const response = await requestWithDuffelRetry(
        `offer lookup for ${offerId}`,
        () => axios.get(

            `https://api.duffel.com/air/offers/${offerId}`,

            {
                headers: duffelHeaders
            }

        )
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
    console.log("========== DUFFEL FINAL PAYLOAD ==========");

    console.log(
    JSON.stringify(
    {
        data:{
            type:"instant",
            selected_offers:[
                offerId
            ],
            passengers,
            payments:[
                {
                    type:"balance",
                    amount:amount.toString(),
                    currency
                }
            ]
        }
    },
    null,
    2
    ));

    console.log("==========================================");

    console.log("========== Duffel Order Request ==========");

    console.log({

        offerId,
        amount,
        currency,
        passengers

    });

    const response = await requestWithDuffelRetry(
        `order creation for ${offerId}`,
        () => axios.post(
                "https://api.duffel.com/air/orders",

                {
                data:{
                    type:"instant",
                    selected_offers:[
                    offerId
                    ],
                    passengers,
                    payments:[
                    {
                        type:"balance",
                        amount:amount.toString(),
                        currency:currency
                    }
                    ]
                }
                },

                {
                headers: duffelHeaders,

                timeout:30000

                }

                )
    );

    return response.data;

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
