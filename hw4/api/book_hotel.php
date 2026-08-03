<?php
/**
 * Books the hotel in the cart (assignment section 8).
 *
 * One transaction: the hotel_booking row, then a guesses row per guest.
 * There is no room count to decrement, because the assignment says to
 * assume hotels always have rooms available.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/cities.php';
require_once __DIR__ . '/../config/travel.php';

requireLoginJson();

$cartHotel = cartGet('hotel');

if ($cartHotel === null) {
    json_error('There is no hotel in your cart to book.');
}

$counts = $cartHotel['counts'];

$errors = [];
$guests = read_travellers($_POST, $counts, $errors);

if ($errors) {
    json_error(implode(' ', $errors));
}

$pdo = db();
$pdo->beginTransaction();

try {
    // Re-read the rate from the table rather than trusting the copy in the
    // session, so the price cannot have been edited in the browser.
    $hotelStmt = $pdo->prepare(
        'SELECT hotel_id, hotel_name, city, price_per_night FROM hotels WHERE hotel_id = ?'
    );
    $hotelStmt->execute([$cartHotel['hotel']['hotel_id']]);
    $hotel = $hotelStmt->fetch();

    if (!$hotel) {
        throw new RuntimeException('That hotel is no longer listed.');
    }

    $rooms      = (int) $cartHotel['rooms'];
    $nights     = (int) $cartHotel['nights'];
    $rate       = (float) $hotel['price_per_night'];
    $totalPrice = round($rate * $rooms * $nights, 2);

    $bookingStmt = $pdo->prepare(
        'INSERT INTO hotel_booking
            (hotel_id, check_in_date, check_out_date, number_of_rooms,
             price_per_night, total_price)
         VALUES (?, ?, ?, ?, ?, ?)'
    );

    $bookingStmt->execute([
        $hotel['hotel_id'],
        $cartHotel['checkInDate'],
        $cartHotel['checkOutDate'],
        $rooms,
        $rate,
        $totalPrice,
    ]);

    $bookingId = (int) $pdo->lastInsertId();

    // SSN is the primary key on guesses, so a guest who has stayed before
    // moves to this booking rather than causing a duplicate-key failure.
    $guestStmt = $pdo->prepare(
        'INSERT INTO guesses (ssn, hotel_booking_id, first_name, last_name,
                              date_of_birth, category)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            hotel_booking_id = VALUES(hotel_booking_id),
            first_name       = VALUES(first_name),
            last_name        = VALUES(last_name),
            date_of_birth    = VALUES(date_of_birth),
            category         = VALUES(category)'
    );

    $guestRows = [];

    foreach ($guests as $guest) {
        $guestStmt->execute([
            $guest['ssn'],
            $bookingId,
            $guest['firstName'],
            $guest['lastName'],
            $guest['dob'],
            $guest['category'],
        ]);

        $guestRows[] = [
            'ssn'       => $guest['ssn'],
            'firstName' => $guest['firstName'],
            'lastName'  => $guest['lastName'],
            'dob'       => $guest['dob'],
            'category'  => $guest['category'],
        ];
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_error($e->getMessage());
}

cartClear('hotel');

json_ok([
    'message' => 'Hotel booked.',
    'booking' => [
        'hotelBookingId' => $bookingId,
        'hotelId'        => $hotel['hotel_id'],
        'hotelName'      => $hotel['hotel_name'],
        'city'           => $hotel['city'],
        'pricePerNight'  => $rate,
        'rooms'          => $rooms,
        'nights'         => $nights,
        'checkInDate'    => $cartHotel['checkInDate'],
        'checkOutDate'   => $cartHotel['checkOutDate'],
        'totalPrice'     => $totalPrice,
        'guests'         => $guestRows,
    ],
]);
