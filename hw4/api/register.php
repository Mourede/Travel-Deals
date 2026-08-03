<?php
/**
 * Registers a user (assignment section 1).
 *
 * Reference implementation, built to AUTH-CONTRACT.md so it can be swapped
 * for the teammate's version by replacing this file and api/login.php.
 *
 * All seven validation rules are enforced here rather than in the browser,
 * and every failure is collected so the user sees all of them at once
 * instead of fixing one and discovering the next.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/cities.php';

const MIN_PASSWORD_LENGTH = 8;

$phone     = trim($_POST['phone'] ?? '');
$password  = (string) ($_POST['password'] ?? '');
$confirm   = (string) ($_POST['confirmPassword'] ?? '');
$firstName = trim($_POST['firstName'] ?? '');
$lastName  = trim($_POST['lastName'] ?? '');
$dob       = trim($_POST['dateOfBirth'] ?? '');
$email     = trim($_POST['email'] ?? '');
$gender    = trim($_POST['gender'] ?? '');

$errors = [];

// Rule 1: everything except gender is required.
if ($phone === '') {
    $errors[] = 'Enter a phone number.';
}

if ($password === '') {
    $errors[] = 'Enter a password.';
}

if ($firstName === '') {
    $errors[] = 'Enter a first name.';
}

if ($lastName === '') {
    $errors[] = 'Enter a last name.';
}

if ($dob === '') {
    $errors[] = 'Enter a date of birth.';
}

if ($email === '') {
    $errors[] = 'Enter an email address.';
}

// Rule 3: ddd-ddd-dddd.
if ($phone !== '' && !preg_match('/^\d{3}-\d{3}-\d{4}$/', $phone)) {
    $errors[] = 'Phone number must be formatted as ddd-ddd-dddd, for example 214-555-1234.';
}

// Rule 4: the same password twice.
if ($password !== '' && $password !== $confirm) {
    $errors[] = 'The two passwords do not match.';
}

// Rule 5: at least 8 characters.
if ($password !== '' && strlen($password) < MIN_PASSWORD_LENGTH) {
    $errors[] = 'Password must be at least ' . MIN_PASSWORD_LENGTH
        . ' characters. Yours is ' . strlen($password) . '.';
}

// Rule 6: 2-digit month, 2-digit day, 4-digit year. is_valid_date also
// rejects dates that do not exist, like 2024-02-31.
if ($dob !== '' && !is_valid_date($dob)) {
    $errors[] = 'Date of birth must be a real date written as yyyy-mm-dd, '
        . 'with 2 digits for the month, 2 for the day and 4 for the year.';
}

// Rule 7: an @ and a .com.
if ($email !== '' && (!str_contains($email, '@') || !str_contains($email, '.com'))) {
    $errors[] = 'Email must contain @ and .com.';
}

if ($gender !== '' && !in_array($gender, ['female', 'male', 'other'], true)) {
    $errors[] = 'Choose one of the listed genders, or leave it blank.';
}

if ($errors) {
    json_error(implode(' ', $errors));
}

// Rule 2: the phone number is unique. Inserting and catching the duplicate
// is safe against two people registering the same number at once, which a
// SELECT-then-INSERT would not be.
try {
    $stmt = db()->prepare(
        'INSERT INTO users
            (phone, password, first_name, last_name, date_of_birth, gender, email)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    $stmt->execute([
        $phone,
        password_hash($password, PASSWORD_DEFAULT),
        $firstName,
        $lastName,
        $dob,
        $gender === '' ? null : $gender,
        $email,
    ]);
} catch (PDOException $e) {
    // 23000 is the integrity-constraint class, which here means the phone
    // number is already taken.
    if ($e->getCode() === '23000') {
        json_error('That phone number is already registered. Try logging in instead.');
    }

    throw $e;
}

// Registered users are logged straight in. These are the three keys the rest
// of the app reads; see AUTH-CONTRACT.md.
$_SESSION['phone']     = $phone;
$_SESSION['firstName'] = $firstName;
$_SESSION['lastName']  = $lastName;

json_ok([
    'message' => 'Welcome, ' . $firstName . '. Your account is registered and '
        . 'you are now logged in.',
    'phone'   => $phone,
]);
