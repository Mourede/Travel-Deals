<?php
/**
 * The my-account reports (assignment section 9).
 *
 * One endpoint for all twelve lookups, dispatched on a "query" parameter.
 * Four are open to any logged-in user; the other eight are admin only, and
 * the admin ones are checked against isAdmin() here rather than relying on
 * my-account.php simply not drawing the buttons.
 *
 * Every query answers in the same shape:
 *
 *   tables:  [{ title, columns: [{key, label}], rows: [assoc, ...] }]
 *   summary: optional { label, value } for the count report
 *   note:    optional explanation shown above the results
 *
 * account.js renders that without needing to know which query produced it.
 *
 * Written for MySQL 5.7, so plain subqueries rather than CTEs or window
 * functions. That also keeps it working on the MariaDB that ships with XAMPP.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/cities.php';
require_once __DIR__ . '/../config/travel.php';

$user = requireLoginJson();

const ADMIN_QUERIES = [
    'tx_departures',
    'tx_hotels',
    'expensive_hotels',
    'flights_with_infant',
    'infant_and_children',
    'expensive_flights',
    'tx_no_infant',
    'ca_arrivals_count',
];

$query = $_POST['query'] ?? '';

if (in_array($query, ADMIN_QUERIES, true) && !isAdmin()) {
    json_error('That report is admin only.', 403);
}

// Sep to Oct 2024, the window six of the reports are scoped to.
const SEP_START = '2024-09-01';
const SEP_END   = '2024-09-30';
const OCT_END   = '2024-10-31';


// ------------------------------------------------------------
// Column sets, so the same booking always displays the same way
// ------------------------------------------------------------

function flightBookingColumns(): array
{
    return [
        ['key' => 'flight_booking_id', 'label' => 'Flight booking id'],
        ['key' => 'flight_id',         'label' => 'Flight id'],
        ['key' => 'origin',            'label' => 'Origin'],
        ['key' => 'destination',       'label' => 'Destination'],
        ['key' => 'departure_date',    'label' => 'Departure date'],
        ['key' => 'arrival_date',      'label' => 'Arrival date'],
        ['key' => 'departure_time',    'label' => 'Departure time'],
        ['key' => 'arrival_time',      'label' => 'Arrival time'],
        ['key' => 'total_price',       'label' => 'Total price', 'money' => true],
    ];
}

function hotelBookingColumns(): array
{
    return [
        ['key' => 'hotel_booking_id', 'label' => 'Hotel booking id'],
        ['key' => 'hotel_id',         'label' => 'Hotel id'],
        ['key' => 'hotel_name',       'label' => 'Hotel name'],
        ['key' => 'city',             'label' => 'City'],
        ['key' => 'check_in_date',    'label' => 'Check in date'],
        ['key' => 'check_out_date',   'label' => 'Check out date'],
        ['key' => 'number_of_rooms',  'label' => 'Rooms'],
        ['key' => 'price_per_night',  'label' => 'Price per night', 'money' => true],
        ['key' => 'total_price',      'label' => 'Total price', 'money' => true],
    ];
}

function passengerColumns(): array
{
    return [
        ['key' => 'ticket_id',         'label' => 'Ticket id'],
        ['key' => 'flight_booking_id', 'label' => 'Flight booking id'],
        ['key' => 'ssn',               'label' => 'SSN'],
        ['key' => 'first_name',        'label' => 'First name'],
        ['key' => 'last_name',         'label' => 'Last name'],
        ['key' => 'date_of_birth',     'label' => 'Date of birth'],
        ['key' => 'category',          'label' => 'Category'],
        ['key' => 'price',             'label' => 'Ticket price', 'money' => true],
    ];
}

function guestColumns(): array
{
    return [
        ['key' => 'ssn',              'label' => 'SSN'],
        ['key' => 'hotel_booking_id', 'label' => 'Hotel booking id'],
        ['key' => 'first_name',       'label' => 'First name'],
        ['key' => 'last_name',        'label' => 'Last name'],
        ['key' => 'date_of_birth',    'label' => 'Date of birth'],
        ['key' => 'category',         'label' => 'Category'],
    ];
}


// ------------------------------------------------------------
// Reusable SQL fragments
// ------------------------------------------------------------

const FLIGHT_BOOKING_SELECT = '
    SELECT fb.flight_booking_id, fb.flight_id, f.origin, f.destination,
           f.departure_date, f.arrival_date, f.departure_time, f.arrival_time,
           fb.total_price
      FROM flight_booking fb
      JOIN flights f ON f.flight_id = fb.flight_id';

const HOTEL_BOOKING_SELECT = '
    SELECT hb.hotel_booking_id, hb.hotel_id, h.hotel_name, h.city,
           hb.check_in_date, hb.check_out_date, hb.number_of_rooms,
           hb.price_per_night, hb.total_price
      FROM hotel_booking hb
      JOIN hotels h ON h.hotel_id = hb.hotel_id';

/**
 * True when the booking has at least one passenger in the given category.
 * Correlated on fb.flight_booking_id, so it drops straight into a WHERE.
 */
