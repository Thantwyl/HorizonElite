const arrivalCardRules = [
    {
        countries: ["THA", "THAILAND"],
        airports: ["BKK", "DMK", "HKT", "CNX", "KBV", "USM"],
        headline: "Thailand requires eligible travelers to submit the Thailand Digital Arrival Card before arrival.",
        forms: [
            {
                title: "Thailand Digital Arrival Card",
                description: "Complete the digital arrival card within 3 days before arriving in Thailand.",
                url: "https://tdac.immigration.go.th/"
            }
        ]
    },
    {
        countries: ["SGP", "SINGAPORE"],
        airports: ["SIN"],
        headline: "Singapore requires travelers to submit the SG Arrival Card before arrival.",
        forms: [
            {
                title: "SG Arrival Card",
                description: "Submit the SG Arrival Card before arriving in Singapore.",
                url: "https://eservices.ica.gov.sg/sgarrivalcard/"
            }
        ]
    },
    {
        countries: ["MYS", "MALAYSIA"],
        airports: ["KUL", "SZB", "PEN", "JHB", "BKI", "KCH"],
        headline: "Malaysia uses the Malaysia Digital Arrival Card for many international arrivals.",
        forms: [
            {
                title: "Malaysia Digital Arrival Card",
                description: "Review and complete the Malaysia Digital Arrival Card if required for your trip.",
                url: "https://imigresen-online.imi.gov.my/mdac/main"
            }
        ]
    },
    {
        countries: ["KHM", "CAMBODIA"],
        airports: ["PNH", "SAI", "REP"],
        headline: "Cambodia offers an electronic arrival card for international arrivals.",
        forms: [
            {
                title: "Cambodia e-Arrival Card",
                description: "Review and complete the Cambodia e-Arrival Card before arrival if required.",
                url: "https://www.arrival.gov.kh/"
            }
        ]
    },
    {
        countries: ["KOR", "SOUTH KOREA", "KOREA"],
        airports: ["ICN", "GMP", "PUS", "CJU"],
        headline: "South Korea may require electronic travel authorization or arrival documentation depending on nationality.",
        forms: [
            {
                title: "K-ETA Official Portal",
                description: "Check whether your nationality requires K-ETA or other arrival documentation.",
                url: "https://www.k-eta.go.kr/"
            }
        ]
    },
    {
        countries: ["JPN", "JAPAN"],
        airports: ["NRT", "HND", "KIX", "ITM", "NGO", "FUK", "CTS"],
        headline: "Japan provides Visit Japan Web for arrival procedures and immigration/customs preparation.",
        forms: [
            {
                title: "Visit Japan Web",
                description: "Use Visit Japan Web to prepare immigration and customs declaration steps before arrival.",
                url: "https://www.vjw.digital.go.jp/"
            }
        ]
    }
];

const normalizeCode = (value) =>
    String(value || "")
        .trim()
        .toUpperCase();

const findArrivalCardRule = (booking) => {
    const destinationAirport = normalizeCode(booking.destination_airport_code);
    const destinationCountry = normalizeCode(booking.destination_country_code || booking.destination_country);

    return arrivalCardRules.find((rule) =>
        rule.airports.includes(destinationAirport) ||
        rule.countries.includes(destinationCountry)
    );
};

const getArrivalCardRequirements = async (booking) => {
    const rule = findArrivalCardRule(booking);

    if (rule) {
        return {
            provider: "local-mock",
            headline: rule.headline,
            forms: rule.forms
        };
    }

    return {
        provider: "local-mock",
        headline: "Check whether your destination requires an arrival card or digital immigration form before you travel.",
        forms: [
            {
                title: "Destination arrival requirements",
                description: "No showcase rule is saved for this destination yet. Please verify the latest arrival-card or immigration form requirements with official government or airline sources.",
                url: ""
            }
        ]
    };
};

module.exports = {
    getArrivalCardRequirements
};
