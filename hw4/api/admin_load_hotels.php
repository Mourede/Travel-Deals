<?php
/**
 * Loads hotels.xml into the hotels table (assignment section 8).
 * Admin only, triggered from the my-account page.
 *
 * Same upsert approach as the flights loader, so it is safe to re-run.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

requireAdminJson();

$path = __DIR__ . '/../hotels.xml';

if (!is_readable($path)) {
    json_error('hotels.xml is missing from the hw4 folder.', 500);
}

// Collect parse errors instead of letting them print into the JSON body.
libxml_use_internal_errors(true);

$xml = simplexml_load_file($path);

if ($xml === false) {
    $problems = array_map(
        static fn($error) => trim($error->message),
        libxml_get_errors()
    );
    libxml_clear_errors();

    json_error('hotels.xml could not be parsed: ' . implode('; ', $problems), 500);
}

$pdo = db();

$stmt = $pdo->prepare(
    'INSERT INTO hotels (hotel_id, hotel_name, city, price_per_night)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
        hotel_name      = VALUES(hotel_name),
        city            = VALUES(city),
        price_per_night = VALUES(price_per_night)'
);

$loaded  = 0;
$skipped = [];

$pdo->beginTransaction();

try {
    foreach ($xml->hotel as $index => $hotel) {
        $id    = trim((string) $hotel->hotelId);
        $name  = trim((string) $hotel->hotelName);
        $city  = trim((string) $hotel->city);
        $price = trim((string) $hotel->pricePerNight);

        if ($id === '' || $name === '' || $city === '' || $price === '') {
            $skipped[] = 'entry ' . ($index + 1) . ' (incomplete)';
            continue;
        }

        $stmt->execute([$id, $name, $city, (float) $price]);
        $loaded++;
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_error('Could not load hotels: ' . $e->getMessage(), 500);
}

$total = (int) $pdo->query('SELECT COUNT(*) FROM hotels')->fetchColumn();

$message = 'Loaded ' . $loaded . ' hotels from hotels.xml. '
    . 'The hotels table now holds ' . $total . ' rows.';

if ($skipped) {
    $message .= ' Skipped ' . count($skipped) . ': ' . implode('; ', $skipped) . '.';
}

json_ok(['message' => $message, 'loaded' => $loaded, 'total' => $total]);
