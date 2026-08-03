<?php
/**
 * Session handling, login checks and the cart.
 *
 * login.php and register.php only have to set the three session keys
 * described in AUTH-CONTRACT.md; everything else on the site reads the
 * user through currentUser() rather than touching $_SESSION directly.
 *
 * The cart also lives in the session. The assignment lists eight tables
 * and none of them is a cart, so keeping it server-side in the session
 * is both simpler and closer to the spec than inventing a ninth table.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

const ADMIN_PHONE = '222-222-2222';

function currentUser(): ?array
{
    if (empty($_SESSION['phone'])) {
        return null;
    }

    return [
        'phone'     => $_SESSION['phone'],
        'firstName' => $_SESSION['firstName'] ?? '',
        'lastName'  => $_SESSION['lastName'] ?? '',
    ];
}

function isLoggedIn(): bool
{
    return currentUser() !== null;
}

function isAdmin(): bool
{
    return isLoggedIn() && $_SESSION['phone'] === ADMIN_PHONE;
}

/**
 * Guards an api/ endpoint. Answers with JSON rather than redirecting,
 * because every one of these is called over Ajax.
 */
function requireLoginJson(): array
{
    $user = currentUser();

    if ($user === null) {
        json_error('Please log in to continue.', 401);
    }

    return $user;
}

function requireAdminJson(): array
{
    $user = requireLoginJson();

    if (!isAdmin()) {
        json_error('This is an admin-only action.', 403);
    }

    return $user;
}

/**
 * Guards a page. Pages stay reachable when logged out so the visitor
 * sees the prompt to log in that section 4 asks for, instead of a
 * redirect that hides why they cannot use the form.
 */
function loginPrompt(string $action): string
{
    return '<div class="error">You need to <a href="login.php">log in</a> '
        . 'before you can ' . htmlspecialchars($action, ENT_QUOTES) . '. '
        . 'No account yet? <a href="register.php">Register here</a>.</div>';
}


// ------------------------------------------------------------
// Cart
// ------------------------------------------------------------

/**
 * Shape of the cart:
 *   $_SESSION['cart'] = [
 *     'flight' => [
 *        'tripType'   => 'oneway'|'round',
 *        'passengers' => ['adult' => n, 'child' => n, 'infant' => n],
 *        'departing'  => <flight row>,
 *        'returning'  => <flight row>|null,
 *     ],
 *     'hotel' => [ <hotel row> + stay details ],
 *   ]
 */
function cart(): array
{
    if (!isset($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
        $_SESSION['cart'] = [];
    }

    return $_SESSION['cart'];
}

function cartSet(string $key, $value): void
{
    cart();
    $_SESSION['cart'][$key] = $value;
}

function cartGet(string $key)
{
    return cart()[$key] ?? null;
}

function cartClear(?string $key = null): void
{
    if ($key === null) {
        $_SESSION['cart'] = [];
        return;
    }

    unset($_SESSION['cart'][$key]);
}

/**
 * The search the user last ran, held so the flights page can redraw its
 * results after a round trip through the cart.
 */
function setLastSearch(string $key, array $criteria): void
{
    $_SESSION['lastSearch'][$key] = $criteria;
}

function lastSearch(string $key): ?array
{
    return $_SESSION['lastSearch'][$key] ?? null;
}
