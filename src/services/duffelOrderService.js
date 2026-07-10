const pool =
require("../config/db");

const {
    createDuffelOrder,
    getDuffelOfferById
} = require(
    "./duffelApiService"
);

const PLACEHOLDER_OFFER_ID =
"off_0000000000000000";

const isValidDuffelOfferId =
(offerId) => {
    return (
        typeof offerId === "string" &&
        offerId.startsWith("off_") &&
        offerId !== PLACEHOLDER_OFFER_ID
    );
};

const getLocalPassengerType =
(passengerTypeCode) => {
    const value =
    (passengerTypeCode || "")
    .toString()
    .trim()
    .toUpperCase();

    if (value === "CHD" || value === "CNN") {
        return "child";
    }

    if (value === "INF") {
        return "infant";
    }

    return "adult";
};

const getDuffelPassengerType =
(duffelPassengerType) => {
    const value =
    (duffelPassengerType || "")
    .toString()
    .trim()
    .toLowerCase();

    if (value.startsWith("infant")) {
        return "infant";
    }

    if (value === "child") {
        return "child";
    }

    return "adult";
};

const extractDuffelErrors =
(error) => {
    const errors =
    error?.response?.data?.errors;

    return Array.isArray(errors)
        ? errors
        : [];
};

const isOfferUnavailableError =
(error) => {
    if (
        error?.duffelErrorCode ===
        "offer_no_longer_available"
    ) {
        return true;
    }

    const duffelErrors =
    extractDuffelErrors(error);

    return duffelErrors.some(
        (item) =>
            item?.code === "offer_no_longer_available" ||
            (item?.title || "")
            .toLowerCase()
            .includes("no longer available")
    );
};

const buildOfferUnavailableError = () => {
    const error =
    new Error(
        "Selected offer is no longer available. " +
        "Please run a new flight search and select a new offer."
    );

    error.statusCode = 409;
    error.duffelErrorCode = "offer_no_longer_available";

    return error;
};

const cleanupExpiredOfferPaymentState =
async ({
    bookingId,
    payment
}) => {

    if (!payment || payment.payment_status_code !== "PAID") {
        return;
    }

    await pool.query(
        `
        UPDATE bookings
        SET
            booking_status = 'PAID_UNTICKETED',
            ticketing_status = 'FAILED',
            booking_updated_at = NOW()
        WHERE booking_id = $1
        `,
        [bookingId]
    );

};

const getBookingOfferId =
async (booking_id) => {

    const result =
    await pool.query(
        `
        SELECT
            sf.selected_flight_id,
            sf.flight_result_id,
            sf.flight_offer_id AS selected_offer_id,
            fr.flight_offer_id AS result_offer_id
        FROM bookings b
        JOIN selected_flights sf
            ON sf.selected_flight_id = b.selected_flight_id
        LEFT JOIN flight_results fr
            ON fr.flight_result_id = sf.flight_result_id
        WHERE b.booking_id = $1
        LIMIT 1
        `,
        [booking_id]
    );

    if (result.rows.length === 0) {
        const error =
        new Error("Booking offer not found");
        error.statusCode = 404;
        throw error;
    }

    const row =
    result.rows[0];

    const offerId =
    isValidDuffelOfferId(row.selected_offer_id)
        ? row.selected_offer_id
        : row.result_offer_id;

    if (!isValidDuffelOfferId(offerId)) {
        const error =
        new Error(
            `Invalid Duffel offer ID: ${offerId}. ` +
            "Run a new flight search and select a fresh result."
        );
        error.statusCode = 400;
        throw error;
    }

    return {
        offerId,
        selectedFlightId: row.selected_flight_id,
        selectedFlightResultId: row.flight_result_id
    };
};

