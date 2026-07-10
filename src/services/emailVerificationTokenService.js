const crypto = require("crypto");

const TOKEN_TTL_MINUTES = Number(
    process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 60
);

const createVerificationTokenTable = async (pool) => {

    await pool.query(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
            email_address VARCHAR(50) UNIQUE NOT NULL,
            token_hash VARCHAR(255) PRIMARY KEY,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

};

const generateToken = () =>
    crypto.randomBytes(32).toString("hex");

const hashToken = (token) =>
    crypto
        .createHash("sha256")
        .update(`${token}:${process.env.EMAIL_VERIFICATION_TOKEN_SECRET || "horizon-elite-email-token-secret"}`)
        .digest("hex");

const issueVerificationToken = async (
    pool,
    emailAddress
) => {

    await createVerificationTokenTable(pool);

    const token =
        generateToken();

    await pool.query(
        `
        INSERT INTO email_verification_tokens (
            email_address,
            token_hash,
            expires_at,
            created_at
        )
        VALUES (
            $1,
            $2,
            LOCALTIMESTAMP + ($3 || ' minutes')::INTERVAL,
            LOCALTIMESTAMP
        )
        ON CONFLICT (email_address)
        DO UPDATE SET
            token_hash = EXCLUDED.token_hash,
            expires_at = EXCLUDED.expires_at,
            created_at = LOCALTIMESTAMP
        `,
        [
            emailAddress,
            hashToken(token),
            TOKEN_TTL_MINUTES
        ]
    );

    return token;

};

const verifyEmailToken = async (
    pool,
    token
) => {

    await createVerificationTokenTable(pool);

    const tokenHash =
        hashToken(String(token || "").trim());

    const result =
        await pool.query(
            `
            SELECT
                email_address,
                expires_at <= LOCALTIMESTAMP AS is_expired
            FROM email_verification_tokens
            WHERE token_hash = $1
            `,
            [tokenHash]
        );

    if (result.rows.length === 0) {
        return {
            valid: false,
            statusCode: 400,
            message: "Verification link is invalid. Please request a new verification email."
        };
    }

    const record =
        result.rows[0];

    if (record.is_expired) {
        return {
            valid: false,
            statusCode: 400,
            message: "Verification link has expired. Please request a new verification email."
        };
    }

    await pool.query(
        `
        DELETE FROM email_verification_tokens
        WHERE token_hash = $1
        `,
        [tokenHash]
    );

    return {
        valid: true,
        emailAddress: record.email_address,
        message: "Email verified successfully"
    };

};

module.exports = {
    issueVerificationToken,
    verifyEmailToken
};
