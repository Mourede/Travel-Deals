<?php
/**
 * Test harness — calls one api/ endpoint from the command line.
 *
 * This exists so the booking and reporting endpoints could be tested
 * before login.php was written, and so the whole flow can be re-checked
 * in one command after any change. It is a development tool and is not
 * reachable from the web app; nothing in hw4/ requires it.
 *
 *   php tests/call.php <endpoint> <session-json> <post-json>
 *
 * Example:
 *   php tests/call.php api/search_flights.php \
 *       '{"phone":"214-555-1234","firstName":"Jane","lastName":"Doe"}' \
 *       '{"tripType":"oneway","origin":"Dallas"}'
 *
 * A fixed session id keeps the cart alive across calls, which is what
 * makes a search-then-add-then-book sequence testable.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$endpoint    = $argv[1] ?? '';
$sessionJson = $argv[2] ?? '{}';
$postJson    = $argv[3] ?? '{}';

$root = dirname(__DIR__);
$file = $root . '/' . ltrim($endpoint, '/');

if ($endpoint === '' || !is_readable($file)) {
    fwrite(STDERR, "Usage: php tests/call.php <endpoint> <session-json> <post-json>\n");
    exit(2);
}

$sessionData = json_decode($sessionJson, true);
$postData    = json_decode($postJson, true);

if (!is_array($sessionData) || !is_array($postData)) {
    fwrite(STDERR, "Session and post arguments must both be JSON objects.\n");
    exit(2);
}

// A stable id so the session file, and therefore the cart, is shared by
// every call in a test run. TEST_SESSION_ID overrides it when a test needs
// its own isolated session.
session_id(getenv('TEST_SESSION_ID') ?: 'hw4testsession');

$_POST                    = $postData;
$_REQUEST                 = $postData;
$_SERVER['REQUEST_METHOD'] = 'POST';

require_once $root . '/config/db.php';
require_once $root . '/config/session.php';

// Session keys given on the command line replace what is stored; keys left
// out are kept, so the cart survives from one call to the next.
foreach ($sessionData as $key => $value) {
    $_SESSION[$key] = $value;
}

// "logout": true clears the session, for checking that a guarded endpoint
// refuses an anonymous caller.
if (!empty($sessionData['logout'])) {
    $_SESSION = [];
}

require $file;
