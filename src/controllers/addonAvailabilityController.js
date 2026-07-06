const addonService =
require("../services/addonAvailabilityService");

const getAvailability = async (req, res) => {

    try {

        const { offerId } = req.params;

        const data =
        await addonService.getAddonAvailability(offerId);

        return res.status(200).json({
            message: "Addon availability fetched",
            data
        });

    } catch (error) {

        return res.status(500).json({
            message: "Failed to fetch addon availability",
            error: error.message
        });

    }

};

module.exports = {
    getAvailability
};