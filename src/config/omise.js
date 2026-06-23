const Omise = require("omise");

const omise = Omise({

    publicKey:
    process.env.OMISE_PUBLIC_KEY,

    secretKey:
    process.env.OMISE_SECRET_KEY

});

module.exports = omise;