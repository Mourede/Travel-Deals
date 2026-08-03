<?php
/**
 * Log in (assignment section 1).
 *
 * Reference implementation, see AUTH-CONTRACT.md.
 */

$pageTitle  = 'Login';
$activePage = 'login';
$pageScript = 'auth.js';
require __DIR__ . '/includes/header.php';
?>

      <h2>Log in</h2>

      <?php if ($user !== null): ?>

        <div class="ok-note">
          You are signed in as
          <strong><?= htmlspecialchars($user['firstName'] . ' ' . $user['lastName']) ?></strong>.
          Go to <a href="flights.php">flights</a>,
          <a href="stays.php">stays</a> or
          <a href="my-account.php">your account</a>,
          or <a href="api/logout.php">log out</a>.
        </div>

      <?php else: ?>

        <p class="intro">Log in with the phone number you registered with.</p>

        <form id="loginForm" onsubmit="return false;">
          <label>Phone number
            <input type="text" name="phone" placeholder="214-555-1234" required>
          </label>

          <label>Password
            <input type="password" name="password" required>
          </label>

          <br>
          <button type="button" onclick="submitLogin()">Log in</button>
        </form>

        <div id="authMessage"></div>

        <p class="saved-note">
          No account yet? <a href="register.php">Register here</a>.
        </p>

      <?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
