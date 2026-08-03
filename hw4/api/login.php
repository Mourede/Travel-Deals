<?php
/**
 * Logs a user in with their phone number and password (section 1).
 *
 * Reference implementation, built to AUTH-CONTRACT.md.
 *
 * A wrong phone number and a wrong password give the same message on
 * purpose, so this cannot be used to find out which numbers are registered.
 * password_verify is still called against a dummy hash when the phone is
 * unknown, so both paths take about the same time either way.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$phone    = trim($_POST['phone'] ?? '');
$password = (string) ($_POST['password'] ?? '');

$errors = [];

if ($phone === '') {
    $errors[] = 'Enter your phone number.';
}

if ($password === '') {
    $errors[] = 'Enter your password.';
}

if ($errors) {
    json_error(implode(' ', $errors));
}

$stmt = db()->prepare(
    'SELECT phone, password, first_name, last_name FROM users WHERE phone = ?'
);
$stmt->execute([$phone]);
$row = $stmt->fetch();

// A hash of nothing anyone will type, so the unknown-phone path still does
// the work of a real comparison.
const DUMMY_HASH = '$2y$12$usesomesillystringfore7hnbRJHxXVLeakoG8K30M1BLDlteBBW';

$hash = $row ? $row['password'] : DUMMY_HASH;

if (!password_verify($password, $hash) || !$row) {
    json_error('That phone number and password do not match an account.', 401);
}

// The three keys everything else reads; see AUTH-CONTRACT.md.
$_SESSION['phone']     = $row['phone'];
$_SESSION['firstName'] = $row['first_name'];
$_SESSION['lastName']  = $row['last_name'];

json_ok([
    'message' => 'Welcome back, ' . $row['first_name'] . '.',
    'isAdmin' => isAdmin(),
]);
