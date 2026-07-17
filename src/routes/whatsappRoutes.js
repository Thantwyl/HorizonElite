const router = require("express").Router();
const controller = require("../controllers/whatsappController");

router.get("/config-status", controller.configStatus);
router.post("/check-in-reminder", controller.sendCheckInReminder);

module.exports = router;
