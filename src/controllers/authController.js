const pool = require("../config/db");
const axios = require("axios");
const crypto = require("crypto");

const {
    hashPassword
} = require("../services/passwordService");

const {
    comparePassword
} = require("../services/passwordService");

const {
    generateToken
} = require("../services/tokenService");

const {
    normalizeEmail,
    verifyEmailAddress
} = require("../services/emailVerificationService");

const {
    issueVerificationToken,
    verifyEmailToken
} = require("../services/emailVerificationTokenService");

const {
    sendVerificationEmail
} = require("../services/emailSenderService");

const getVerificationUrl = (token) => {

    const frontendUrl =
        (process.env.FRONTEND_URL || "http://localhost:5173")
            .replace(/\/$/, "");

    return `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

};

const sendVerificationLink = async ({
    emailAddress,
    firstName
}) => {

    const token =
        await issueVerificationToken(
            pool,
            emailAddress
        );

    await sendVerificationEmail({
        to: emailAddress,
        firstName,
        verificationUrl:
            getVerificationUrl(token)
    });

};

const getBackendUrl = () =>
    (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`)
        .replace(/\/$/, "");

const getFrontendUrl = () =>
    (process.env.FRONTEND_URL || "http://localhost:5173")
        .replace(/\/$/, "");

const getFacebookRedirectUri = () =>
    `${getBackendUrl()}/api/auth/facebook/callback`;

const getGoogleRedirectUri = () =>
    `${getBackendUrl()}/api/auth/google/callback`;

const getGoogleConfig = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            "Google login is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        );
    }

    return { clientId, clientSecret };
};

const googleStateCookieName = "google_oauth_state";

const getCookie = (req, name) => {
    const cookies = String(req.headers.cookie || "").split(";");

    for (const cookie of cookies) {
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex < 0) continue;

        const key = cookie.slice(0, separatorIndex).trim();
        if (key === name) {
            return decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
        }
    }

    return undefined;
};

const setGoogleStateCookie = (res, state) => {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
        "Set-Cookie",
        `${googleStateCookieName}=${encodeURIComponent(state)}; HttpOnly; Path=/api/auth/google; SameSite=Lax; Max-Age=600${secure}`
    );
};

const clearGoogleStateCookie = (res) => {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
        "Set-Cookie",
        `${googleStateCookieName}=; HttpOnly; Path=/api/auth/google; SameSite=Lax; Max-Age=0${secure}`
    );
};

const encodeUserForRedirect = (user) =>
    Buffer
        .from(JSON.stringify(user))
        .toString("base64url");

const redirectSocialAuthError = (res, message) => {
    const redirectUrl =
        `${getFrontendUrl()}/social-auth-callback?error=${encodeURIComponent(message)}`;

    return res.redirect(redirectUrl);
};

