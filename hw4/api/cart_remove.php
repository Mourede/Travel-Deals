<?php
/**
 * Drops the flight or the hotel from the session cart.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

requireLoginJson();

$kind = $_POST['kind'] ?? '';

if (!in_array($kind, ['flight', 'hotel'], true)) {
    json_error('There is nothing of that kind in the cart.');
}

cartClear($kind);

json_ok(['message' => 'Removed from your cart.']);
