<?php
/**
 * Page header, navigation bar and the opening of the two-column layout.
 *
 * A page includes this, writes its content, then includes footer.php.
 * Set $pageTitle and $activePage before including.
 *
 * The header carries the live date and time (section 2) and, once logged
 * in, the user's first and last name (section 3). Both appear on every
 * page because every page comes through here.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/cities.php';

$pageTitle  = $pageTitle ?? 'Travel Deals';
$activePage = $activePage ?? '';
$user       = currentUser();

$navLinks = [
    'flights'    => ['flights.php', 'Flights'],
    'stays'      => ['stays.php', 'Stays'],
    'contact'    => ['contact.php', 'Contact Us'],
    'cart'       => ['cart.php', 'Cart'],
    'my-account' => ['my-account.php', 'My Account'],
    'register'   => ['register.php', 'Register'],
    'login'      => ['login.php', 'Login'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($pageTitle) ?> - Travel Deals</title>
  <link rel="stylesheet" href="mystyle.css">
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body>

  <div class="header">
    <h1>Travel Deals</h1>
    <div class="tagline">Plan your trip in one place</div>
    <div id="datetime"></div>

    <div class="whoami">
      <?php if ($user !== null): ?>
        Signed in as
        <strong><?= htmlspecialchars($user['firstName'] . ' ' . $user['lastName']) ?></strong>
        <?php if (isAdmin()): ?>
          <span class="admin-tag">admin</span>
        <?php endif; ?>
        &middot; <a href="api/logout.php">Log out</a>
      <?php else: ?>
        Not signed in &middot; <a href="login.php">Log in</a>
      <?php endif; ?>
    </div>
  </div>

  <div class="navbar">
    <?php foreach ($navLinks as $key => [$href, $label]): ?>
      <a href="<?= $href ?>"<?= $key === $activePage ? ' class="active"' : '' ?>><?= $label ?></a>
    <?php endforeach; ?>
  </div>

  <div class="container">

    <?php require __DIR__ . '/sidebar.php'; ?>

    <div class="main" id="mainContent">