const HAS_CATEGORY = '
    EXISTS (SELECT 1
              FROM tickets t
              JOIN passenger p ON p.ssn = t.ssn
             WHERE t.flight_booking_id = fb.flight_booking_id
               AND p.category = ?)';

const COUNT_CATEGORY = '
    (SELECT COUNT(*)
       FROM tickets t
       JOIN passenger p ON p.ssn = t.ssn
      WHERE t.flight_booking_id = fb.flight_booking_id
        AND p.category = ?)';


function fetchAll(PDO $pdo, string $sql, array $params = []): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll();
}

function table(string $title, array $columns, array $rows, string $empty = 'No matching records.'): array
{
    return [
        'title'   => $title,
        'columns' => $columns,
        'rows'    => $rows,
        'empty'   => $empty,
    ];
}


$pdo = db();

switch ($query) {

    // --------------------------------------------------------
    // User lookups
    // --------------------------------------------------------

    /**
     * Everything about a booked flight and a booked hotel, by their ids.
     * Either id on its own is fine, so one booking can be looked at without
     * having to know the other's id.
     */
    case 'booking_lookup': {
        $flightBookingId = trim($_POST['flightBookingId'] ?? '');
        $hotelBookingId  = trim($_POST['hotelBookingId'] ?? '');

        if ($flightBookingId === '' && $hotelBookingId === '') {
            json_error('Enter a flight booking id, a hotel booking id, or both.');
        }

        $tables = [];

        if ($flightBookingId !== '') {
            if (!ctype_digit($flightBookingId)) {
                json_error('A flight booking id is a number.');
            }

            $rows = fetchAll(
                $pdo,
                FLIGHT_BOOKING_SELECT . ' WHERE fb.flight_booking_id = ?',
                [$flightBookingId]
            );

            $tables[] = table(
                'Booked flight ' . $flightBookingId,
                flightBookingColumns(),
                $rows,
                'No flight booking with id ' . $flightBookingId . '.'
            );

            // The tickets, so "all the information" really is all of it.
            $tickets = fetchAll(
                $pdo,
                'SELECT t.ticket_id, t.flight_booking_id, t.ssn, p.first_name,
                        p.last_name, p.date_of_birth, p.category, t.price
                   FROM tickets t
                   JOIN passenger p ON p.ssn = t.ssn
                  WHERE t.flight_booking_id = ?
               ORDER BY t.ticket_id',
                [$flightBookingId]
            );

            $tables[] = table(
                'Tickets on flight booking ' . $flightBookingId,
                passengerColumns(),
                $tickets,
                'No tickets on that booking.'
            );
        }

        if ($hotelBookingId !== '') {
            if (!ctype_digit($hotelBookingId)) {
                json_error('A hotel booking id is a number.');
            }

            $rows = fetchAll(
                $pdo,
                HOTEL_BOOKING_SELECT . ' WHERE hb.hotel_booking_id = ?',
                [$hotelBookingId]
            );

            $tables[] = table(
                'Booked hotel ' . $hotelBookingId,
                hotelBookingColumns(),
                $rows,
                'No hotel booking with id ' . $hotelBookingId . '.'
            );

            $guests = fetchAll(
                $pdo,
                'SELECT ssn, hotel_booking_id, first_name, last_name,
                        date_of_birth, category
                   FROM guesses
                  WHERE hotel_booking_id = ?
               ORDER BY category, last_name',
                [$hotelBookingId]
            );

            $tables[] = table(
                'Guests on hotel booking ' . $hotelBookingId,
                guestColumns(),
                $guests,
                'No guests on that booking.'
            );
        }

        json_ok(['tables' => $tables]);
    }

    /**
     * Every passenger on one flight booking.
     */
    case 'booking_passengers': {
        $flightBookingId = trim($_POST['flightBookingId'] ?? '');

        if (!ctype_digit($flightBookingId)) {
            json_error('Enter a flight booking id.');
        }

        $rows = fetchAll(
            $pdo,
            'SELECT t.ticket_id, t.flight_booking_id, t.ssn, p.first_name,
                    p.last_name, p.date_of_birth, p.category, t.price
               FROM tickets t
               JOIN passenger p ON p.ssn = t.ssn
              WHERE t.flight_booking_id = ?
           ORDER BY t.ticket_id',
            [$flightBookingId]
        );

        json_ok([
            'tables' => [
                table(
                    'Passengers on flight booking ' . $flightBookingId,
                    passengerColumns(),
                    $rows,
                    'No passengers found for booking ' . $flightBookingId . '.'
                ),
            ],
        ]);
    }

    /**
     * Everything booked for September 2024: flights by departure date,
     * hotels by check in date.
     */
    case 'september_2024': {
        $flights = fetchAll(
            $pdo,
            FLIGHT_BOOKING_SELECT . ' WHERE f.departure_date BETWEEN ? AND ?
                                   ORDER BY f.departure_date, f.departure_time',
            [SEP_START, SEP_END]
        );

        $hotels = fetchAll(
            $pdo,
            HOTEL_BOOKING_SELECT . ' WHERE hb.check_in_date BETWEEN ? AND ?
                                  ORDER BY hb.check_in_date',
            [SEP_START, SEP_END]
        );

        json_ok([
            'note'   => 'Flights are matched on departure date and hotels on '
                . 'check in date, both within ' . SEP_START . ' to ' . SEP_END . '.',
            'tables' => [
                table('Booked flights in September 2024', flightBookingColumns(), $flights,
                    'No flights booked for September 2024.'),
                table('Booked hotels in September 2024', hotelBookingColumns(), $hotels,
                    'No hotels booked for September 2024.'),
            ],
        ]);
    }

    /**
     * Every flight a given person is booked on, by SSN.
     */
    case 'flights_by_ssn': {
        $ssn = trim($_POST['ssn'] ?? '');

        if (!preg_match('/^\d{3}-\d{2}-\d{4}$/', $ssn)) {
            json_error('Enter an SSN formatted ddd-dd-dddd.');
        }

        $rows = fetchAll(
            $pdo,
            'SELECT fb.flight_booking_id, fb.flight_id, f.origin, f.destination,
                    f.departure_date, f.arrival_date, f.departure_time,
                    f.arrival_time, fb.total_price, t.ticket_id, t.price AS ticket_price,
                    p.first_name, p.last_name, p.category
               FROM tickets t
               JOIN flight_booking fb ON fb.flight_booking_id = t.flight_booking_id
               JOIN flights f ON f.flight_id = fb.flight_id
               JOIN passenger p ON p.ssn = t.ssn
              WHERE t.ssn = ?
           ORDER BY f.departure_date, f.departure_time',
            [$ssn]
        );

        $columns = array_merge(flightBookingColumns(), [
            ['key' => 'ticket_id',    'label' => 'Ticket id'],
            ['key' => 'ticket_price', 'label' => 'Ticket price', 'money' => true],
            ['key' => 'first_name',   'label' => 'First name'],
            ['key' => 'last_name',    'label' => 'Last name'],
            ['key' => 'category',     'label' => 'Category'],
        ]);

        json_ok([
            'tables' => [
                table('Flights booked for ' . $ssn, $columns, $rows,
                    'Nobody with SSN ' . $ssn . ' is booked on a flight.'),
            ],
        ]);
    }


    // --------------------------------------------------------
    // Admin reports
    // --------------------------------------------------------

    /**
     * Booked flights leaving a Texas city, September to October 2024.
     */
    case 'tx_departures': {
        $params = array_merge(TEXAS_CITIES, [SEP_START, OCT_END]);

        $rows = fetchAll(
            $pdo,
            FLIGHT_BOOKING_SELECT
            . ' WHERE f.origin IN (' . city_placeholders(TEXAS_CITIES) . ')
                  AND f.departure_date BETWEEN ? AND ?
             ORDER BY f.departure_date, f.departure_time',
            $params
        );

        json_ok([
            'note'   => 'Departures from any of the Texas cities between '
                . SEP_START . ' and ' . OCT_END . '.',
            'tables' => [
                table('Booked flights departing Texas, Sep to Oct 2024',
                    flightBookingColumns(), $rows,
                    'No Texas departures booked in that window.'),
            ],
        ]);
    }

    /**
     * Booked hotels in a Texas city, September to October 2024.
     */
    case 'tx_hotels': {
        $params = array_merge(TEXAS_CITIES, [SEP_START, OCT_END]);

        $rows = fetchAll(
            $pdo,
            HOTEL_BOOKING_SELECT
            . ' WHERE h.city IN (' . city_placeholders(TEXAS_CITIES) . ')
                  AND hb.check_in_date BETWEEN ? AND ?
             ORDER BY hb.check_in_date',
            $params
        );

        json_ok([
            'note'   => 'Hotels in any of the Texas cities with a check in date '
                . 'between ' . SEP_START . ' and ' . OCT_END . '.',
            'tables' => [
                table('Booked hotels in Texas, Sep to Oct 2024',
                    hotelBookingColumns(), $rows,
                    'No Texas hotels booked in that window.'),
            ],
        ]);
    }

    /**
     * The most expensive booked hotels. Compared against the maximum rather
     * than just taking the top row, so a tie shows every one of them.
     */
    case 'expensive_hotels': {
        $rows = fetchAll(
            $pdo,
            HOTEL_BOOKING_SELECT
            . ' WHERE hb.total_price = (SELECT MAX(total_price) FROM hotel_booking)
             ORDER BY hb.hotel_booking_id'
        );

        json_ok([
            'note'   => 'Every hotel booking whose total price equals the highest '
                . 'total price on record, so ties all appear.',
            'tables' => [
                table('Most expensive booked hotels', hotelBookingColumns(), $rows,
                    'No hotels have been booked yet.'),
            ],
        ]);
    }

    /**
     * Booked flights carrying at least one infant.
     */
    case 'flights_with_infant': {
        $rows = fetchAll(
            $pdo,
            FLIGHT_BOOKING_SELECT . ' WHERE ' . HAS_CATEGORY
            . ' ORDER BY f.departure_date',
            ['infant']
        );

        json_ok([
            'tables' => [
                table('Booked flights with an infant passenger',
                    flightBookingColumns(), $rows,
                    'No booked flight has an infant passenger.'),
            ],
        ]);
    }

    /**
     * Booked flights carrying an infant and at least 5 children.
     *
     * This one cannot match anything while the flights page caps children at
     * 4 per booking, which is the limit section 7 sets. The query is written
     * correctly regardless, and the note explains the empty result.
     */
    case 'infant_and_children': {
        $rows = fetchAll(
            $pdo,
            FLIGHT_BOOKING_SELECT
            . ' WHERE ' . HAS_CATEGORY . ' AND ' . COUNT_CATEGORY . ' >= 5
             ORDER BY f.departure_date',
            ['infant', 'child']
        );

        json_ok([
            'note'   => 'Section 7 caps children at 4 per booking, so no single '
                . 'booking can hold 5 or more. This report is expected to come '
                . 'back empty; the query is the one that would find them.',
            'tables' => [
                table('Booked flights with an infant and at least 5 children',
                    flightBookingColumns(), $rows,
                    'No booked flight has an infant and 5 or more children, '
                    . 'which is what the 4-per-category limit means.'),
            ],
        ]);
    }

    /**
     * The most expensive booked flights, ties included.
     */
    case 'expensive_flights': {
        $rows = fetchAll(
            $pdo,
            FLIGHT_BOOKING_SELECT
            . ' WHERE fb.total_price = (SELECT MAX(total_price) FROM flight_booking)
             ORDER BY fb.flight_booking_id'
        );

        json_ok([
            'note'   => 'Every flight booking whose total price equals the highest '
                . 'on record, so ties all appear.',
            'tables' => [
                table('Most expensive booked flights', flightBookingColumns(), $rows,
                    'No flights have been booked yet.'),
            ],
        ]);
    }

    /**
     * Booked flights leaving Texas with no infant on board.
     */
    case 'tx_no_infant': {
        $params = array_merge(TEXAS_CITIES, ['infant']);

        $rows = fetchAll(
            $pdo,
            FLIGHT_BOOKING_SELECT
            . ' WHERE f.origin IN (' . city_placeholders(TEXAS_CITIES) . ')
                  AND NOT ' . HAS_CATEGORY . '
             ORDER BY f.departure_date',
            $params
        );

        json_ok([
            'tables' => [
                table('Booked flights departing Texas with no infant passenger',
                    flightBookingColumns(), $rows,
                    'Every booked Texas departure has an infant on it.'),
            ],
        ]);
    }

    /**
     * How many booked flights arrive in California in September or October
     * 2024. A count, so it answers with a summary rather than a table, and
     * lists the matching bookings underneath as the evidence for the number.
     */
    case 'ca_arrivals_count': {
        $params = array_merge(CALIFORNIA_CITIES, [SEP_START, OCT_END]);

        $where = ' WHERE f.destination IN (' . city_placeholders(CALIFORNIA_CITIES) . ')
                     AND f.arrival_date BETWEEN ? AND ?';

        $stmt = $pdo->prepare(
            'SELECT COUNT(*)
               FROM flight_booking fb
               JOIN flights f ON f.flight_id = fb.flight_id' . $where
        );
        $stmt->execute($params);
        $count = (int) $stmt->fetchColumn();

        $rows = fetchAll(
            $pdo,
            FLIGHT_BOOKING_SELECT . $where . ' ORDER BY f.arrival_date',
            $params
        );

        json_ok([
            'summary' => [
                'label' => 'Booked flights arriving in California in Sep or Oct 2024',
                'value' => $count,
            ],
            'note'    => 'Matched on arrival date between ' . SEP_START
                . ' and ' . OCT_END . '. The bookings behind the number are listed below.',
            'tables'  => [
                table('The bookings counted above', flightBookingColumns(), $rows,
                    'No booked flights arrive in California in that window.'),
            ],
        ]);
    }

    default:
        json_error('Unknown report requested.');
}
