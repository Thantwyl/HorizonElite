const mapDuffelOffer = (offer) => {

    const firstSlice =
        offer.slices?.[0];

    const firstSegment =
        firstSlice?.segments?.[0];

    const lastSegment =
        firstSlice?.segments?.[
            firstSlice.segments.length - 1
        ];

    return {

        flight_offer_id:
            offer.id,

        airline_name:
            offer.owner?.name,

        airline_code:
            offer.owner?.iata_code,

        total_price:
            offer.total_amount,

        currency_code:
            offer.total_currency,

        departure_airport:
            firstSegment?.origin?.iata_code,

        arrival_airport:
            lastSegment?.destination?.iata_code,

        departure_datetime:
            firstSegment?.departing_at,

        arrival_datetime:
            lastSegment?.arriving_at,

        total_stop_count:
            firstSlice?.segments.length - 1,

        cabin_class:
            firstSegment?.cabin_class

    };

};

const mapDuffelOffers = (offers) => {

    return offers.map((offer) => {

        const firstSlice =
            offer.slices?.[0];

        const firstSegment =
            firstSlice?.segments?.[0];

        const lastSegment =
            firstSlice?.segments?.[
                firstSlice.segments.length - 1
            ];

        return {

            flight_offer_id:
                offer.id,

            airline_name:
                offer.owner?.name,

            airline_code:
                offer.owner?.iata_code,

            total_price:
                offer.total_amount,

            currency_code:
                offer.total_currency,

            departure_airport:
                firstSegment?.origin?.iata_code,

            arrival_airport:
                lastSegment?.destination?.iata_code,

            departure_datetime:
                firstSegment?.departing_at,

            arrival_datetime:
                lastSegment?.arriving_at,

            total_stop_count:
                firstSlice?.segments.length - 1,

            cabin_class:
                firstSegment?.cabin_class

        };

    });

};

module.exports = {
    mapDuffelOffer,
    mapDuffelOffers
};