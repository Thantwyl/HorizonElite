const axios = require("axios");

const DEFAULT_BASE = "USD";
const CACHE_TTL_MS = 60 * 60 * 1000;
const FRANKFURTER_BASE_URL =
    process.env.FRANKFURTER_API_URL || "https://api.frankfurter.dev/v2";

let cachedRates = null;
let cachedAt = 0;

const normalizeCurrencyCode = (value, fallback = DEFAULT_BASE) =>
    String(value || fallback).trim().toUpperCase();

const getExchangeRates = async (baseCurrency = DEFAULT_BASE) => {
    const base = normalizeCurrencyCode(baseCurrency);
    const now = Date.now();

    if (
        cachedRates &&
        cachedRates.base === base &&
        now - cachedAt < CACHE_TTL_MS
    ) {
        return {
            ...cachedRates,
            cached: true
        };
    }

    const response = await axios.get(
        `${FRANKFURTER_BASE_URL}/rates`,
        {
            params: { base },
            timeout: 8000
        }
    );

    const rows = Array.isArray(response.data) ? response.data : [];
    const rates = rows.reduce((items, row) => {
        const quote = normalizeCurrencyCode(row.quote, "");
        const rate = Number(row.rate);

        if (quote && Number.isFinite(rate)) {
            items[quote] = rate;
        }

        return items;
    }, { [base]: 1 });

    cachedRates = {
        base,
        date: rows[0]?.date || new Date().toISOString().slice(0, 10),
        provider: "Frankfurter",
        rates
    };
    cachedAt = now;

    return {
        ...cachedRates,
        cached: false
    };
};

module.exports = {
    getExchangeRates
};
