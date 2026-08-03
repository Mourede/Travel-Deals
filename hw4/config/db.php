<?php
/**
 * PDO connection to the travel_deals database.
 *
 * The connection is tried against XAMPP's MySQL socket first and then
 * against TCP on localhost, so the same code runs under XAMPP and under
 * PHP's built-in server without editing anything. Override any of it with
 * a config/db.local.php returning an array of dsn / user / password.
 */

define('DB_NAME', 'travel_deals');

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $attempts = [];

    $local = __DIR__ . '/db.local.php';
    if (is_readable($local)) {
        $override = require $local;
        $attempts[] = [
            $override['dsn'],
            $override['user'] ?? 'root',
            $override['password'] ?? '',
        ];
    }

    $xamppSocket = '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock';
    if (file_exists($xamppSocket)) {
        $attempts[] = [
            'mysql:unix_socket=' . $xamppSocket . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            'root',
            '',
        ];
    }

    $attempts[] = ['mysql:host=127.0.0.1;port=3306;dbname=' . DB_NAME . ';charset=utf8mb4', 'root', ''];

    $lastError = null;

    foreach ($attempts as [$dsn, $user, $password]) {
        try {
            $pdo = new PDO($dsn, $user, $password, $options);
            return $pdo;
        } catch (PDOException $e) {
            $lastError = $e;
        }
    }

    throw new RuntimeException(
        'Could not connect to the ' . DB_NAME . ' database. Start MySQL, then run '
        . 'hw4/sql/schema.sql. Last error: ' . $lastError->getMessage()
    );
}

/**
 * Sends a JSON response and stops. Every api/ endpoint replies through
 * here so the client always gets the same shape: {ok: bool, ...}.
 */
function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function json_ok(array $payload = []): void
{
    json_response(['ok' => true] + $payload);
}

function json_error(string $message, int $status = 400): void
{
    json_response(['ok' => false, 'error' => $message], $status);
}
