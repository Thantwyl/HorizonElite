const express = require("express");
const controller = require("../controllers/personalizedReminderController");

const router = express.Router();

router.post("/reminders/arrival-card", controller.scheduleArrivalCard);
router.post("/reminders/travel-checklist", controller.scheduleTravelChecklist);

module.exports = router;
