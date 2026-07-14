const profileService = require("../services/profileService");

const getUserEmail = (req) => req.user?.email_address || req.user?.email;

const sendError = (res, error) =>
    res.status(error.statusCode || 500).json({
        error: error.message
    });

const sendNotFound = (res, label) =>
    res.status(404).json({
        error: `${label} not found`
    });

const getProfileSummary = async (req, res) => {
    try {
        const userEmail = getUserEmail(req);
        const [profile, passengers, emergencyContacts, paymentMethods] =
            await Promise.all([
                profileService.getProfile(userEmail),
                profileService.getSavedPassengers(userEmail),
                profileService.getEmergencyContacts(userEmail),
                profileService.getPaymentMethods(userEmail)
            ]);

        res.status(200).json({
            profile,
            passengers,
            emergencyContacts,
            paymentMethods
        });
    } catch (error) {
        sendError(res, error);
    }
};

const updateProfile = async (req, res) => {
    try {
        const profile = await profileService.updateUserProfile(
            getUserEmail(req),
            req.body
        );

        res.status(200).json({
            message: "Profile updated",
            profile
        });
    } catch (error) {
        sendError(res, error);
    }
};

const getSavedPassengers = async (req, res) => {
    try {
        const passengers = await profileService.getSavedPassengers(
            getUserEmail(req)
        );

        res.status(200).json(passengers);
    } catch (error) {
        sendError(res, error);
    }
};

const createSavedPassenger = async (req, res) => {
    try {
        const passenger = await profileService.createSavedPassenger(
            getUserEmail(req),
            req.body
        );

        res.status(201).json({
            message: "Saved passenger created",
            passenger
        });
    } catch (error) {
        sendError(res, error);
    }
};

const updateSavedPassenger = async (req, res) => {
    try {
        const passenger = await profileService.updateSavedPassenger(
            getUserEmail(req),
            req.params.passengerId,
            req.body
        );

        if (!passenger) return sendNotFound(res, "Saved passenger");

        res.status(200).json({
            message: "Saved passenger updated",
            passenger
        });
    } catch (error) {
        sendError(res, error);
    }
};

const deleteSavedPassenger = async (req, res) => {
    try {
        const passenger = await profileService.deleteSavedPassenger(
            getUserEmail(req),
            req.params.passengerId
        );

        if (!passenger) return sendNotFound(res, "Saved passenger");

        res.status(200).json({
            message: "Saved passenger deleted",
            passenger
        });
    } catch (error) {
        sendError(res, error);
    }
};

const getEmergencyContacts = async (req, res) => {
    try {
        const contacts = await profileService.getEmergencyContacts(
            getUserEmail(req)
        );

        res.status(200).json(contacts);
    } catch (error) {
        sendError(res, error);
    }
};

const createEmergencyContact = async (req, res) => {
    try {
        const contact = await profileService.createEmergencyContact(
            getUserEmail(req),
            req.body
        );

        res.status(201).json({
            message: "Emergency contact created",
            contact
        });
    } catch (error) {
        sendError(res, error);
    }
};

const updateEmergencyContact = async (req, res) => {
    try {
        const contact = await profileService.updateEmergencyContact(
            getUserEmail(req),
            req.params.contactId,
            req.body
        );

        if (!contact) return sendNotFound(res, "Emergency contact");

        res.status(200).json({
            message: "Emergency contact updated",
            contact
        });
    } catch (error) {
        sendError(res, error);
    }
};

const deleteEmergencyContact = async (req, res) => {
    try {
        const contact = await profileService.deleteEmergencyContact(
            getUserEmail(req),
            req.params.contactId
        );

        if (!contact) return sendNotFound(res, "Emergency contact");

        res.status(200).json({
            message: "Emergency contact deleted",
            contact
        });
    } catch (error) {
        sendError(res, error);
    }
};

const getPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await profileService.getPaymentMethods(
            getUserEmail(req)
        );

        res.status(200).json(paymentMethods);
    } catch (error) {
        sendError(res, error);
    }
};

const createPaymentMethod = async (req, res) => {
    try {
        const paymentMethod = await profileService.createPaymentMethod(
            getUserEmail(req),
            req.body
        );

        res.status(201).json({
            message: "Payment method saved",
            paymentMethod
        });
    } catch (error) {
        sendError(res, error);
    }
};

const updatePaymentMethod = async (req, res) => {
    try {
        const paymentMethod = await profileService.updatePaymentMethod(
            getUserEmail(req),
            req.params.paymentMethodId,
            req.body
        );

        if (!paymentMethod) return sendNotFound(res, "Payment method");

        res.status(200).json({
            message: "Payment method updated",
            paymentMethod
        });
    } catch (error) {
        sendError(res, error);
    }
};

const deletePaymentMethod = async (req, res) => {
    try {
        const paymentMethod = await profileService.deletePaymentMethod(
            getUserEmail(req),
            req.params.paymentMethodId
        );

        if (!paymentMethod) return sendNotFound(res, "Payment method");

        res.status(200).json({
            message: "Payment method deleted",
            paymentMethod
        });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports = {
    getProfileSummary,
    updateProfile,
    getSavedPassengers,
    createSavedPassenger,
    updateSavedPassenger,
    deleteSavedPassenger,
    getEmergencyContacts,
    createEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    getPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
};
