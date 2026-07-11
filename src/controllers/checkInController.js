const service = require("../services/checkInService");

const handle = (operation) => async (req, res) => {
    try {
        const data = await operation(req.body.pnr_reference, req.body.passenger_last_name);
        res.json({ message: data.eligibility.reason, data });
    } catch (error) {
        res.status(error.statusCode || (error.message === "Booking not found" ? 404 : 500)).json({ error: error.message });
    }
};

module.exports = { lookup: handle(service.lookup), confirm: handle(service.confirm) };
