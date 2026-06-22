const jwt = require("jsonwebtoken");

const generateToken = (user) => {

    return jwt.sign(
        {
            email_address:
                user.email_address
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN
        }
    );

};

module.exports = {
    generateToken
};