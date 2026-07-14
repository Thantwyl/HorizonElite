const pool = require("../config/db");

const pick = (source, keys) =>
    keys.reduce((result, key) => {
        if (source[key] !== undefined) {
            result[key] = source[key];
        }
        return result;
    }, {});

const normalizeBlank = (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
};

const normalizeRecord = (record) =>
    Object.fromEntries(
        Object.entries(record).map(([key, value]) => [
            key,
            normalizeBlank(value)
        ])
    );

const requireFields = (data, fields) => {
    const missing = fields.filter((field) => !normalizeBlank(data[field]));
    if (missing.length > 0) {
        const error = new Error(`${missing.join(", ")} required`);
        error.statusCode = 400;
        throw error;
    }
};

const updateUserProfile = async (userEmail, data) => {
    const allowed = normalizeRecord(pick(data, [
        "title",
        "first_name",
        "middle_name",
        "last_name",
        "phone_number",
        "alternate_phone_number",
        "country_code",
        "nationality",
        "date_of_birth",
        "gender",
        "address",
        "preferred_language",
        "preferred_currency"
    ]));

    if (Object.keys(allowed).length === 0) {
        const error = new Error("No profile fields provided");
        error.statusCode = 400;
        throw error;
    }

    const assignments = Object.keys(allowed)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(", ");

    const result = await pool.query(
        `
        UPDATE users
        SET ${assignments}, updated_at = LOCALTIMESTAMP
        WHERE email_address = $1
        RETURNING
            email_address,
            title,
            first_name,
            middle_name,
            last_name,
            phone_number,
            alternate_phone_number,
            country_code,
            nationality,
            date_of_birth,
            gender,
            address,
            preferred_language,
            preferred_currency,
            created_at,
            updated_at
        `,
        [userEmail, ...Object.values(allowed)]
    );

    return result.rows[0];
};

const getProfile = async (userEmail) => {
    const result = await pool.query(
        `
        SELECT
            email_address,
            title,
            first_name,
            middle_name,
            last_name,
            phone_number,
            alternate_phone_number,
            country_code,
            nationality,
            date_of_birth,
            gender,
            address,
            preferred_language,
            preferred_currency,
            created_at,
            updated_at
        FROM users
        WHERE email_address = $1
        `,
        [userEmail]
    );

    return result.rows[0];
};

const getSavedPassengers = async (userEmail) => {
    const result = await pool.query(
        `
        SELECT *
        FROM saved_passengers
        WHERE user_email_address = $1
        ORDER BY created_at ASC
        `,
        [userEmail]
    );

    return result.rows;
};

const passengerFields = [
    "relationship",
    "title",
    "first_name",
    "middle_name",
    "last_name",
    "gender",
    "date_of_birth",
    "nationality",
    "passenger_type_code",
    "contact_email",
    "contact_phone",
    "passport_number",
    "passport_issuing_country",
    "passport_expiry_date",
    "visa_number",
    "visa_country",
    "visa_expiry_date",
    "notes"
];

const createSavedPassenger = async (userEmail, data) => {
    requireFields(data, [
        "title",
        "first_name",
        "last_name",
        "gender",
        "date_of_birth",
        "nationality"
    ]);

    const passenger = normalizeRecord({
        relationship: data.relationship || "Self",
        title: data.title,
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        nationality: data.nationality,
        passenger_type_code: data.passenger_type_code || "ADT",
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        passport_number: data.passport_number,
        passport_issuing_country: data.passport_issuing_country,
        passport_expiry_date: data.passport_expiry_date,
        visa_number: data.visa_number,
        visa_country: data.visa_country,
        visa_expiry_date: data.visa_expiry_date,
        notes: data.notes
    });

    const result = await pool.query(
        `
        INSERT INTO saved_passengers (
            user_email_address,
            ${passengerFields.join(", ")}
        )
        VALUES (
            $1, ${passengerFields.map((_, index) => `$${index + 2}`).join(", ")}
        )
        RETURNING *
        `,
        [userEmail, ...passengerFields.map((field) => passenger[field])]
    );

    return result.rows[0];
};

const updateSavedPassenger = async (userEmail, passengerId, data) => {
    const passenger = normalizeRecord(pick(data, passengerFields));

    if (Object.keys(passenger).length === 0) {
        const error = new Error("No passenger fields provided");
        error.statusCode = 400;
        throw error;
    }

    const assignments = Object.keys(passenger)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(", ");

    const result = await pool.query(
        `
        UPDATE saved_passengers
        SET ${assignments}, updated_at = LOCALTIMESTAMP
        WHERE user_email_address = $1
        AND saved_passenger_id = $2
        RETURNING *
        `,
        [userEmail, passengerId, ...Object.values(passenger)]
    );

    return result.rows[0];
};

const deleteSavedPassenger = async (userEmail, passengerId) => {
    const result = await pool.query(
        `
        DELETE FROM saved_passengers
        WHERE user_email_address = $1
        AND saved_passenger_id = $2
        RETURNING *
        `,
        [userEmail, passengerId]
    );

    return result.rows[0];
};

const getEmergencyContacts = async (userEmail) => {
    const result = await pool.query(
        `
        SELECT *
        FROM emergency_contacts
        WHERE user_email_address = $1
        ORDER BY priority ASC, created_at ASC
        `,
        [userEmail]
    );

    return result.rows;
};

