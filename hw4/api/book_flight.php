<?php
/**
 * Books the flight or flights in the cart (assignment section 7).
 *
 * Everything happens in one transaction: passengers, one flight_booking
 * per leg, one ticket per passenger per leg, and the seat decrement. If any
 * step fails the whole thing rolls back, so there is never a booking with
 * missing tickets or seats taken for a booking that did not complete.
 *
 * The seat decrement is also the double-booking guard. It carries its own
 * "and there are still enough seats" condition, so two people booking the
 * last seats at the same moment cannot both succeed — the second UPDATE
 * matches no rows and that aborts the transaction.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/cities.php';
require_once __DIR__ . '/../config/travel.php';

requireLoginJson();

$cartFlight = cartGet('flight');

if ($cartFlight === null || $cartFlight['departing'] === null) {
    json_error('There is no flight in your cart to book.');
}

if ($cartFlight['tripType'] === 'round' && $cartFlight['returning'] === null) {
    json_error('Select a returning flight before booking this round trip.');
}

$counts = $cartFlight['counts'];

$errors     = [];
$travellers = read_travellers($_POST, $counts, $errors);

if ($errors) {
    json_error(implode(' ', $errors));
}

// One leg for a one way trip, two for a round trip. Each becomes its own
// flight_booking row, because that table holds a single flight_id.
$legs = [['label' => 'Departing', 'flight' => $cartFlight['departing']]];

if ($cartFlight['tripType'] === 'round') {
    $legs[] = ['label' => 'Returning', 'flight' => $cartFlight['returning']];
}

$seatsNeeded = total_passengers($counts);

$pdo = db();
$pdo->beginTransaction();

try {
    // A traveller who has flown before already has a passenger row, and SSN
    // is unique, so update rather than insert a second one.
    $passengerStmt = $pdo->prepare(
        'INSERT INTO passenger (ssn, first_name, last_name, date_of_birth, category)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            first_name    = VALUES(first_name),
            last_name     = VALUES(last_name),
            date_of_birth = VALUES(date_of_birth),
            category      = VALUES(category)'
    );

    foreach ($travellers as $traveller) {
        $passengerStmt->execute([
            $traveller['ssn'],
            $traveller['firstName'],
            $traveller['lastName'],
            $traveller['dob'],
            $traveller['category'],
        ]);
    }

    $bookingStmt = $pdo->prepare(
        'INSERT INTO flight_booking (flight_id, total_price) VALUES (?, ?)'
    );

    $ticketStmt = $pdo->prepare(
        'INSERT INTO tickets (flight_booking_id, ssn, price) VALUES (?, ?, ?)'
    );

    // The guard: the WHERE clause re-checks availability at the moment of
    // the write, so this cannot oversell a flight. The seat count is bound
    // twice under two names because native prepared statements will not
    // reuse one placeholder.
    $seatStmt = $pdo->prepare(
        'UPDATE flights
            SET available_seats = available_seats - :take
          WHERE flight_id = :id
            AND available_seats >= :need'
    );

    $flightStmt = $pdo->prepare(
        'SELECT flight_id, origin, destination, departure_date, arrival_date,
                departure_time, arrival_time, available_seats, price
           FROM flights
          WHERE flight_id = ?'
    );

    $confirmation = [];
    $grandTotal   = 0.0;

    foreach ($legs as $leg) {
        $flightId = $leg['flight']['flight_id'];

        // Re-read the fare from the table rather than trusting the copy that
        // has been sitting in the session since the search.
        $flightStmt->execute([$flightId]);
        $flight = $flightStmt->fetch();

        if (!$flight) {
            throw new RuntimeException('Flight ' . $flightId . ' is no longer listed.');
        }

        $adultFare = (float) $flight['price'];
        $legTotal  = leg_total($adultFare, $counts);

        $seatStmt->execute([
            'take' => $seatsNeeded,
            'need' => $seatsNeeded,
            'id'   => $flightId,
        ]);

        if ($seatStmt->rowCount() === 0) {
            throw new RuntimeException(
                'Flight ' . $flightId . ' no longer has ' . $seatsNeeded
                . ' seats available. Someone booked them while you were '
                . 'filling in the form.'
            );
        }

        $bookingStmt->execute([$flightId, $legTotal]);
        $bookingId = (int) $pdo->lastInsertId();

        $tickets = [];

        foreach ($travellers as $traveller) {
            $price = ticket_price($adultFare, $traveller['category']);

            $ticketStmt->execute([$bookingId, $traveller['ssn'], $price]);

            $tickets[] = [
                'ticketId'        => (int) $pdo->lastInsertId(),
                'flightBookingId' => $bookingId,
                'ssn'             => $traveller['ssn'],
                'firstName'       => $traveller['firstName'],
                'lastName'        => $traveller['lastName'],
                'dob'             => $traveller['dob'],
                'category'        => $traveller['category'],
                'price'           => $price,
            ];
        }

        $grandTotal += $legTotal;

        $confirmation[] = [
            'leg'             => $leg['label'],
            'flightBookingId' => $bookingId,
            'flightId'        => $flight['flight_id'],
            'origin'          => $flight['origin'],
            'destination'     => $flight['destination'],
            'departureDate'   => $flight['departure_date'],
            'arrivalDate'     => $flight['arrival_date'],
            'departureTime'   => $flight['departure_time'],
            'arrivalTime'     => $flight['arrival_time'],
            'totalPrice'      => $legTotal,
            'seatsRemaining'  => (int) $flight['available_seats'] - $seatsNeeded,
            'tickets'         => $tickets,
        ];
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_error($e->getMessage());
}

// Booked, so the cart entry is done. The search stays put in case the user
// wants to book something else on the same itinerary.
cartClear('flight');

json_ok([
    'message'    => count($confirmation) === 1
        ? 'Flight booked.'
        : 'Round trip booked, both legs confirmed.',
    'tripType'   => $cartFlight['tripType'],
    'passengers' => describe_passengers($counts),
    'grandTotal' => round($grandTotal, 2),
    'bookings'   => $confirmation,
]);
