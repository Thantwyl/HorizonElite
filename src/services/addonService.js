const { save } = require("pdfkit");
const pool = require("../config/db");

const normalizeAddonStatus = (status) => {
    const value = String(status || "").trim().toUpperCase();
    return value || "PAID";
};

/**
 * Create Addon (Seat / Meal / Baggage / etc.)
 */
const createAddon = async ({
    booking_id,
    passenger_id,
    selected_flight_id,
    addon_type,
    addon_code,
    addon_detail,
    addon_price,
    currency_code,
    quantity,
    addon_status
}) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const result = await client.query(
            `
            INSERT INTO passenger_addons
            (
                booking_id,
                passenger_id,
                selected_flight_id,
                addon_type,
                addon_code,
                addon_detail,
                addon_price,
                currency_code,
                quantity,
                addon_status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *;
            `,
            [
                booking_id,
                passenger_id,
                selected_flight_id,
                addon_type,
                addon_code,
                addon_detail,
                addon_price,
                currency_code,
                quantity || 1,
                normalizeAddonStatus(addon_status)
            ]
        );

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};


/*
|--------------------------------------------------------------------------
| Get all addons for booking (Manage Booking)
|--------------------------------------------------------------------------
*/

const getBookingAddons = async (booking_id) => {

    const result = await pool.query(
        `
        SELECT *
        FROM passenger_addons
        WHERE booking_id = $1
        ORDER BY created_at DESC
        `,
        [booking_id]
    );

    return result.rows;
};

const getPaidBookingAddons = async (booking_id) => {

    const result = await pool.query(
        `
        SELECT *
        FROM passenger_addons
        WHERE booking_id = $1
        AND COALESCE(addon_status, 'PAID') = 'PAID'
        ORDER BY created_at ASC
        `,
        [booking_id]
    );

    return result.rows;
};

const markPendingAddonsPaid = async ({
    booking_id,
    passenger_id,
    addon_ids,
    payment_id
}) => {

    if (!booking_id || !payment_id || !Array.isArray(addon_ids) || addon_ids.length === 0) {
        return [];
    }

    const result = await pool.query(
        `
        UPDATE passenger_addons
        SET
            addon_status = 'PAID',
            payment_id = $1,
            paid_at = NOW(),
            updated_at = NOW()
        WHERE booking_id = $2
        AND addon_id = ANY($3::uuid[])
        AND ($4::uuid IS NULL OR passenger_id = $4)
        AND COALESCE(addon_status, 'PAID') = 'PENDING_PAYMENT'
        RETURNING *
        `,
        [
            payment_id,
            booking_id,
            addon_ids,
            passenger_id || null
        ]
    );

    return result.rows;
};

/*
|--------------------------------------------------------------------------
| Get Baggage Options
|--------------------------------------------------------------------------
*/

const getBaggageOptions = async () => {

    return [

        {
            code: "BAG05",
            weight: 5,
            description: "Extra Checked Baggage 5kg",
            price: 10,
            currency: "USD"
        },

        {
            code: "BAG10",
            weight: 10,
            description: "Extra Checked Baggage 10kg",
            price: 20,
            currency: "USD"
        },

        {
            code: "BAG15",
            weight: 15,
            description: "Extra Checked Baggage 15kg",
            price: 30,
            currency: "USD"
        },

        {
            code: "BAG20",
            weight: 20,
            description: "Extra Checked Baggage 20kg",
            price: 40,
            currency: "USD"
        },

        {
            code: "BAG25",
            weight: 25,
            description: "Extra Checked Baggage 25kg",
            price: 50,
            currency: "USD"
        },

        {
            code: "BAG30",
            weight: 30,
            description: "Extra Checked Baggage 30kg",
            price: 60,
            currency: "USD"
        },

        {
            code: "BAG35",
            weight: 35,
            description: "Extra Checked Baggage 35kg",
            price: 70,
            currency: "USD"
        },

        {
            code: "BAG40",
            weight: 40,
            description: "Extra Checked Baggage 40kg",
            price: 80,
            currency: "USD"
        }

    ];

};

/*
|--------------------------------------------------------------------------
| Get Baggage Option By Code
|--------------------------------------------------------------------------
*/

const normalizeBaggageCode = (code) => {

    const value =
        String(code || "")
            .trim()
            .toUpperCase();

    if (/^BG\d+$/i.test(value)) {
        return value.replace(/^BG/, "BAG");
    }

    return value;

};

const getBaggageOptionByCode = async (code) => {

    const baggageOptions =
        await getBaggageOptions();

    const normalizedCode =
        normalizeBaggageCode(code);

    return baggageOptions.find(

        item => item.code === normalizedCode

    );

};

/*
|--------------------------------------------------------------------------
| Save Passenger Baggage
|--------------------------------------------------------------------------
*/

const savePassengerBaggage = async (

    bookingId,

    passengerId,

    selectedFlightId,

    baggageCode

) => {

    const baggage =
        await getBaggageOptionByCode(
            baggageCode
        );

    if (!baggage) {

        throw new Error(
            "Invalid baggage option."
        );

    }

    /*
    ------------------------------------
    Check existing baggage
    ------------------------------------
    */

    const existing =
        await pool.query(

            `
            SELECT addon_id

            FROM booking_addons

            WHERE booking_id=$1

            AND passenger_id=$2

            AND addon_type='BAGGAGE'
            `,

            [

                bookingId,

                passengerId

            ]

        );

    /*
    ------------------------------------
    Update Existing
    ------------------------------------
    */

    if (

        existing.rows.length > 0

    ) {

        await pool.query(

            `
            UPDATE booking_addons

            SET

            addon_code=$1,

            addon_detail=$2,

            addon_price=$3,

            currency_code=$4,

            updated_at=NOW()

            WHERE addon_id=$5
            `,

            [

                baggage.code,

                baggage.description,

                baggage.price,

                baggage.currency,

                existing.rows[0].addon_id

            ]

        );

        return {

            action: "UPDATED"

        };

    }

    /*
    ------------------------------------
    Insert New
    ------------------------------------
    */

    await pool.query(

        `
        INSERT INTO booking_addons(

            booking_id,

            passenger_id,

            selected_flight_id,

            addon_type,

            addon_code,

            addon_detail,

            addon_price,

            currency_code,

            addon_status

        )

        VALUES(

            $1,$2,$3,

            'BAGGAGE',

            $4,$5,$6,$7,

            'ACTIVE'

        )
        `,

        [

            bookingId,

            passengerId,

            selectedFlightId,

            baggage.code,

            baggage.description,

            baggage.price,

            baggage.currency

        ]

    );

    return {

        action: "CREATED"

    };

};

module.exports = {
    createAddon,
    getBookingAddons,
    getPaidBookingAddons,
    getBaggageOptions,
    getBaggageOptionByCode,
    normalizeBaggageCode,
    markPendingAddonsPaid,
    savePassengerBaggage
};
