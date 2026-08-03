<?php
/**
 * Ends the session and returns to the home page. Reached from the "Log
 * out" link in the header, so it redirects rather than answering JSON.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$_SESSION = [];
session_destroy();

header('Location: ../index.php');
exit;
