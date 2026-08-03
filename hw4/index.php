<?php
$pageTitle  = 'Home';
$activePage = '';
require __DIR__ . '/includes/header.php';
?>

      <div class="hero">
        <h2>Welcome to Travel Deals</h2>
        <p>
          Search flights and hotels between Texas and California
          for September through December 2024.
        </p>
      </div>

      <?php if ($user === null): ?>
        <h2>Get started</h2>
        <p class="intro">
          <a href="register.php">Register</a> for an account, then
          <a href="login.php">log in</a> to search and book.
        </p>
      <?php else: ?>
        <h2>Welcome back, <?= htmlspecialchars($user['firstName']) ?></h2>
        <p class="intro">Pick up where you left off.</p>
      <?php endif; ?>

      <div class="cards">

        <a class="card" href="flights.php" style="text-decoration:none;">
          <div class="ico">&#9992;</div>
          <h4>Flights</h4>
          <p>Book one-way or round trip flights.</p>
        </a>

        <a class="card" href="stays.php" style="text-decoration:none;">
          <div class="ico">&#127976;</div>
          <h4>Stays</h4>
          <p>Find hotels and rooms for your group.</p>
        </a>

        <a class="card" href="cart.php" style="text-decoration:none;">
          <div class="ico">&#128722;</div>
          <h4>Cart</h4>
          <p>Review and book what you selected.</p>
        </a>

        <a class="card" href="my-account.php" style="text-decoration:none;">
          <div class="ico">&#128203;</div>
          <h4>My Account</h4>
          <p>Look up your bookings and reports.</p>
        </a>

        <a class="card" href="contact.php" style="text-decoration:none;">
          <div class="ico">&#9993;</div>
          <h4>Contact Us</h4>
          <p>Send us a comment or a question.</p>
        </a>

      </div>

<?php require __DIR__ . '/includes/footer.php'; ?>
