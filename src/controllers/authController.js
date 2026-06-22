const pool = require("../../config/db");

const {
    hashPassword
} = require("../services/passwordService");

const {
    comparePassword
} = require("../services/passwordService");

const {
    generateToken
} = require("../services/tokenService");

const register = async (req, res) => {

    try {

        const {
            title,
            first_name,
            last_name,
            phone_number,
            email_address,
            password,
            confirm_password
        } = req.body;

        if (
            !title ||
            !first_name ||
            !last_name ||
            !phone_number ||
            !email_address ||
            !password ||
            !confirm_password
        ) {

            return res.status(400).json({
                message: "All fields are required"
            });

        }

        if (
            password !== confirm_password
        ) {

            return res.status(400).json({
                message:
                "Passwords do not match"
            });

        }

        const existingUser =
            await pool.query(
                `
                SELECT email_address
                FROM users
                WHERE email_address = $1
                `,
                [email_address]
            );

        if (
            existingUser.rows.length > 0
        ) {

            return res.status(400).json({
                message:
                "Email already exists"
            });

        }

        const passwordHash =
            await hashPassword(password);

        const result =
            await pool.query(
                `
                INSERT INTO users
                (
                    email_address,
                    password_hash,
                    title,
                    first_name,
                    last_name,
                    phone_number
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                )
                RETURNING
                email_address,
                first_name,
                last_name
                `,
                [
                    email_address,
                    passwordHash,
                    title,
                    first_name,
                    last_name,
                    phone_number
                ]
            );

        return res.status(201).json({

            message:
            "User registered successfully",

            user:
            result.rows[0]

        });

    }
    catch(error) {

        console.error(error);

        return res.status(500).json({
            error: error.message
        });

    }

};

const login = async (req, res) => {

    try {

        const {
            email_address,
            password
        } = req.body;

        if (
            !email_address ||
            !password
        ) {

            return res.status(400).json({
                message:
                    "Email and Password are required"
            });

        }

        const userResult =
            await pool.query(
                `
                SELECT *
                FROM users
                WHERE email_address = $1
                `,
                [email_address]
            );

        if (
            userResult.rows.length === 0
        ) {

            return res.status(401).json({
                message:
                    "Invalid Email or Password"
            });

        }

        const user =
            userResult.rows[0];

        const passwordMatch =
            await comparePassword(
                password,
                user.password_hash
            );

        if (
            !passwordMatch
        ) {

            return res.status(401).json({
                message:
                    "Invalid Email or Password"
            });

        }

        const token =
            generateToken(user);

        return res.status(200).json({

            message:
                "Login Successful",

            token,

            user: {

                email_address:
                    user.email_address,

                first_name:
                    user.first_name,

                last_name:
                    user.last_name

            }

        });

    }
    catch(error) {

        console.error(error);

        return res.status(500).json({
            error:
                error.message
        });

    }

};

const profile = async (
    req,
    res
) => {

    try {

        const result =
            await pool.query(
                `
                SELECT
                    email_address,
                    first_name,
                    last_name
                FROM users
                WHERE email_address = $1
                `,
                [
                    req.user.email_address
                ]
            );

        return res.json(
            result.rows[0]
        );

    }
    catch(error) {

        return res.status(500).json({
            error:
                error.message
        });

    }

};

module.exports = {
    register,
    login, 
    profile
};