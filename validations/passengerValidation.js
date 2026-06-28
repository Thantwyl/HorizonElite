const validator = require("validator");

const ALLOWED_TITLES = new Set([
    "MR",
    "MRS",
    "MS",
    "MISS",
    "MASTER",
    "DR",
    "MX"
]);

const ALLOWED_GENDERS = new Set([
    "M",
    "F",
    "X"
]);

const PASSENGER_TYPE_ALIASES = {
    ADULT: "ADT",
    ADT: "ADT",
    CHILD: "CHD",
    CHD: "CHD",
    CNN: "CHD",
    INFANT: "INF",
    INF: "INF"
};

const normalizeUpperString = (value) =>
    (value || "")
    .toString()
    .trim()
    .toUpperCase();

const validatePassengerPayload = (
    payload
) => {
    const errors = [];

    const normalized = {
        ...payload,
        pi_title:
        normalizeUpperString(payload.pi_title),

        pi_gender:
        normalizeUpperString(payload.pi_gender),

        pi_passenger_type_code:
        PASSENGER_TYPE_ALIASES[
            normalizeUpperString(
                payload.pi_passenger_type_code
            )
        ] || "",

        pi_nationality:
        normalizeUpperString(
            payload.pi_nationality
        )
    };

    const requiredFields = [
        "selected_flight_id",
        "pi_title",
        "pi_first_name",
        "pi_last_name",
        "pi_gender",
        "pi_date_of_birth",
        "pi_nationality",
        "pi_passenger_type_code",
        "pi_contact_email",
        "pi_contact_phone"
    ];

    for (const field of requiredFields) {
        if (!payload[field]) {
            errors.push(`${field} is required`);
        }
    }

    if (
        normalized.pi_title &&
        !ALLOWED_TITLES.has(
            normalized.pi_title
        )
    ) {
        errors.push(
            "pi_title must be one of: " +
            "MR, MRS, MS, MISS, MASTER, DR, MX"
        );
    }

    if (
        normalized.pi_gender &&
        !ALLOWED_GENDERS.has(
            normalized.pi_gender
        )
    ) {
        errors.push(
            "pi_gender must be one of: M, F, X"
        );
    }

    if (!normalized.pi_passenger_type_code) {
        errors.push(
            "pi_passenger_type_code must be one of: ADT, CHD, INF"
        );
    }

    if (
        payload.pi_date_of_birth &&
        !validator.isISO8601(
            String(payload.pi_date_of_birth)
        )
    ) {
        errors.push(
            "pi_date_of_birth must be a valid date (YYYY-MM-DD)"
        );
    }

    if (
        payload.pi_contact_email &&
        !validator.isEmail(
            String(payload.pi_contact_email)
        )
    ) {
        errors.push(
            "pi_contact_email must be a valid email"
        );
    }

    return {
        errors,
        normalized
    };
};

module.exports = {
    validatePassengerPayload
};
