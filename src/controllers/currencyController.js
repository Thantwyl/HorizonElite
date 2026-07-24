const currencyService = require("../services/currencyService");

const getExchangeRates = async (req, res) => {
    try {
        const rates = await currencyService.getExchangeRates(req.query.base);

        res.status(200).json({
            message: "Exchange rates fetched",
            data: rates
        });
    }
    catch(error) {
        res.status(502).json({
            error: "Unable to fetch live exchange rates",
            details: error.message
        });
    }
};

module.exports = {
    getExchangeRates
};
