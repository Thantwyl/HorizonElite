const router = require("express").Router();
const controller = require("../controllers/checkInController");
const reminderController = require("../controllers/checkInReminderController");
router.post("/lookup", controller.lookup);
router.post("/confirm", controller.confirm);
router.post("/reminders/email", reminderController.scheduleEmail);
router.post("/reminders/whatsapp", reminderController.scheduleWhatsApp);
module.exports = router;
