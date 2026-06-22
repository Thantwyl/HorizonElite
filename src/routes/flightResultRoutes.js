const express = require("express");

const router = express.Router();

console.log(
    "Flight Result Routes Loaded"
);

router.post(
    "/results",
    (req, res) => {
        // Your handler logic here
        res.json({
            message: "Results endpoint working"
        });
    }
);

module.exports = router;