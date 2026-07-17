require("./src/config/loadEnv");

const express = require("express");
const cors = require("cors");
const pool = require("./src/config/db");

const {
    ensureRuntimeSchema
} = require("./src/services/schemaMigrationService");

console.log("APP.JS LOADED");
console.log("Flight Result Routes Registered");

const translationRoutes =
require("./src/routes/translationRoutes");

const authRoutes =
require("./src/routes/authRoutes");

const profileRoutes =
require("./src/routes/profileRoutes");

const flightSearchRoutes =
require("./src/routes/flightSearchRoutes");

const flightResultRoutes =
require("./src/routes/flightResultRoutes");

const duffelRoutes =
require("./src/routes/duffelRoutes");

const selectedFlightRoutes =
require("./src/routes/selectedFlightRoutes");

const passengerRoutes =
require("./src/routes/passengerRoutes");

const bookingRoutes =
require("./src/routes/bookingRoutes");

const paymentRoutes =
require("./src/routes/paymentRoutes");

const duffelOrderRoutes =
require("./src/routes/duffelOrderRoutes");

const manageBookingRoutes =
require("./src/routes/manageBookingRoutes");

const ticketRoutes =
require("./src/routes/ticketRoutes");
const boardingPassRoutes = require("./src/routes/boardingPassRoutes");
const checkInRoutes = require("./src/routes/checkInRoutes");
const whatsappRoutes = require("./src/routes/whatsappRoutes");

const addonRoutes = 
require("./src/routes/addonRoutes");

const mealRoutes = 
require("./src/routes/mealRoutes");

const seatRoutes = 
require("./src/routes/seatRoutes");

const addonAvailabilityRoutes =
require("./src/routes/addonAvailabilityRoutes");

const baggageRoutes = 
require("./src/routes/addonRoutes")

const flightStatusRoutes =
require("./src/routes/flightStatusRoutes");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

app.use(express.json());

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use(
    "/api/translations",
    translationRoutes
);


app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/profile",
    profileRoutes
);

app.use(
    "/api/flights",
    flightSearchRoutes
);

app.use(
    "/api/results",
    flightResultRoutes
);

app.use(
    "/api/duffel",
    duffelRoutes
);

app.use(
    "/api/selected-flights",
    selectedFlightRoutes
);

app.use(
    "/api/passengers",
    passengerRoutes
);

app.use(
    "/api/bookings",
    bookingRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/duffel/orders",
    duffelOrderRoutes
);

app.use(
    "/api/manage-booking",
    manageBookingRoutes
);

app.use(
    "/api/tickets",
    ticketRoutes
);
app.use("/api/boarding-passes", boardingPassRoutes);
app.use("/api/check-in", checkInRoutes);
app.use("/api/whatsapp", whatsappRoutes);

app.use(
    "/api/addons", 
    addonRoutes
);

app.use(
    "/api/meals", 
    mealRoutes
);

app.use(
    "/api/seats",
    seatRoutes
);

app.use(
    "/api/addons",
    addonAvailabilityRoutes
);

app.use(
    "/api/addons/baggage/select",
    addonRoutes
);

app.use(
    "/api/flight-status",
    flightStatusRoutes
);


/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {

    res.status(200).json({
        message:
        "Flight Booking Backend Running"
    });

});

app.get("/test", (req, res) => {

    res.status(200).json({
        message:
        "Server Working"
    });

});



/*
|--------------------------------------------------------------------------
| Database Connection + Server Start
|--------------------------------------------------------------------------
*/

const startServer = async () => {

    try {

        const result =
        await pool.query(
            "SELECT NOW()"
        );

        console.log(
            "Database Connected"
        );

        console.log(
            result.rows[0]
        );

        await ensureRuntimeSchema(pool);

        app.listen(
            process.env.PORT,
            () => {

                console.log(
                    `Server running on port ${process.env.PORT}`
                );

            }
        );

    }
    catch(error) {

        console.error(
            "Database Connection Failed"
        );

        console.error(error);

        process.exit(1);

    }

};

startServer();
