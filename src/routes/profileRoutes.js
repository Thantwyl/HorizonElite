const express = require("express");
const authenticateUser = require("../middlewares/authMiddleware");
const profileController = require("../controllers/profileController");

const router = express.Router();

router.use(authenticateUser);

router.get("/", profileController.getProfileSummary);
router.put("/", profileController.updateProfile);

router.get("/passengers", profileController.getSavedPassengers);
router.post("/passengers", profileController.createSavedPassenger);
router.put("/passengers/:passengerId", profileController.updateSavedPassenger);
router.delete("/passengers/:passengerId", profileController.deleteSavedPassenger);

router.get("/emergency-contacts", profileController.getEmergencyContacts);
router.post("/emergency-contacts", profileController.createEmergencyContact);
router.put("/emergency-contacts/:contactId", profileController.updateEmergencyContact);
router.delete("/emergency-contacts/:contactId", profileController.deleteEmergencyContact);

router.get("/payment-methods", profileController.getPaymentMethods);
router.post("/payment-methods", profileController.createPaymentMethod);
router.put("/payment-methods/:paymentMethodId", profileController.updatePaymentMethod);
router.delete("/payment-methods/:paymentMethodId", profileController.deletePaymentMethod);

module.exports = router;
