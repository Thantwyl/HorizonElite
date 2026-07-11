const router = require("express").Router();
const controller = require("../controllers/boardingPassController");
router.get("/:bookingId", controller.download);
router.post("/:bookingId/email", controller.email);
module.exports = router;
