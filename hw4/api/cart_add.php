<?php
/**
 * Puts a chosen flight or hotel into the session cart.
 *
 * Only an id comes from the browser; every price and date is read back out
 * of the database here. That way a tampered form cannot change what a
 * booking costs, and the cart cannot drift out of step with the tables.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/cities.php';
require_once __DIR__ . '/../config/travel.php';

requireLoginJson();

$kind = $_POST['kind'] ?? '';

if ($kind === 'flight') {
    addFlightToCart();
} elseif ($kind === 'hotel') {
    addHotelToCart();
} else {
    json_error('Nothing to add to the cart.');
}


function addFlightToCart(): void
{
    $criteria = lastSearch('flights');

    if ($criteria === null) {
        json_error('Search for flights again before selecting one.');
    }

    $flightId = trim($_POST['flightId'] ?? '');
    $leg      = $_POST['leg'] ?? 'departing';

    if (!in_array($leg, ['departing', 'returning'], true)) {
        json_error('A flight can only be selected as the departing or the returning leg.');
    }

    if ($leg === 'returning' && $criteria['tripType'] !== 'round') {
        json_error('This is a one way trip, so there is no returning flight to select.');
    }

    $stmt = db()->prepare(
        'SELECT flight_id, origin, destination, departure_date, arrival_date,
                departure_time, arrival_time, available_seats, price
           FROM flights
          WHERE flight_id = ?'
    );
    $stmt->execute([$flightId]);
    $flight = $stmt->fetch();

    if (!$flight) {
        json_error('That flight is no longer listed.');
    }

    if ((int) $flight['available_seats'] < $criteria['passengers']) {
        json_error(
            'Flight ' . $flight['flight_id'] . ' only has '
            . $flight['available_seats'] . ' seats left, and you need '
            . $criteria['passengers'] . '.'
        );
    }

    // Both legs share one cart entry, since they are booked together and
    // priced together.
    $cartFlight = cartGet('flight') ?? [
        'tripType'   => $criteria['tripType'],
        'counts'     => $criteria['counts'],
        'passengers' => $criteria['passengers'],
        'departing'  => null,
        'returning'  => null,
    ];

    // A fresh search replaces an older selection rather than mixing the two.
    if ($cartFlight['counts'] !== $criteria['counts']
        || $cartFlight['tripType'] !== $criteria['tripType']) {
        $cartFlight = [
            'tripType'   => $criteria['tripType'],
            'counts'     => $criteria['counts'],
            'passengers' => $criteria['passengers'],
            'departing'  => null,
            'returning'  => null,
        ];
    }

    if ($leg === 'departing') {
        $cartFlight['departing'] = $flight;
    } else {
        $cartFlight['returning'] = $flight;
    }

    // The same flight cannot serve as both legs: booking it twice would draw
    // the seats down twice for one journey.
    if ($cartFlight['departing'] !== null
        && $cartFlight['returning'] !== null
        && $cartFlight['departing']['flight_id'] === $cartFlight['returning']['flight_id']) {
        json_error('Pick a different flight for the other leg of the trip.');
    }

    cartSet('flight', $cartFlight);

    $legLabel = $leg === 'departing' ? 'departing' : 'returning';

    $stillNeeded = $cartFlight['tripType'] === 'round'
        && ($cartFlight['departing'] === null || $cartFlight['returning'] === null);

    $message = 'Flight ' . $flight['flight_id'] . ' added to your cart as the '
        . $legLabel . ' flight.';

    if ($stillNeeded) {
        $missing = $cartFlight['departing'] === null ? 'departing' : 'returning';
        $message .= ' Now choose your ' . $missing . ' flight.';
    }

    json_ok([
        'message'  => $message,
        'complete' => !$stillNeeded,
        'cart'     => $cartFlight,
    ]);
}


function addHotelToCart(): void
{
    $criteria = lastSearch('hotels');

    if ($criteria === null) {
        json_error('Search for hotels again before selecting one.');
    }

    $hotelId = trim($_POST['hotelId'] ?? '');

    $stmt = db()->prepare(
        'SELECT hotel_id, hotel_name, city, price_per_night FROM hotels WHERE hotel_id = ?'
    );
    $stmt->execute([$hotelId]);
    $hotel = $stmt->fetch();

    if (!$hotel) {
        json_error('That hotel is no longer listed.');
    }

    $rooms  = $criteria['rooms'];
    $nights = $criteria['nights'];

    cartSet('hotel', [
        'hotel'        => $hotel,
        'counts'       => $criteria['counts'],
        'guests'       => $criteria['guests'],
        'checkInDate'  => $criteria['checkInDate'],
        'checkOutDate' => $criteria['checkOutDate'],
        'nights'       => $nights,
        'rooms'        => $rooms,
        'totalPrice'   => round((float) $hotel['price_per_night'] * $rooms * $nights, 2),
    ]);

    json_ok([
        'message' => $hotel['hotel_name'] . ' added to your cart.',
        'cart'    => cartGet('hotel'),
    ]);
}