const emergencyFields = [
    "contact_name",
    "relationship",
    "phone_number",
    "email_address",
    "priority"
];

const createEmergencyContact = async (userEmail, data) => {
    requireFields(data, ["contact_name", "phone_number"]);

    const contact = normalizeRecord({
        contact_name: data.contact_name,
        relationship: data.relationship,
        phone_number: data.phone_number,
        email_address: data.email_address,
        priority: data.priority || 1
    });

    const result = await pool.query(
        `
        INSERT INTO emergency_contacts (
            user_email_address,
            ${emergencyFields.join(", ")}
        )
        VALUES (
            $1, ${emergencyFields.map((_, index) => `$${index + 2}`).join(", ")}
        )
        RETURNING *
        `,
        [userEmail, ...emergencyFields.map((field) => contact[field])]
    );

    return result.rows[0];
};

const updateEmergencyContact = async (userEmail, contactId, data) => {
    const contact = normalizeRecord(pick(data, emergencyFields));

    if (Object.keys(contact).length === 0) {
        const error = new Error("No emergency contact fields provided");
        error.statusCode = 400;
        throw error;
    }

    const assignments = Object.keys(contact)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(", ");

    const result = await pool.query(
        `
        UPDATE emergency_contacts
        SET ${assignments}, updated_at = LOCALTIMESTAMP
        WHERE user_email_address = $1
        AND emergency_contact_id = $2
        RETURNING *
        `,
        [userEmail, contactId, ...Object.values(contact)]
    );

    return result.rows[0];
};

const deleteEmergencyContact = async (userEmail, contactId) => {
    const result = await pool.query(
        `
        DELETE FROM emergency_contacts
        WHERE user_email_address = $1
        AND emergency_contact_id = $2
        RETURNING *
        `,
        [userEmail, contactId]
    );

    return result.rows[0];
};

const getPaymentMethods = async (userEmail) => {
    const result = await pool.query(
        `
        SELECT *
        FROM saved_payment_methods
        WHERE user_email_address = $1
        ORDER BY is_default DESC, created_at ASC
        `,
        [userEmail]
    );

    return result.rows;
};

const paymentFields = [
    "payment_type",
    "card_brand",
    "cardholder_name",
    "last_four",
    "expiry_month",
    "expiry_year",
    "gateway_payment_method_id",
    "billing_address",
    "is_default"
];

const clearDefaultPaymentMethod = async (userEmail) => {
    await pool.query(
        `
        UPDATE saved_payment_methods
        SET is_default = FALSE
        WHERE user_email_address = $1
        `,
        [userEmail]
    );
};

const createPaymentMethod = async (userEmail, data) => {
    requireFields(data, [
        "cardholder_name",
        "last_four",
        "expiry_month",
        "expiry_year"
    ]);

    if (!/^[0-9]{4}$/.test(String(data.last_four))) {
        const error = new Error("Only the last four card digits can be saved");
        error.statusCode = 400;
        throw error;
    }

    const payment = normalizeRecord({
        payment_type: data.payment_type || "CARD",
        card_brand: data.card_brand,
        cardholder_name: data.cardholder_name,
        last_four: data.last_four,
        expiry_month: data.expiry_month,
        expiry_year: data.expiry_year,
        gateway_payment_method_id: data.gateway_payment_method_id,
        billing_address: data.billing_address,
        is_default: Boolean(data.is_default)
    });

    if (payment.is_default) {
        await clearDefaultPaymentMethod(userEmail);
    }

    const result = await pool.query(
        `
        INSERT INTO saved_payment_methods (
            user_email_address,
            ${paymentFields.join(", ")}
        )
        VALUES (
            $1, ${paymentFields.map((_, index) => `$${index + 2}`).join(", ")}
        )
        RETURNING *
        `,
        [userEmail, ...paymentFields.map((field) => payment[field])]
    );

    return result.rows[0];
};

const updatePaymentMethod = async (userEmail, paymentMethodId, data) => {
    const payment = normalizeRecord(pick(data, paymentFields));

    if (payment.last_four && !/^[0-9]{4}$/.test(String(payment.last_four))) {
        const error = new Error("Only the last four card digits can be saved");
        error.statusCode = 400;
        throw error;
    }

    if (Object.keys(payment).length === 0) {
        const error = new Error("No payment method fields provided");
        error.statusCode = 400;
        throw error;
    }

    if (payment.is_default) {
        await clearDefaultPaymentMethod(userEmail);
    }

    const assignments = Object.keys(payment)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(", ");

    const result = await pool.query(
        `
        UPDATE saved_payment_methods
        SET ${assignments}, updated_at = LOCALTIMESTAMP
        WHERE user_email_address = $1
        AND payment_method_id = $2
        RETURNING *
        `,
        [userEmail, paymentMethodId, ...Object.values(payment)]
    );

    return result.rows[0];
};

const deletePaymentMethod = async (userEmail, paymentMethodId) => {
    const result = await pool.query(
        `
        DELETE FROM saved_payment_methods
        WHERE user_email_address = $1
        AND payment_method_id = $2
        RETURNING *
        `,
        [userEmail, paymentMethodId]
    );

    return result.rows[0];
};

module.exports = {
    getProfile,
    updateUserProfile,
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
