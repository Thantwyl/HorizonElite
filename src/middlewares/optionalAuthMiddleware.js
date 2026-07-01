const jwt = require("jsonwebtoken");

const optionalAuthMiddleware = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            req.user = null;

            return next();

        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    }
    catch (error) {

        req.user = null;

        next();

    }

};

module.exports = optionalAuthMiddleware;