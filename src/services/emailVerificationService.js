const dns = require("dns").promises;
const net = require("net");
const validator = require("validator");

const SMTP_TIMEOUT_MS = Number(
    process.env.EMAIL_SMTP_TIMEOUT_MS || 8000
);

const normalizeEmail = (email) =>
    String(email || "").trim().toLowerCase();

const isEmailStructureValid = (email) =>
    validator.isEmail(email, {
        require_tld: true,
        allow_utf8_local_part: false
    });

const getEmailDomain = (email) =>
    email.split("@").pop();

const resolveMailTargets = async (domain) => {

    try {

        const mxRecords =
            await dns.resolveMx(domain);

        if (mxRecords.length > 0) {

            return mxRecords
                .filter(record => record.exchange)
                .sort((a, b) => a.priority - b.priority)
                .map(record => record.exchange);

        }

    }
    catch(error) {

        if (
            error.code !== "ENODATA" &&
            error.code !== "ENOTFOUND"
        ) {
            throw error;
        }

    }

    try {

        const addresses =
            await dns.resolve(domain);

        return addresses.length > 0 ? [domain] : [];

    }
    catch(error) {

        if (
            error.code === "ENODATA" ||
            error.code === "ENOTFOUND"
        ) {
            return [];
        }

        throw error;

    }

};

const readSmtpResponse = (socket) =>
    new Promise((resolve, reject) => {

        const chunks = [];

        const cleanup = () => {
            socket.off("data", handleData);
            socket.off("error", reject);
            socket.off("timeout", handleTimeout);
        };

        const handleTimeout = () => {
            cleanup();
            reject(new Error("SMTP verification timed out"));
        };

        const handleData = (chunk) => {

            chunks.push(chunk.toString("utf8"));
            const text = chunks.join("");
            const lines = text.trimEnd().split(/\r?\n/);
            const lastLine = lines[lines.length - 1] || "";

            if (/^\d{3}\s/.test(lastLine)) {
                cleanup();
                resolve(text);
            }

        };

        socket.on("data", handleData);
        socket.on("error", reject);
        socket.on("timeout", handleTimeout);

    });

const sendSmtpCommand = async (socket, command) => {

    socket.write(`${command}\r\n`);
    return readSmtpResponse(socket);

};

const getSmtpCode = (response) => {

    const match =
        String(response).match(/^(\d{3})/m);

    return match ? Number(match[1]) : null;

};

const verifyMailboxWithSmtp = async (
    email,
    mailTarget
) => {

    const socket =
        net.createConnection(25, mailTarget);

    socket.setTimeout(SMTP_TIMEOUT_MS);

    try {

        await new Promise((resolve, reject) => {
            socket.once("connect", resolve);
            socket.once("error", reject);
            socket.once("timeout", () => reject(
                new Error("SMTP connection timed out")
            ));
        });

        await readSmtpResponse(socket);

        await sendSmtpCommand(
            socket,
            `EHLO ${process.env.EMAIL_VERIFICATION_HELO_DOMAIN || "horizonelite.local"}`
        );

        await sendSmtpCommand(
            socket,
            `MAIL FROM:<${process.env.EMAIL_VERIFICATION_FROM || "verify@horizonelite.local"}>`
        );

        const rcptResponse =
            await sendSmtpCommand(
                socket,
                `RCPT TO:<${email}>`
            );

        const rcptCode =
            getSmtpCode(rcptResponse);

        await sendSmtpCommand(socket, "QUIT").catch(() => {});

        if (
            rcptCode === 250 ||
            rcptCode === 251
        ) {
            return {
                checked: true,
                exists: true
            };
        }

        if (
            rcptCode === 550 ||
            rcptCode === 551 ||
            rcptCode === 553
        ) {
            return {
                checked: true,
                exists: false
            };
        }

        return {
            checked: false,
            exists: null
        };

    }
    finally {
        socket.destroy();
    }

};

const verifyEmailAddress = async (email) => {

    const normalizedEmail =
        normalizeEmail(email);

    if (!isEmailStructureValid(normalizedEmail)) {

        return {
            valid: false,
            normalizedEmail,
            reason: "invalid_structure",
            message: "Email structure is invalid"
        };

    }

    const domain =
        getEmailDomain(normalizedEmail);

    const mailTargets =
        await resolveMailTargets(domain);

    if (mailTargets.length === 0) {

        return {
            valid: false,
            normalizedEmail,
            reason: "domain_not_found",
            message: "Email domain does not exist or cannot receive email"
        };

    }

    if (process.env.EMAIL_SMTP_VERIFY === "true") {

        try {

            const smtpResult =
                await verifyMailboxWithSmtp(
                    normalizedEmail,
                    mailTargets[0]
                );

            if (
                smtpResult.checked &&
                !smtpResult.exists
            ) {

                return {
                    valid: false,
                    normalizedEmail,
                    reason: "mailbox_not_found",
                    message: "Email address does not exist"
                };

            }

            if (smtpResult.checked) {

                return {
                    valid: true,
                    normalizedEmail,
                    reason: "mailbox_exists",
                    message: "Email address exists"
                };

            }

        }
        catch(error) {
            console.warn(
                "SMTP email verification skipped:",
                error.message
            );
        }

    }

    return {
        valid: true,
        normalizedEmail,
        reason: "domain_exists",
        message: "Email structure is valid and the domain can receive email"
    };

};

module.exports = {
    normalizeEmail,
    isEmailStructureValid,
    verifyEmailAddress
};
