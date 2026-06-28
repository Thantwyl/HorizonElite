const express = require("express");

const router = express.Router();

const {
    createDuffelOrder
} = require(
    "../controllers/duffelOrderController"
);

router.post(
    "/create",
    createDuffelOrder
);

module.exports = router;