# Horizon Elite Flight Booking Platform

Horizon Elite is a full-stack flight booking application developed to demonstrate a complete digital travel experience—from searching for a flight to receiving an e-ticket and boarding pass.

> **Project status:** This is currently a local development project. It has not been deployed to a production server, and some external services use test or sandbox credentials.

## Project purpose

The project is developed to provide customers with one connected platform for managing the main stages of air travel:

- Account registration, email verification, and login
- Flight search and offer selection
- Passenger and booking management
- Payment and ticket creation
- Seat, meal, baggage, and add-on selection
- E-ticket download and email delivery
- Online check-in
- Boarding-pass download and email delivery
- Check-in reminder emails four days before departure
- Profile and saved travel information

Important travel rules are enforced by the backend. For example, a booking must be ticketed before an e-ticket is available, and customers must complete check-in before receiving a boarding pass.

## Main technologies

| Area | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js and Express |
| Database | PostgreSQL hosted with Supabase |
| Authentication | JWT, bcrypt, Google, Facebook, and LINE |
| Flight services | Duffel API |
| Payments | Omise |
| Email | Nodemailer and SMTP |
| PDF documents | PDFKit |

## Backend development

The Node.js and Express backend is responsible for the core application logic and data integrity. It:

- Provides APIs for the frontend
- Validates customer requests
- Stores data in PostgreSQL through Supabase
- Manages users, flights, passengers, bookings, and payments
- Integrates with flight, payment, email, and authentication providers
- Enforces payment, ticketing, and check-in rules
- Generates modern e-ticket and boarding-pass PDFs
- Processes scheduled email reminders with retry protection

PostgreSQL stores the relationships between users, selected flights, passengers, bookings, payments, check-ins, add-ons, and email jobs. Parameterized SQL queries and database transactions are used to protect data consistency.

## Main booking workflow

1. Search and select a flight.
2. Add passenger details.
3. Create a booking and PNR.
4. Complete payment.
5. Validate the flight offer and create the ticket order.
6. Download or receive the e-ticket.
7. Check in between 48 hours and 90 minutes before departure.
8. Download or email the boarding pass.

Customers can also enable a check-in reminder email scheduled for four days before departure. WhatsApp reminder support is planned for later development.

## Current limitations

Because Horizon Elite is not currently deployed:

- The frontend, backend, and background email worker run locally.
- Reminder emails are processed only while the backend is running.
- Test credentials may be used for flight and payment providers.
- Production monitoring, deployment automation, and scaling are not configured.
- Payment simulation is intended only for development testing.

Before production deployment, the project would require HTTPS, secure production secrets, stronger authorization review, rate limiting, database migrations, monitoring, backups, continuous worker hosting, and approved production provider accounts.

## Security

Database credentials, SMTP passwords, JWT secrets, OAuth secrets, payment keys, and API keys must remain in environment variables and must never be committed to source control.
