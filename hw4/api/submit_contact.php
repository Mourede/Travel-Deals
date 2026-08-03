<?php
/**
 * Saves a comment to contacts.xml (assignment section 4).
 *
 * Requires login and a comment of at least 10 characters. The commenter's
 * details are read from the users table using the phone number in the
 * session rather than taken from the form, so the record cannot be filed
 * under someone else's name.
 *
 * The file is locked for the read-modify-write so two comments submitted at
 * the same moment cannot overwrite each other or leave broken XML behind.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$user = requireLoginJson();

$comment = trim($_POST['comment'] ?? '');

if ($comment === '') {
    json_error('Enter a comment before submitting.');
}

if (mb_strlen($comment) < 10) {
    json_error(
        'Your comment must be at least 10 characters. It is currently '
        . mb_strlen($comment) . '.'
    );
}

$stmt = db()->prepare(
    'SELECT phone, first_name, last_name, date_of_birth, gender, email
       FROM users
      WHERE phone = ?'
);
$stmt->execute([$user['phone']]);
$row = $stmt->fetch();

if (!$row) {
    json_error('Your account could not be found. Please log in again.', 401);
}

$path = __DIR__ . '/../contacts.xml';

// Opened r+ when it exists so the lock is held across the read and the
// write; c+ creates it on the first comment without truncating.
$handle = fopen($path, file_exists($path) ? 'r+' : 'c+');

if ($handle === false) {
    json_error(
        'Could not open contacts.xml for writing. The web server needs write '
        . 'permission on the hw4 folder.',
        500
    );
}

if (!flock($handle, LOCK_EX)) {
    fclose($handle);
    json_error('contacts.xml is busy, please try again.', 503);
}

try {
    $size     = filesize($path) ?: 0;
    $existing = $size > 0 ? fread($handle, $size) : '';

    $doc                     = new DOMDocument('1.0', 'UTF-8');
    $doc->formatOutput       = true;
    $doc->preserveWhiteSpace = false;

    if (trim($existing) !== '' && $doc->loadXML($existing)) {
        $root = $doc->documentElement;
    } else {
        $root = $doc->createElement('contacts');
        $doc->appendChild($root);
    }

    // Contact ids continue from the highest one already in the file, so they
    // stay unique across restarts without needing a table to track them.
    $nextId = 3001;

    foreach ($root->getElementsByTagName('contactId') as $node) {
        $nextId = max($nextId, (int) $node->textContent + 1);
    }

    $contact = $doc->createElement('contact');

    $fields = [
        'contactId'   => (string) $nextId,
        'phone'       => $row['phone'],
        'firstName'   => $row['first_name'],
        'lastName'    => $row['last_name'],
        'dateOfBirth' => $row['date_of_birth'],
        'email'       => $row['email'],
        'gender'      => $row['gender'] ?? '',
        'comment'     => $comment,
        'submittedAt' => date('Y-m-d H:i:s'),
    ];

    foreach ($fields as $name => $value) {
        // createTextNode escapes the value, so a comment containing < or &
        // cannot break the document.
        $element = $doc->createElement($name);
        $element->appendChild($doc->createTextNode($value));
        $contact->appendChild($element);
    }

    $root->appendChild($contact);

    $xml = $doc->saveXML();

    ftruncate($handle, 0);
    rewind($handle);

    if (fwrite($handle, $xml) === false) {
        throw new RuntimeException('Could not write to contacts.xml.');
    }

    fflush($handle);
    $total = $root->getElementsByTagName('contact')->length;
} catch (Throwable $e) {
    flock($handle, LOCK_UN);
    fclose($handle);
    json_error($e->getMessage(), 500);
}

flock($handle, LOCK_UN);
fclose($handle);

json_ok([
    'message'   => 'Thanks, your comment was saved as contact id ' . $nextId . '.',
    'contactId' => $nextId,
    'total'     => $total,
    'record'    => [
        'contactId'   => $nextId,
        'phone'       => $row['phone'],
        'firstName'   => $row['first_name'],
        'lastName'    => $row['last_name'],
        'dateOfBirth' => $row['date_of_birth'],
        'email'       => $row['email'],
        'gender'      => $row['gender'] ?? '',
        'comment'     => $comment,
    ],
]);
