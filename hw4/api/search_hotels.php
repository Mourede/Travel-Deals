<?php
/**
 * Hotel search (assignment section 8).
 *
 * Validates the city and the two dates, works out how many rooms the group
 * needs, echoes it all back, and lists the hotels in that city.
 *
 * Hotels are assumed always to have rooms available, which the assignment
 * says to take as given, so there is no availability column and nothing to
 * decrement at booking time.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/cities.php';
require_once __DIR__ . '/../config/travel.php';

requireLoginJson();

$errors = [];

$cityInput = trim($_POST['city'] ?? '');
$city      = canonical_city($cityInput);

if ($cityInput === '') {
    $errors[] = 'Enter a city.';
} elseif ($city === null) {
    $errors[] = '"' . $cityInput . '" is not one of the Texas or California cities we cover.';
}

$checkIn  = trim($_POST['checkInDate'] ?? '');
$checkOut = trim($_POST['checkOutDate'] ?? '');

if ($checkIn === '') {
    $errors[] = 'Enter a check in date.';
} elseif (!is_valid_date($checkIn)) {
    $errors[] = 'Enter the check in date as yyyy-mm-dd.';
} elseif (!date_in_range($checkIn)) {
    $errors[] = 'Check in date must be between ' . DATE_MIN . ' and ' . DATE_MAX . '.';
}

if ($checkOut === '') {
    $errors[] = 'Enter a check out date.';
} elseif (!is_valid_date($checkOut)) {
    $errors[] = 'Enter the check out date as yyyy-mm-dd.';
} elseif (!date_in_range($checkOut)) {
    $errors[] = 'Check out date must be between ' . DATE_MIN . ' and ' . DATE_MAX . '.';
}

if ($errors === [] && $checkOut <= $checkIn) {
    $errors[] = 'The check out date has to be after the check in date.';
}

$counts = read_passenger_counts($_POST, $errors);

if ($errors) {
    json_error(implode(' ', $errors));
}

$rooms  = rooms_needed($counts);
$nights = nights_between($checkIn, $checkOut);

$pdo = db();

if ((int) $pdo->query('SELECT COUNT(*) FROM hotels')->fetchColumn() === 0) {
    json_error(
        'There are no hotels in the database yet. An admin needs to load '
        . 'hotels.xml from the my-account page first.'
    );
}

$stmt = $pdo->prepare(
    'SELECT hotel_id, hotel_name, city, price_per_night
       FROM hotels
      WHERE city = ?
   ORDER BY price_per_night'
);
$stmt->execute([$city]);
$hotels = $stmt->fetchAll();

// The total each hotel would come to for this stay, worked out here so the
// page does not have to repeat the arithmetic.
foreach ($hotels as &$hotel) {
    $hotel['stay_total'] = round((float) $hotel['price_per_night'] * $rooms * $nights, 2);
}
unset($hotel);

$criteria = [
    'city'         => $city,
    'checkInDate'  => $checkIn,
    'checkOutDate' => $checkOut,
    'counts'       => $counts,
    'guests'       => total_passengers($counts),
    'rooms'        => $rooms,
    'nights'       => $nights,
];

setLastSearch('hotels', $criteria);

json_ok([
    'criteria' => $criteria + ['guestText' => describe_passengers($counts)],
    'hotels'   => $hotels,
]);
