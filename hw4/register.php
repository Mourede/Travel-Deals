<?php
/**
 * Register (assignment section 1).
 *
 * Reference implementation, see AUTH-CONTRACT.md.
 *
 * The browser-side attributes here (required, pattern, minlength) are for
 * quick feedback only. api/register.php checks all seven rules again, which
 * is what actually decides whether the account is created.
 */

$pageTitle  = 'Register';
$activePage = 'register';
$pageScript = 'auth.js';
require __DIR__ . '/includes/header.php';
?>

      <h2>Register</h2>

      <?php if ($user !== null): ?>

        <div class="ok-note">
          You are already signed in as
          <strong><?= htmlspecialchars($user['firstName'] . ' ' . $user['lastName']) ?></strong>.
          <a href="api/logout.php">Log out</a> if you want to register a
          different account.
        </div>

      <?php else: ?>

        <p class="intro">
          Create an account to search and book. You will log in with your
          phone number.
        </p>

        <form id="registerForm" onsubmit="return false;">

          <div class="field-row">
            <label>Phone number
              <input type="text" name="phone" id="phone"
                     placeholder="214-555-1234"
                     pattern="\d{3}-\d{3}-\d{4}" required>
            </label>

            <label>Email
              <input type="text" name="email" id="email"
                     placeholder="you@example.com" required>
            </label>
          </div>

          <p class="saved-note">
            Phone must look like ddd-ddd-dddd. Email must contain @ and .com.
          </p>

          <div class="field-row">
            <label>First name
              <input type="text" name="firstName" required>
            </label>

            <label>Last name
              <input type="text" name="lastName" required>
            </label>
          </div>

          <div class="field-row">
            <label>Password
              <input type="password" name="password" id="password"
                     minlength="8" required>
            </label>

            <label>Confirm password
              <input type="password" name="confirmPassword" id="confirmPassword"
                     minlength="8" required>
            </label>
          </div>

          <p class="saved-note">At least 8 characters, entered twice.</p>

          <label>Date of birth
            <input type="date" name="dateOfBirth" required>
          </label>

          <label>Gender <span class="muted">(optional)</span></label>
          <div class="gender-box">
            <input type="radio" name="gender" value="female" id="genderFemale">
            <label for="genderFemale">Female</label>

            <input type="radio" name="gender" value="male" id="genderMale">
            <label for="genderMale">Male</label>

            <input type="radio" name="gender" value="other" id="genderOther">
            <label for="genderOther">Other</label>
          </div>

          <br>
          <button type="button" onclick="submitRegistration()">Register</button>
        </form>

        <div id="authMessage"></div>

        <p class="saved-note">
          Already registered? <a href="login.php">Log in here</a>.
        </p>

      <?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
