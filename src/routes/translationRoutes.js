const express =
require("express");

const router =
express.Router();

const {
    getSupportedLanguages,
    translate,
    bulkTranslate,
    getFlightContent
} = require("../controllers/translationController");

router.get(
    "/supported-languages",
    getSupportedLanguages
);

router.post(
    "/translate",
    translate
);

router.post(
    "/bulk",
    bulkTranslate
);

router.post(
    "/",
    translate
);

router.get(
    "/flight-content/:lang",
    getFlightContent
);

module.exports =
router;
