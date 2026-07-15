-- =====================================================
-- FLIGHT BOOKING SYSTEM
-- CORE DATABASE SCHEMA
-- PostgreSQL
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (

    email_address VARCHAR(50) PRIMARY KEY,

    password_hash VARCHAR(255) NOT NULL,

    first_name VARCHAR(60) NOT NULL,

    middle_name VARCHAR(60),

    last_name VARCHAR(60) NOT NULL,

    phone_number VARCHAR(30),

    country_code VARCHAR(10),

    nationality VARCHAR(100),

    preferred_language VARCHAR(20),

    preferred_currency CHAR(3),

    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    auth_provider VARCHAR(30) NOT NULL DEFAULT 'LOCAL',

    facebook_id VARCHAR(100),

    google_id VARCHAR(255) UNIQUE,

    line_id VARCHAR(255) UNIQUE,

    marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

);

-- =====================================================
-- FLIGHT SEARCHES
-- =====================================================

CREATE TABLE flight_searches (

    flight_search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_email_address VARCHAR(50),

    trip_type VARCHAR(20) NOT NULL,

    adult_passenger_count INTEGER NOT NULL,

    child_passenger_count INTEGER NOT NULL DEFAULT 0,

    infant_passenger_count INTEGER NOT NULL DEFAULT 0,

    cabin_class VARCHAR(20) NOT NULL,

    preferred_airline VARCHAR(100),

    direct_flight_only BOOLEAN DEFAULT FALSE,

    promo_fare_type VARCHAR(50),

    currency_code CHAR(3) NOT NULL,

    search_status VARCHAR(20) DEFAULT 'SUCCESS',

    flight_search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_flight_search_user
        FOREIGN KEY (user_email_address)
        REFERENCES users(email_address),

    CONSTRAINT chk_trip_type
        CHECK (
            trip_type IN (
                'ONE_WAY',
                'ROUND_TRIP',
                'MULTI_CITY'
            )
        ),
    
    CONSTRAINT chk_cabin_class
        CHECK (
            cabin_class IN (
                'ECONOMY',
                'PREMIUM_ECONOMY',
                'BUSINESS',
                'FIRST_CLASS'
            )
        )

    CONSTRAINT chk_passenger_count
        CHECK (
            adult_passenger_count >= 1
        )

);

-- =====================================================
-- FLIGHT SEARCH SEGMENTS
-- =====================================================