const validateBookingOfferService =
async ({
    booking_id
}) => {

    if (!booking_id) {
        const error =
        new Error("booking_id is required");
        error.statusCode = 400;
        throw error;
    }

    const {
        offerId,
        selectedFlightId,
        selectedFlightResultId
    } =
    await getBookingOfferId(booking_id);

    try {
        const offer =
        await getDuffelOfferById(offerId);

        return {
            available: true,
            offer_id: offerId,
            offer
        };
    }
    catch (duffelError) {
        if (isOfferUnavailableError(duffelError)) {
            await pool.query(
                `
                UPDATE selected_flights
                SET
                    selection_status = 'EXPIRED',
                    date_modified = NOW()
                WHERE selected_flight_id = $1
                `,
                [selectedFlightId]
            );

            if (selectedFlightResultId) {
                await pool.query(
                    `
                    UPDATE flight_results
                    SET
                        flight_result_status = 'EXPIRED'
                    WHERE flight_result_id = $1
                    `,
                    [selectedFlightResultId]
                );
            }

            throw buildOfferUnavailableError();
        }

        throw duffelError;
    }

};

const createDuffelOrderService =
async ({
    booking_id,
    payment_id
}) => {

    const client =
    await pool.connect();

    let selectedFlightId = null;
    let selectedFlightResultId = null;
    let paymentForCleanup = null;

    try {

        await client.query(
            "BEGIN"
        );

        /*
        ----------------------------
        Verify Payment (First)
        ----------------------------
        */

        const paymentResult =
        await client.query(
            `
            SELECT *
            FROM payments
            WHERE payment_id = $1
            AND booking_id = $2
            `,
            [
                payment_id,
                booking_id
            ]
        );

        if (
            paymentResult.rows.length === 0
        ) {

            throw new Error(
                "Payment not found"
            );

        }

        const payment =
        paymentResult.rows[0];

        paymentForCleanup =
        payment;

        if (
            payment.payment_status_code !==
            "PAID"
        ) {

            throw new Error(
                "Payment not completed"
            );

        }

        /*
        ----------------------------
        Verify Booking (by PNR from payment)
        ----------------------------
        */

        const bookingResult =
        await client.query(
            `
            SELECT *
            FROM bookings
            WHERE booking_id = $1
            AND pnr_reference = $2
            `,
            [
                booking_id,
                payment.pnr_reference
            ]
        );

        if (
            bookingResult.rows.length === 0
        ) {

            throw new Error(
                "Booking not found"
            );

        }

        if (
            payment.payment_status_code !==
            "PAID"
        ) {

            throw new Error(
                "Payment not completed"
            );

        }

        /*
        ----------------------------
        Create Duffel Order Record
        ----------------------------
        */

        const orderResult =
        await client.query(
            `
            INSERT INTO
            duffel_orders
            (
                booking_id,
                payment_id,
                order_status
            )
            VALUES
            (
                $1,
                $2,
                $3
            )
            RETURNING *
            `,
            [
                booking_id,
                payment_id,
                "PENDING_DUFFEL"
            ]
        );

        /*
        --------------------------------
        Get Selected Flight
        --------------------------------
        */

        const selectedFlightResult =
        await client.query(
            `
            SELECT *
            FROM selected_flights
            WHERE selected_flight_id = $1
            `,
            [
            bookingResult.rows[0]
            .selected_flight_id
            ]
            );

            if (
                selectedFlightResult.rows.length === 0
            ) {

                throw new Error(
                    "Selected Flight not found"
                );

            }

        const selectedFlight =
        selectedFlightResult.rows[0];

        selectedFlightId =
        selectedFlight.selected_flight_id;

        selectedFlightResultId =
        selectedFlight.flight_result_id;

        let offerId =
        selectedFlight.flight_offer_id;

        if (
            !isValidDuffelOfferId(offerId)
        ) {

            const flightResultOffer =
            await client.query(
                `
                SELECT flight_offer_id
                FROM flight_results
                WHERE flight_result_id = $1
                `,
                [selectedFlight.flight_result_id]
            );

            if (
                flightResultOffer.rows.length > 0 &&
                isValidDuffelOfferId(
                    flightResultOffer.rows[0].flight_offer_id
                )
            ) {

                offerId =
                flightResultOffer.rows[0].flight_offer_id;

                // Keep selected_flights in sync so later requests do not fail.
                await client.query(
                    `
                    UPDATE selected_flights
                    SET
                        flight_offer_id = $1,
                        date_modified = NOW()
                    WHERE selected_flight_id = $2
                    `,
                    [
                        offerId,
                        selectedFlight.selected_flight_id
                    ]
                );

            }

        }

        if (
            !isValidDuffelOfferId(offerId)
        ) {

            const error =
            new Error(
                `Invalid Duffel offer ID: ${offerId}. ` +
                `Run a new flight search, select a fresh result, ` +
                `then create the order again.`
            );

            error.statusCode = 400;

            throw error;

        }

        let offerResponse;

        try {

            offerResponse =
            await getDuffelOfferById(
                offerId
            );

        }
        catch (duffelError) {

            if (isOfferUnavailableError(duffelError)) {
                throw buildOfferUnavailableError();
            }

            throw duffelError;

        }

        const offerData =
        offerResponse?.data || {};

        const offerAmount =
        offerData.total_amount ||
        payment.total_payment_amount;

        const offerCurrency =
        offerData.total_currency ||
        payment.currency_code;

        /*
        --------------------------------
        Get Passengers
        --------------------------------
        */

        const passengerResult =
        await client.query(
            `
            SELECT p.*
            FROM booking_passengers bp
            INNER JOIN passengers p
            ON bp.passenger_id =
            p.passenger_id
            WHERE bp.booking_id = $1
            `,
            [
            booking_id
            ]
            );

        /*
        --------------------------------
        Build Duffel Passenger Payload
        --------------------------------
        */

        // Valid Duffel titles: mr, mrs, ms, mx, dr
        const mapTitle = (title) => {
            const titleLower = title.toLowerCase().trim();
            const titleMap = {
                'mr': 'mr',
                'mr.': 'mr',
                'master': 'mr',          // Master (boy/child)
                'mrs': 'mrs',
                'mrs.': 'mrs',
                'ms': 'ms',
                'ms.': 'ms',
                'miss': 'ms',            // Miss → Ms
                'dr': 'dr',
                'dr.': 'dr',
                'mx': 'mx',
                'mx.': 'mx'
            };

            return titleMap[titleLower] || 'mr'; // Default to 'mr' if unknown
        };

        const localPassengers =
        passengerResult.rows;

        const offerPassengers =
        offerData.passengers || [];

        if (offerPassengers.length === 0) {
            const error =
            new Error(
                "Offer has no passengers in Duffel response"
            );
            error.statusCode = 400;
            throw error;
        }

        const localByType = {
            adult: [],
            child: [],
            infant: []
        };

        for (const passenger of localPassengers) {
            localByType[
                getLocalPassengerType(
                    passenger.pi_passenger_type_code
                )
            ].push(passenger);
        }

        const offerByType = {
            adult: [],
            child: [],
            infant: []
        };

        for (const offerPassenger of offerPassengers) {
            offerByType[
                getDuffelPassengerType(
                    offerPassenger.type
                )
            ].push(offerPassenger);
        }

        for (const type of ["adult", "child", "infant"]) {
            if (localByType[type].length !== offerByType[type].length) {
                const error =
                new Error(
                    `Passenger type mismatch for ${type}: ` +
                    `booking has ${localByType[type].length}, ` +
                    `offer expects ${offerByType[type].length}`
                );
                error.statusCode = 400;
                throw error;
            }
        }

        const passengers = [];

        for (const type of ["adult", "child", "infant"]) {
            for (let i = 0; i < localByType[type].length; i++) {
                const passenger =
                localByType[type][i];
                const offerPassenger =
                offerByType[type][i];

                passengers.push({
                    id: offerPassenger.id,

                    title:
                    mapTitle(passenger.pi_title),

                    given_name:
                    passenger.pi_first_name,

                    family_name:
                    passenger.pi_last_name,

                    born_on:
                    passenger.pi_date_of_birth
                        .toISOString()
                        .split("T")[0],

                    gender:
                    passenger.pi_gender === "M"
                        ? "m"
                        : passenger.pi_gender === "F"
                        ? "f"
                        : "x",

                    email:
                    passenger.pi_contact_email,

                    phone_number:
                    passenger.pi_contact_phone
                });
            }
        }

        if (
            passengers.length === 0
        ) {

            throw new Error(
                "Booking has no passengers"
            );

        }

        /*
        --------------------------------
        Call Duffel API
        --------------------------------
        */
        console.log("========== DUFFEL DEBUG ==========");

        console.log("Offer ID:");
        console.log(offerId);

        console.log("Passengers:");
        console.log(JSON.stringify(passengers, null, 2));

        console.log("Payment:");
        console.log(payment);

        console.log("Booking:");
        console.log(bookingResult.rows[0]);

        console.log("=================================");

        console.log("Payment object:");
        console.log(payment);

        let duffelResponse;

        try {

            duffelResponse =
            await createDuffelOrder(

                offerId,

                passengers,

                offerAmount,

                offerCurrency

            );

        }
        catch (duffelError) {

            if (isOfferUnavailableError(duffelError)) {
                throw buildOfferUnavailableError();
            }

            throw duffelError;

        }

        /*
        --------------------------------
        Save Duffel Response
        --------------------------------
        */

        await client.query(
        `
        UPDATE duffel_orders
        SET

        duffel_response = $1,

        order_status = 'CREATED',

        updated_at = NOW()

        WHERE duffel_order_id = $2
        `,
        [
        JSON.stringify(
            duffelResponse
        ),
        orderResult.rows[0]
        .duffel_order_id
        ]
        );

        const ticketNumber =
            `HE${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 9000 + 1000)}`;

        await client.query(
            `
            UPDATE bookings
            SET
                booking_status = 'TICKETED',
                ticketing_status = 'TICKETED',
                ticket_number = COALESCE(ticket_number, $1),
                booking_updated_at = NOW()
            WHERE booking_id = $2
            `,
            [
                ticketNumber,
                booking_id
            ]
        );

        await client.query(
            "COMMIT"
        );

        return {

            local_order:
            orderResult.rows[0],

            duffel_order:
            duffelResponse

        };

    }
    catch(error) {

        const normalizedError =
        isOfferUnavailableError(error)
            ? buildOfferUnavailableError()
            : error;

        await client.query(
            "ROLLBACK"
        );

        if (
            normalizedError.duffelErrorCode ===
            "offer_no_longer_available"
        ) {

            try {

                if (selectedFlightId) {
                    await pool.query(
                        `
                        UPDATE selected_flights
                        SET
                            selection_status = 'EXPIRED',
                            date_modified = NOW()
                        WHERE selected_flight_id = $1
                        `,
                        [selectedFlightId]
                    );
                }

                if (selectedFlightResultId) {
                    await pool.query(
                        `
                        UPDATE flight_results
                        SET
                            flight_result_status = 'EXPIRED'
                        WHERE flight_result_id = $1
                        `,
                        [selectedFlightResultId]
                    );
                }

                await cleanupExpiredOfferPaymentState({
                    bookingId: booking_id,
                    payment: paymentForCleanup
                });

            }
            catch (statusUpdateError) {

                console.error(
                    "Failed to mark expired offer state:",
                    statusUpdateError.message
                );

            }

        }

        throw normalizedError;

    }
    finally {

        client.release();

    }

};

module.exports = {
    createDuffelOrderService,
    validateBookingOfferService
};