const getFacebookConfig = () => {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
        throw new Error(
            "Facebook login is not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET."
        );
    }

    return {
        appId,
        appSecret
    };
};

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

        const normalizedEmail =
            normalizeEmail(email_address);

        if (
            !title ||
            !first_name ||
            !last_name ||
            !phone_number ||
            !normalizedEmail ||
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
                SELECT email_address, first_name, email_verified
                FROM users
                WHERE email_address = $1
                `,
                [normalizedEmail]
            );

        if (
            existingUser.rows.length > 0
        ) {

            const user =
                existingUser.rows[0];

            if (
                !user.email_verified
            ) {

                await sendVerificationLink({
                    emailAddress: normalizedEmail,
                    firstName: user.first_name
                });

                return res.status(200).json({
                    message:
                        "Account already exists but is not verified. A new verification email has been sent.",
                    user: {
                        email_address:
                            user.email_address,
                        email_verified:
                            user.email_verified
                    }
                });

            }

            return res.status(400).json({
                message:
                "Email already exists"
            });

        }

        const emailVerification =
            await verifyEmailAddress(normalizedEmail);

        if (
            !emailVerification.valid
        ) {

            return res.status(400).json({
                message:
                    emailVerification.message,
                details: {
                    reason:
                        emailVerification.reason
                }
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
                last_name,
                email_verified
                `,
                [
                    emailVerification.normalizedEmail,
                    passwordHash,
                    title,
                    first_name,
                    last_name,
                    phone_number
                ]
            );

        await sendVerificationLink({
            emailAddress:
                emailVerification.normalizedEmail,
            firstName:
                first_name
        });

        return res.status(201).json({

            message:
            "Registration successful. Please check your email and click the verification button.",

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

        const normalizedEmail =
            normalizeEmail(email_address);

        if (
            !normalizedEmail ||
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
                [normalizedEmail]
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

        if (
            !user.email_verified
        ) {

            return res.status(403).json({
                message:
                    "Please verify your email before signing in"
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

const facebookLogin = async (req, res) => {

    try {

        const {
            appId
        } = getFacebookConfig();

        const state =
            crypto.randomBytes(16).toString("hex");

        const params =
            new URLSearchParams({
                client_id: appId,
                redirect_uri: getFacebookRedirectUri(),
                state,
                scope: "email,public_profile",
                response_type: "code"
            });

        return res.redirect(
            `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`
        );

    }
    catch(error) {

        console.error(error);
        return redirectSocialAuthError(res, error.message);

    }

};

const facebookCallback = async (req, res) => {

    try {

        const {
            code,
            error,
            error_description
        } = req.query;

        if (error) {
            return redirectSocialAuthError(
                res,
                String(error_description || error)
            );
        }

        if (!code) {
            return redirectSocialAuthError(
                res,
                "Facebook did not return an authorization code."
            );
        }

        const {
            appId,
            appSecret
        } = getFacebookConfig();

        const tokenResponse =
            await axios.get(
                "https://graph.facebook.com/v20.0/oauth/access_token",
                {
                    params: {
                        client_id: appId,
                        client_secret: appSecret,
                        redirect_uri: getFacebookRedirectUri(),
                        code
                    }
                }
            );

        const accessToken =
            tokenResponse.data?.access_token;

        if (!accessToken) {
            return redirectSocialAuthError(
                res,
                "Facebook did not return an access token."
            );
        }

        const profileResponse =
            await axios.get(
                "https://graph.facebook.com/me",
                {
                    params: {
                        fields: "id,first_name,last_name,email",
                        access_token: accessToken
                    }
                }
            );

        const facebookProfile =
            profileResponse.data || {};

        const facebookId =
            facebookProfile.id;

        const normalizedEmail =
            normalizeEmail(facebookProfile.email);

        if (!facebookId || !normalizedEmail) {
            return redirectSocialAuthError(
                res,
                "Facebook account did not provide an email address. Please use email sign up."
            );
        }

        const firstName =
            facebookProfile.first_name || "Facebook";

        const lastName =
            facebookProfile.last_name || "User";

        const existingUserResult =
            await pool.query(
                `
                SELECT *
                FROM users
                WHERE email_address = $1
                OR facebook_id = $2
                LIMIT 1
                `,
                [
                    normalizedEmail,
                    facebookId
                ]
            );

        let user;

        if (existingUserResult.rows.length > 0) {

            const updateResult =
                await pool.query(
                    `
                    UPDATE users
                    SET
                        facebook_id = COALESCE(facebook_id, $1),
                        auth_provider = CASE
                            WHEN auth_provider = 'LOCAL' THEN 'FACEBOOK'
                            ELSE auth_provider
                        END,
                        email_verified = TRUE,
                        account_status = 'ACTIVE',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE email_address = $2
                    OR facebook_id = $1
                    RETURNING *
                    `,
                    [
                        facebookId,
                        normalizedEmail
                    ]
                );

            user =
                updateResult.rows[0];

        }
        else {

            const randomPasswordHash =
                await hashPassword(
                    crypto.randomBytes(32).toString("hex")
                );

            const insertResult =
                await pool.query(
                    `
                    INSERT INTO users
                    (
                        email_address,
                        password_hash,
                        first_name,
                        last_name,
                        email_verified,
                        account_status,
                        auth_provider,
                        facebook_id
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        TRUE,
                        'ACTIVE',
                        'FACEBOOK',
                        $5
                    )
                    RETURNING *
                    `,
                    [
                        normalizedEmail,
                        randomPasswordHash,
                        firstName,
                        lastName,
                        facebookId
                    ]
                );

            user =
                insertResult.rows[0];

        }

        const token =
            generateToken(user);

        const redirectUser = {
            email_address: user.email_address,
            first_name: user.first_name,
            last_name: user.last_name,
            auth_provider: user.auth_provider
        };

        const redirectUrl =
            `${getFrontendUrl()}/social-auth-callback` +
            `?token=${encodeURIComponent(token)}` +
            `&user=${encodeURIComponent(encodeUserForRedirect(redirectUser))}`;

        return res.redirect(redirectUrl);

    }
    catch(error) {

        console.error(error);
        return redirectSocialAuthError(
            res,
            error.message || "Facebook login failed"
        );

    }

};

const googleLogin = async (req, res) => {
    try {
        const { clientId } = getGoogleConfig();
        const state = crypto.randomBytes(32).toString("base64url");

        setGoogleStateCookie(res, state);

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: getGoogleRedirectUri(),
            response_type: "code",
            scope: "openid email profile",
            state,
            prompt: "select_account"
        });

        return res.redirect(
            `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
        );
    }
    catch(error) {
        console.error(error);
        return redirectSocialAuthError(res, error.message);
    }
};

const googleCallback = async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;
        const expectedState = getCookie(req, googleStateCookieName);
        clearGoogleStateCookie(res);

        if (error) {
            return redirectSocialAuthError(res, String(error_description || error));
        }

        if (!state || !expectedState || state !== expectedState) {
            return redirectSocialAuthError(
                res,
                "Google login could not be verified. Please try again."
            );
        }

        if (!code) {
            return redirectSocialAuthError(
                res,
                "Google did not return an authorization code."
            );
        }

        const { clientId, clientSecret } = getGoogleConfig();
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code: String(code),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: getGoogleRedirectUri(),
                grant_type: "authorization_code"
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const accessToken = tokenResponse.data?.access_token;
        if (!accessToken) {
            return redirectSocialAuthError(res, "Google did not return an access token.");
        }

        const profileResponse = await axios.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const googleProfile = profileResponse.data || {};
        const googleId = googleProfile.sub;
        const normalizedEmail = normalizeEmail(googleProfile.email);

        if (!googleId || !normalizedEmail || googleProfile.email_verified !== true) {
            return redirectSocialAuthError(
                res,
                "Google did not provide a verified email address. Please use email sign up."
            );
        }

        const existingUserResult = await pool.query(
            `SELECT * FROM users WHERE email_address = $1 OR google_id = $2`,
            [normalizedEmail, googleId]
        );

        let user;
        if (existingUserResult.rows.length > 0) {
            const userByEmail = existingUserResult.rows.find(
                (candidate) => candidate.email_address === normalizedEmail
            );
            const userByGoogleId = existingUserResult.rows.find(
                (candidate) => candidate.google_id === googleId
            );

            if (
                userByEmail &&
                userByGoogleId &&
                userByEmail.email_address !== userByGoogleId.email_address
            ) {
                return redirectSocialAuthError(
                    res,
                    "This Google account conflicts with an existing account. Please contact support."
                );
            }

            const matchedUser = userByGoogleId || userByEmail;
            const updateResult = await pool.query(
                `
                UPDATE users
                SET google_id = COALESCE(google_id, $1),
                    auth_provider = CASE WHEN auth_provider = 'LOCAL' THEN 'GOOGLE' ELSE auth_provider END,
                    email_verified = TRUE,
                    account_status = 'ACTIVE',
                    updated_at = CURRENT_TIMESTAMP
                WHERE email_address = $2
                  AND (google_id IS NULL OR google_id = $1)
                RETURNING *
                `,
                [googleId, matchedUser.email_address]
            );
            user = updateResult.rows[0];
        }
        else {
            const randomPasswordHash = await hashPassword(
                crypto.randomBytes(32).toString("hex")
            );
            const insertResult = await pool.query(
                `
                INSERT INTO users
                    (email_address, password_hash, first_name, last_name,
                     email_verified, account_status, auth_provider, google_id)
                VALUES ($1, $2, $3, $4, TRUE, 'ACTIVE', 'GOOGLE', $5)
                RETURNING *
                `,
                [
                    normalizedEmail,
                    randomPasswordHash,
                    googleProfile.given_name || "Google",
                    googleProfile.family_name || "User",
                    googleId
                ]
            );
            user = insertResult.rows[0];
        }

        const token = generateToken(user);
        const redirectUser = {
            email_address: user.email_address,
            first_name: user.first_name,
            last_name: user.last_name,
            auth_provider: user.auth_provider
        };
        const redirectUrl =
            `${getFrontendUrl()}/social-auth-callback` +
            `?token=${encodeURIComponent(token)}` +
            `&user=${encodeURIComponent(encodeUserForRedirect(redirectUser))}`;

        return res.redirect(redirectUrl);
    }
    catch(error) {
        console.error(error.response?.data || error);
        return redirectSocialAuthError(
            res,
            error.response?.data?.error_description || error.message || "Google login failed"
        );
    }
};

const verifyEmail = async (req, res) => {

    try {

        const token =
            req.query.token ||
            req.body?.token;

        if (
            !token
        ) {

            return res.status(400).json({
                message:
                    "Verification token is required"
            });

        }

        const tokenResult =
            await verifyEmailToken(
                pool,
                token
            );

        if (!tokenResult.valid) {

            return res.status(tokenResult.statusCode || 400).json({
                message:
                    tokenResult.message
            });

        }

        const normalizedEmail =
            normalizeEmail(tokenResult.emailAddress);

        const userResult =
            await pool.query(
                `
                SELECT email_address, email_verified
                FROM users
                WHERE email_address = $1
                `,
                [normalizedEmail]
            );

        if (
            userResult.rows.length === 0
        ) {

            return res.status(404).json({
                message:
                    "User was not found"
            });

        }

        if (
            userResult.rows[0].email_verified
        ) {

            return res.status(200).json({
                message:
                    "Email is already verified"
            });

        }

        await pool.query(
            `
            UPDATE users
            SET
                email_verified = TRUE,
                account_status = 'ACTIVE',
                updated_at = CURRENT_TIMESTAMP
            WHERE email_address = $1
            `,
            [normalizedEmail]
        );

        return res.status(200).json({
            message:
                "Email verified successfully. You can now sign in."
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

const resendVerificationEmail = async (req, res) => {

    try {

        const {
            email_address
        } = req.body;

        const normalizedEmail =
            normalizeEmail(email_address);

        if (
            !normalizedEmail
        ) {

            return res.status(400).json({
                message:
                    "Email is required"
            });

        }

        const userResult =
            await pool.query(
                `
                SELECT email_address, first_name, email_verified
                FROM users
                WHERE email_address = $1
                `,
                [normalizedEmail]
            );

        if (
            userResult.rows.length === 0
        ) {

            return res.status(404).json({
                message:
                    "User was not found"
            });

        }

        const user =
            userResult.rows[0];

        if (
            user.email_verified
        ) {

            return res.status(400).json({
                message:
                    "Email is already verified"
            });

        }

        await sendVerificationLink({
            emailAddress: normalizedEmail,
            firstName: user.first_name
        });

        return res.status(200).json({
            message:
                "A new verification email has been sent"
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
    facebookLogin,
    facebookCallback,
    googleLogin,
    googleCallback,
    verifyEmail,
    resendVerificationEmail,
    profile
};
