const {
    createDuffelOrderService
} = require(
    "../services/duffelOrderService"
);

const createDuffelOrder =
async (req, res) => {

    try {

        const result =
        await createDuffelOrderService(
            req.body
        );

        return res.status(201).json({
            message:
            "Duffel Order Created",
            order: result
        });

    }
    catch(error) {

        console.error(
            "Duffel order error:",
            {
                message: error.message,
                status: error.statusCode || error.response?.status,
                details: error.response?.data
            }
        );

        const statusCode =
        error.statusCode ||
        error.response?.status ||
        500;

        const errorDetails =
        error.response?.data;

        const duffelRequestId =
        error.duffelRequestId ||
        errorDetails?.meta?.request_id;

        const retryable =
        Boolean(error.isRetryableDuffelError);

        return res.status(statusCode).json({
            error: error.message,
            details: errorDetails,
            retryable,
            duffel_request_id: duffelRequestId,
            message: retryable
                ? "Payment succeeded, but Duffel could not create the ticket order after several retries. Ticketing is pending and can be retried without charging again."
                : undefined
        });

    }

};

module.exports = {
    createDuffelOrder
};
