const router = require("express").Router();
const controller = require("../controllers/whatsappController");

router.get("/config-status", controller.configStatus);
router.get("/webhook", controller.verifyWebhook);
router.post("/webhook", controller.receiveWebhook);
router.post("/check-in-reminder", controller.sendCheckInReminder);

module.exports = router;
