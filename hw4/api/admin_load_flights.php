<?php
/**
 * Loads flights.json into the flights table (assignment section 6).
 * Admin only, triggered from the my-account page.
 *
 * Upserts rather than inserts, so running it twice is harmless. Re-running
 * also restores available_seats to the file's original numbers, which is
 * the quickest way to reset the demo after a booking has drawn seats down.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

requireAdminJson();

$path = __DIR__ . '/../flights.json';

if (!is_readable($path)) {
    json_error('flights.json is missing from the hw4 folder.', 500);
}

$flights = json_decode(file_get_contents($path), true);

if (!is_array($flights)) {
    json_error('flights.json could not be parsed: ' . json_last_error_msg(), 500);
}

$required = [
    'flightId', 'origin', 'destination', 'departureDate',
    'arrivalDate', 'departureTime', 'arrivalTime', 'availableSeats', 'price',
];

$pdo = db();

$stmt = $pdo->prepare(
    'INSERT INTO flights
        (flight_id, origin, destination, departure_date, arrival_date,
         departure_time, arrival_time, available_seats, price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
        origin          = VALUES(origin),
        destination     = VALUES(destination),
        departure_date  = VALUES(departure_date),
        arrival_date    = VALUES(arrival_date),
        departure_time  = VALUES(departure_time),
        arrival_time    = VALUES(arrival_time),
        available_seats = VALUES(available_seats),
        price           = VALUES(price)'
);

$loaded  = 0;
$skipped = [];

$pdo->beginTransaction();

try {
    foreach ($flights as $index => $flight) {
        $missing = array_diff($required, array_keys($flight));

        if ($missing) {
            $skipped[] = 'entry ' . ($index + 1) . ' (missing ' . implode(', ', $missing) . ')';
            continue;
        }

        $stmt->execute([
            $flight['flightId'],
            $flight['origin'],
            $flight['destination'],
            $flight['departureDate'],
            $flight['arrivalDate'],
            $flight['departureTime'],
            $flight['arrivalTime'],
            (int) $flight['availableSeats'],
            (float) $flight['price'],
        ]);

        $loaded++;
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_error('Could not load flights: ' . $e->getMessage(), 500);
}

$total = (int) $pdo->query('SELECT COUNT(*) FROM flights')->fetchColumn();

$message = 'Loaded ' . $loaded . ' flights from flights.json. '
    . 'The flights table now holds ' . $total . ' rows.';

if ($skipped) {
    $message .= ' Skipped ' . count($skipped) . ': ' . implode('; ', $skipped) . '.';
}

json_ok(['message' => $message, 'loaded' => $loaded, 'total' => $total]);
