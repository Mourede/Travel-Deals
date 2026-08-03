<?php
/**
 * Flight search (assignment section 7).
 *
 * Validates the form, echoes back everything the user entered, then reads
 * matching flights out of the flights table. A round trip searches twice,
 * once each way.
 *
 * Every rule is enforced here rather than in the browser, because the
 * client-side checks in flights.js can be bypassed.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/cities.php';
require_once __DIR__ . '/../config/travel.php';

// Section 7 gates the flights page behind login.
requireLoginJson();

$errors = [];

$tripType = $_POST['tripType'] ?? 'oneway';

if (!in_array($tripType, ['oneway', 'round'], true)) {
    $errors[] = 'Choose either a one way trip or a round trip.';
    $tripType = 'oneway';
}

$originInput      = trim($_POST['origin'] ?? '');
$destinationInput = trim($_POST['destination'] ?? '');

$origin      = canonical_city($originInput);
$destination = canonical_city($destinationInput);

if ($originInput === '') {
    $errors[] = 'Enter an origin city.';
} elseif ($origin === null) {
    $errors[] = '"' . $originInput . '" is not one of the Texas or California cities we fly from.';
}

if ($destinationInput === '') {
    $errors[] = 'Enter a destination city.';
} elseif ($destination === null) {
    $errors[] = '"' . $destinationInput . '" is not one of the Texas or California cities we fly to.';
}

if ($origin !== null && $origin === $destination) {
    $errors[] = 'Origin and destination have to be different cities.';
}

$departureDate = trim($_POST['departureDate'] ?? '');

if ($departureDate === '') {
    $errors[] = 'Enter a departure date.';
} elseif (!is_valid_date($departureDate)) {
    $errors[] = 'Enter the departure date as yyyy-mm-dd.';
} elseif (!date_in_range($departureDate)) {
    $errors[] = 'Departure date must be between ' . DATE_MIN . ' and ' . DATE_MAX . '.';
}

$returnDate = trim($_POST['returnDate'] ?? '');

if ($tripType === 'round') {
    if ($returnDate === '') {
        $errors[] = 'Enter a return date for a round trip.';
    } elseif (!is_valid_date($returnDate)) {
        $errors[] = 'Enter the return date as yyyy-mm-dd.';
    } elseif (!date_in_range($returnDate)) {
        $errors[] = 'Return date must be between ' . DATE_MIN . ' and ' . DATE_MAX . '.';
    } elseif ($departureDate !== '' && $returnDate < $departureDate) {
        $errors[] = 'The return date cannot be before the departure date.';
    }
}

$counts = read_passenger_counts($_POST, $errors);

if ($errors) {
    json_error(implode(' ', $errors));
}

$passengers = total_passengers($counts);

/**
 * Flights on an exact date, or failing that within 3 days either side —
 * the fallback section 7 asks for. Only flights with room for the whole
 * group are returned.
 */
function find_flights(PDO $pdo, string $from, string $to, string $date, int $seats): array
{
    $sql = 'SELECT flight_id, origin, destination, departure_date, arrival_date,
                   departure_time, arrival_time, available_seats, price
              FROM flights
             WHERE origin = :origin
               AND destination = :destination
               AND departure_date = :date
               AND available_seats >= :seats
          ORDER BY departure_time';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'origin'      => $from,
        'destination' => $to,
        'date'        => $date,
        'seats'       => $seats,
    ]);

    $exact = $stmt->fetchAll();

    if ($exact) {
        return ['flights' => $exact, 'widened' => false, 'from' => $date, 'to' => $date];
    }

    $window = new DateTimeImmutable($date);
    $start  = $window->modify('-3 days')->format('Y-m-d');
    $end    = $window->modify('+3 days')->format('Y-m-d');

    $sql = 'SELECT flight_id, origin, destination, departure_date, arrival_date,
                   departure_time, arrival_time, available_seats, price
              FROM flights
             WHERE origin = :origin
               AND destination = :destination
               AND departure_date BETWEEN :start AND :end
               AND available_seats >= :seats
          ORDER BY departure_date, departure_time';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'origin'      => $from,
        'destination' => $to,
        'start'       => $start,
        'end'         => $end,
        'seats'       => $seats,
    ]);

    return [
        'flights' => $stmt->fetchAll(),
        'widened' => true,
        'from'    => $start,
        'to'      => $end,
    ];
}

$pdo = db();

if ((int) $pdo->query('SELECT COUNT(*) FROM flights')->fetchColumn() === 0) {
    json_error(
        'There are no flights in the database yet. An admin needs to load '
        . 'flights.json from the my-account page first.'
    );
}

$outbound = find_flights($pdo, $origin, $destination, $departureDate, $passengers);

$inbound = null;

if ($tripType === 'round') {
    // The return leg flies the reverse route.
    $inbound = find_flights($pdo, $destination, $origin, $returnDate, $passengers);
}

// Held so cart_add.php can trust the passenger counts and the route rather
// than taking them from whatever the browser posts next.
$criteria = [
    'tripType'      => $tripType,
    'origin'        => $origin,
    'destination'   => $destination,
    'departureDate' => $departureDate,
    'returnDate'    => $tripType === 'round' ? $returnDate : null,
    'counts'        => $counts,
    'passengers'    => $passengers,
];

setLastSearch('flights', $criteria);

json_ok([
    'criteria'   => $criteria + ['passengerText' => describe_passengers($counts)],
    'outbound'   => $outbound,
    'inbound'    => $inbound,
]);
