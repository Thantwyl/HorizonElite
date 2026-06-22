const validator = require("validator");

const validateRegister = (data) => {

    const errors = [];

    if (!data.email_address) {
        errors.push("Email is required");
    }

    if (
        data.email_address &&
        !validator.isEmail(data.email_address)
    ) {
        errors.push("Invalid email format");
    }

    if (!data.password) {
        errors.push("Password is required");
    }

    if (
        data.password &&
        data.password.length < 8
    ) {
        errors.push(
            "Password must be at least 8 characters"
        );
    }

    return errors;
};

module.exports = {
    validateRegister
};