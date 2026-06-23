const express = require("express");
const cors = require("cors");
const pool = require("./src/config/db");

require("dotenv").config();

console.log("APP.JS LOADED");
console.log("Flight Result Routes Registered");

const authRoutes =
require("./src/routes/authRoutes");

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
    "/api/auth",
    authRoutes
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