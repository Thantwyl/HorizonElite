const router = require("express").Router();
const controller = require("../controllers/checkInController");
router.post("/lookup", controller.lookup);
router.post("/confirm", controller.confirm);
module.exports = router;