CREATE TABLE flight_search_segments (

    search_segment_id UUID PRIMARY KEY
    DEFAULT uuid_generate_v4(),

    flight_search_id UUID NOT NULL,

    segment_number INTEGER NOT NULL,

    origin_airport_code CHAR(3) NOT NULL,

    destination_airport_code CHAR(3) NOT NULL,

    departure_date DATE NOT NULL,

    segment_status VARCHAR(20)
    NOT NULL DEFAULT 'PENDING',

    segment_created_timestamp TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_flight_search_segment
        FOREIGN KEY (flight_search_id)
        REFERENCES flight_searches(flight_search_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_segment_status
        CHECK (
            segment_status IN (
                'PENDING',
                'SEARCHED',
                'FAILED'
            )
        ),

    CONSTRAINT chk_airport_codes
        CHECK (
            origin_airport_code <>
            destination_airport_code
        ),

    CONSTRAINT uq_segment_number
        UNIQUE (
            flight_search_id,
            segment_number
        )

);

-- =====================================================
-- FLIGHT RESULTS
-- =====================================================

CREATE TABLE flight_results (

    flight_result_id UUID PRIMARY KEY
    DEFAULT uuid_generate_v4(),

    flight_search_id UUID NOT NULL,

    flight_offer_id VARCHAR(255) NOT NULL,

    airline_name VARCHAR(100) NOT NULL,

    total_duration VARCHAR(20) NOT NULL,

    total_stop_count INTEGER NOT NULL,

    cabin_class VARCHAR(20) NOT NULL,

    baggage_allowance VARCHAR(20),

    refundable_status BOOLEAN DEFAULT FALSE,

    seat_availability INTEGER,

    total_fare_price DECIMAL(12,2) NOT NULL,

    currency_code CHAR(3) NOT NULL,

    direct_flight_flag BOOLEAN DEFAULT FALSE,

    fare_type VARCHAR(50),

    flight_result_status VARCHAR(20)
    DEFAULT 'AVAILABLE',

    result_generated_timestamp TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_result_search
    FOREIGN KEY (flight_search_id)
    REFERENCES flight_searches(flight_search_id)
    ON DELETE CASCADE,

    CONSTRAINT chk_flight_result_status
        CHECK (
            flight_result_status IN (
                'AVAILABLE',
                'SOLD_OUT',
                'EXPIRED',
                'CANCELLED'
            )
        ),
    
    CONSTRAINT chk_cabin_class
        CHECK (
            cabin_class IN (
                'ECONOMY',
                'PREMIUM_ECONOMY',
                'BUSINESS',
                'FIRST_CLASS'
            )
        )
);

-- =====================================================
-- RESULT SEGMENTS
-- =====================================================

CREATE TABLE result_segments (

    result_segment_id UUID PRIMARY KEY
    DEFAULT uuid_generate_v4(),

    flight_result_id UUID NOT NULL,

    segment_number INTEGER NOT NULL,

    departure_airport_code CHAR(3) NOT NULL,

    arrival_airport_code CHAR(3) NOT NULL,

    departure_datetime TIMESTAMP NOT NULL,

    arrival_datetime TIMESTAMP NOT NULL,

    marketing_carrier_code CHAR(2) NOT NULL,

    operating_carrier_code CHAR(2),

    flight_number VARCHAR(10) NOT NULL,

    aircraft_type VARCHAR(100),

    aircraft_code VARCHAR(10),

    segment_duration VARCHAR(20) NOT NULL,

    checked_baggage_allowance VARCHAR(20),

    carry_on_baggage_allowance VARCHAR(20),

    availability_count INTEGER,

    segment_status VARCHAR(20)
    DEFAULT 'AVAILABLE',

    result_segment_created_timestamp TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_result_segment_result
    FOREIGN KEY (flight_result_id)
    REFERENCES flight_results(flight_result_id)
    ON DELETE CASCADE,

    CONSTRAINT chk_segment_status
        CHECK (
            segment_status IN (
                'AVAILABLE',
                'SOLD_OUT',
                'UNAVAILABLE',
                'CANCELLED'
            )
        )
);

-- =====================================================
-- SELECTED FLIGHTS
-- =====================================================

CREATE TABLE selected_flights (

    selected_flight_id UUID PRIMARY KEY
    DEFAULT uuid_generate_v4(),

    flight_search_id UUID NOT NULL,

    flight_result_id UUID NOT NULL,

    selected_trip_type VARCHAR(20) NOT NULL,

    airline_name VARCHAR(100) NOT NULL,

    flight_number VARCHAR(20) NOT NULL,

    origin_airport_code CHAR(3) NOT NULL,

    destination_airport_code CHAR(3) NOT NULL,

    departure_datetime TIMESTAMP NOT NULL,

    arrival_datetime TIMESTAMP NOT NULL,

    cabin_class VARCHAR(20) NOT NULL,

    fare_brand_id VARCHAR(50),

    baggage_allowance VARCHAR(20),

    refundable_status BOOLEAN DEFAULT FALSE,

    selected_fare_price DECIMAL(10,2) NOT NULL,

    currency_code CHAR(3) NOT NULL,

    selection_status VARCHAR(20)
    DEFAULT 'SELECTED',

    selected_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    base_fare DECIMAL(10,2)
    DEFAULT 0,

    tax_total DECIMAL(10,2)
    DEFAULT 0,

    surcharge_total DECIMAL(10,2)
    DEFAULT 0,

    date_created TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    date_modified TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_selected_flight_search
        FOREIGN KEY (flight_search_id)
        REFERENCES flight_searches(flight_search_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_selected_flight_result 
        FOREIGN KEY (flight_result_id) 
        REFERENCES flight_results(flight_result_id)

    CONSTRAINT chk_selected_trip_type
        CHECK (
            selected_trip_type IN (
                'OUTBOUND',
                'RETURN',
                'MULTI_CITY'
            )
        ),

    CONSTRAINT chk_selection_status
        CHECK (
            selection_status IN (
                'SELECTED',
                'EXPIRED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_cabin_class
        CHECK (
            cabin_class IN (
                'ECONOMY',
                'PREMIUM_ECONOMY',
                'BUSINESS',
                'FIRST_CLASS'
            )
        )

    

);

-- =====================================================
-- PASSENGERS
-- =====================================================

CREATE TABLE passengers (

    passenger_id UUID PRIMARY KEY
    DEFAULT uuid_generate_v4(),

    pi_title VARCHAR(10) NOT NULL,

    pi_first_name VARCHAR(60) NOT NULL,

    pi_middle_name VARCHAR(60),

    pi_last_name VARCHAR(60) NOT NULL,

    pi_gender CHAR(1) NOT NULL,

    pi_date_of_birth DATE NOT NULL,

    pi_nationality VARCHAR(100) NOT NULL,

    pi_passenger_type_code CHAR(3) NOT NULL,

    pi_passport_number VARCHAR(15),

    pi_passport_issuing_country VARCHAR(100),

    pi_passport_expiry_date DATE,

    pi_contact_email VARCHAR(50) NOT NULL,

    pi_contact_phone VARCHAR(30) NOT NULL,

    pi_passenger_status VARCHAR(20)
    DEFAULT 'ACTIVE',

    date_created TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    date_modified TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_gender
        CHECK (
            pi_gender IN (
                'M',
                'F',
                'X'
            )
        ),

    CONSTRAINT chk_passenger_type
        CHECK (
            pi_passenger_type_code IN (
                'ADT',
                'CHD',
                'INF'
            )
        ),

    CONSTRAINT chk_passenger_status
        CHECK (
            pi_passenger_status IN (
                'ACTIVE',
                'CANCELLED',
                'REMOVED'
            )
        )
);

-- =====================================================
-- BOOKINGS
-- =====================================================

CREATE TABLE bookings (

    pnr_reference CHAR(6) PRIMARY KEY,

    user_email_address VARCHAR(50) NOT NULL,

    selected_flight_id UUID NOT NULL,

    booking_status VARCHAR(30)
    NOT NULL DEFAULT 'PENDING_PAYMENT',

    booking_date_timestamp TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    ticketing_status VARCHAR(20)
    NOT NULL DEFAULT 'UNTICKETED',

    total_payment_amount DECIMAL(10,2)
    NOT NULL,

    currency_code CHAR(3)
    NOT NULL,

    booking_created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    booking_updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    record_active BOOLEAN
    DEFAULT TRUE,

    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_email_address)
        REFERENCES users(email_address),

    CONSTRAINT fk_booking_selected_flight
        FOREIGN KEY (selected_flight_id)
        REFERENCES selected_flights(selected_flight_id),

    CONSTRAINT chk_booking_status
        CHECK (
            booking_status IN (
                'PENDING_PAYMENT',
                'PAID_UNTICKETED',
                'TICKETED',
                'CANCELLED',
                'REFUNDED'
            )
        ),

    CONSTRAINT chk_ticketing_status
        CHECK (
            ticketing_status IN (
                'UNTICKETED',
                'TICKETED',
                'FAILED'
            )
        ),

    CONSTRAINT chk_booking_amount
        CHECK (
            total_payment_amount > 0
        )

);

-- =====================================================
-- BOOKINGS PASSENGERS
-- =====================================================

CREATE TABLE booking_passengers (

    pnr_reference CHAR(6) NOT NULL,

    passenger_id UUID NOT NULL,

    PRIMARY KEY (
        pnr_reference,
        passenger_id
    ),

    CONSTRAINT fk_bp_booking
        FOREIGN KEY (pnr_reference)
        REFERENCES bookings(pnr_reference)
        ON DELETE CASCADE,

    CONSTRAINT fk_bp_passenger
        FOREIGN KEY (passenger_id)
        REFERENCES passengers(passenger_id)
        ON DELETE CASCADE

);

-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE payments (

    payment_id UUID PRIMARY KEY
    DEFAULT uuid_generate_v4(),

    pnr_reference CHAR(6) NOT NULL,

    user_email_address VARCHAR(50) NOT NULL,

    payment_method VARCHAR(50) NOT NULL,

    payment_region VARCHAR(50) NOT NULL,

    currency_code CHAR(3) NOT NULL,

    total_payment_amount DECIMAL(10,2) NOT NULL,

    payment_token VARCHAR(255),

    three_ds_status VARCHAR(20),

    gateway_transaction_reference VARCHAR(100) UNIQUE,

    payment_status_code VARCHAR(20)
    NOT NULL DEFAULT 'PENDING',

    payment_timestamp TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (pnr_reference)
        REFERENCES bookings(pnr_reference)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_user
        FOREIGN KEY (user_email_address)
        REFERENCES users(email_address),

    CONSTRAINT chk_payment_status
        CHECK (
            payment_status_code IN (
                'PENDING',
                'PAID',
                'FAILED',
                'REFUNDED',
                'VOIDED'
            )
        ),

    CONSTRAINT chk_3ds_status
        CHECK (
            three_ds_status IS NULL
            OR
            three_ds_status IN (
                'AUTHENTICATED',
                'ATTEMPTED',
                'FAILED'
            )
        ),

    CONSTRAINT chk_payment_amount
        CHECK (
            total_payment_amount > 0
        )

);

-- =====================================================
-- INDEXES
-- =====================================================

-- Flight Searches
CREATE INDEX idx_flight_search_user
ON flight_searches(user_email_address);

CREATE INDEX idx_flight_search_timestamp
ON flight_searches(flight_search_timestamp);

-- Flight Search Segments
CREATE INDEX idx_segment_search
ON flight_search_segments(flight_search_id);

CREATE INDEX idx_segment_origin
ON flight_search_segments(origin_airport_code);

CREATE INDEX idx_segment_destination
ON flight_search_segments(destination_airport_code);

CREATE INDEX idx_segment_departure_date
ON flight_search_segments(departure_date);

-- Selected Flights
CREATE INDEX idx_selected_flight_search
ON selected_flights(flight_search_id);

CREATE INDEX idx_selected_flight_result
ON selected_flights(flight_result_id);

CREATE INDEX idx_selected_airline
ON selected_flights(airline_name);

CREATE INDEX idx_selected_departure
ON selected_flights(departure_datetime);

-- Passengers
CREATE INDEX idx_passenger_email
ON passengers(pi_contact_email);

CREATE INDEX idx_passenger_passport
ON passengers(pi_passport_number);

CREATE INDEX idx_passenger_last_name
ON passengers(pi_last_name);

-- Bookings
CREATE INDEX idx_booking_user
ON bookings(user_email_address);

CREATE INDEX idx_booking_selected_flight
ON bookings(selected_flight_id);

CREATE INDEX idx_booking_status
ON bookings(booking_status);

CREATE INDEX idx_booking_date
ON bookings(booking_date_timestamp);

-- Booking Passengers
CREATE INDEX idx_booking_passengers_booking
ON booking_passengers(pnr_reference);

CREATE INDEX idx_booking_passengers_passenger
ON booking_passengers(passenger_id);

-- Payments
CREATE INDEX idx_payment_booking
ON payments(pnr_reference);

CREATE INDEX idx_payment_user
ON payments(user_email_address);

CREATE INDEX idx_payment_status
ON payments(payment_status_code);

CREATE INDEX idx_payment_timestamp
ON payments(payment_timestamp);
