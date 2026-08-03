-- ============================================================
-- Assignment 4 - travel_deals schema
--
-- Table and column names use underscores because the names in the
-- assignment ("flight-booking", "hotel-booking", "contact-id") contain
-- hyphens, which MySQL reads as minus signs unless every reference is
-- backticked. The fields themselves match the assignment exactly:
--
--   users           7 fields    flights         9 fields
--   passenger       5 fields    flight_booking  3 fields
--   tickets         4 fields    hotels          4 fields
--   hotel_booking   7 fields    guesses         6 fields
--
-- Run with:  mysql -u root < hw4/sql/schema.sql
-- ============================================================

DROP DATABASE IF EXISTS travel_deals;
CREATE DATABASE travel_deals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travel_deals;


-- ------------------------------------------------------------
-- users (section 1)
-- Phone number is the unique identifier, so it is the primary key.
-- Gender is the only optional field.
-- ------------------------------------------------------------
CREATE TABLE users (
    phone           VARCHAR(12)  NOT NULL,
    password        VARCHAR(255) NOT NULL,
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    date_of_birth   DATE         NOT NULL,
    gender          VARCHAR(10)      NULL,
    email           VARCHAR(120) NOT NULL,
    PRIMARY KEY (phone)
) ENGINE = InnoDB;


-- ------------------------------------------------------------
-- flights (section 6) - filled by the admin loader from flights.json
-- ------------------------------------------------------------
CREATE TABLE flights (
    flight_id       VARCHAR(10)  NOT NULL,
    origin          VARCHAR(60)  NOT NULL,
    destination     VARCHAR(60)  NOT NULL,
    departure_date  DATE         NOT NULL,
    arrival_date    DATE         NOT NULL,
    departure_time  TIME         NOT NULL,
    arrival_time    TIME         NOT NULL,
    available_seats INT          NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (flight_id),
    INDEX idx_route (origin, destination, departure_date)
) ENGINE = InnoDB;


-- ------------------------------------------------------------
-- hotels (section 8) - filled by the admin loader from hotels.xml
-- ------------------------------------------------------------
CREATE TABLE hotels (
    hotel_id        VARCHAR(10)  NOT NULL,
    hotel_name      VARCHAR(120) NOT NULL,
    city            VARCHAR(60)  NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (hotel_id),
    INDEX idx_city (city)
) ENGINE = InnoDB;


-- ------------------------------------------------------------
-- passenger (section 7)
-- SSN is unique per the assignment, so a repeat traveller updates the
-- existing row rather than inserting a second one.
-- ------------------------------------------------------------
CREATE TABLE passenger (
    ssn             VARCHAR(11)  NOT NULL,
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    date_of_birth   DATE         NOT NULL,
    category        ENUM('adult','child','infant') NOT NULL,
    PRIMARY KEY (ssn)
) ENGINE = InnoDB;


-- ------------------------------------------------------------
-- flight_booking (section 7)
-- One row per leg: a round trip produces two rows, because the table
-- holds a single flight_id.
-- ------------------------------------------------------------
CREATE TABLE flight_booking (
    flight_booking_id INT          NOT NULL AUTO_INCREMENT,
    flight_id         VARCHAR(10)  NOT NULL,
    total_price       DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (flight_booking_id),
    FOREIGN KEY (flight_id) REFERENCES flights (flight_id)
) ENGINE = InnoDB AUTO_INCREMENT = 1001;


-- ------------------------------------------------------------
-- tickets (section 7) - one per passenger per leg
-- ------------------------------------------------------------
CREATE TABLE tickets (
    ticket_id         INT          NOT NULL AUTO_INCREMENT,
    flight_booking_id INT          NOT NULL,
    ssn               VARCHAR(11)  NOT NULL,
    price             DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (ticket_id),
    FOREIGN KEY (flight_booking_id) REFERENCES flight_booking (flight_booking_id)
        ON DELETE CASCADE,
    FOREIGN KEY (ssn) REFERENCES passenger (ssn)
) ENGINE = InnoDB AUTO_INCREMENT = 5001;


-- ------------------------------------------------------------
-- hotel_booking (section 8)
-- ------------------------------------------------------------
CREATE TABLE hotel_booking (
    hotel_booking_id INT          NOT NULL AUTO_INCREMENT,
    hotel_id         VARCHAR(10)  NOT NULL,
    check_in_date    DATE         NOT NULL,
    check_out_date   DATE         NOT NULL,
    number_of_rooms  INT          NOT NULL,
    price_per_night  DECIMAL(10,2) NOT NULL,
    total_price      DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (hotel_booking_id),
    FOREIGN KEY (hotel_id) REFERENCES hotels (hotel_id)
) ENGINE = InnoDB AUTO_INCREMENT = 2001;


-- ------------------------------------------------------------
-- guesses (section 8) - the assignment's spelling of "guests"
-- SSN is unique here too, so the same person appearing in a second
-- hotel booking moves to that booking instead of duplicating.
-- ------------------------------------------------------------
CREATE TABLE guesses (
    ssn              VARCHAR(11)  NOT NULL,
    hotel_booking_id INT          NOT NULL,
    first_name       VARCHAR(50)  NOT NULL,
    last_name        VARCHAR(50)  NOT NULL,
    date_of_birth    DATE         NOT NULL,
    category         ENUM('adult','child','infant') NOT NULL,
    PRIMARY KEY (ssn),
    FOREIGN KEY (hotel_booking_id) REFERENCES hotel_booking (hotel_booking_id)
        ON DELETE CASCADE
) ENGINE = InnoDB;


-- ------------------------------------------------------------
-- The admin account, seeded so it exists before anyone registers.
-- Phone 222-222-2222, password admin123 (bcrypt via password_hash).
-- ------------------------------------------------------------
INSERT INTO users (phone, password, first_name, last_name, date_of_birth, gender, email)
VALUES (
    '222-222-2222',
    '$2y$12$1L7L.uAnQoJUa.vqkmzP2OB6VS7zyq7QHVet3OyI564a1d9PsekcO',
    'Site',
    'Admin',
    '1990-01-01',
    'other',
    'admin@traveldeals.com'
);
