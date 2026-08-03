<?php
/**
 * Contact us (assignment section 4).
 *
 * The comment is the only thing the user types. The name, phone, date of
 * birth, email and gender that go into contacts.xml come from their account,
 * so they are shown here read-only rather than asked for again.
 */

$pageTitle  = 'Contact Us';
$activePage = 'contact';
$pageScript = 'contact.js';
require __DIR__ . '/includes/header.php';

$account = null;

if ($user !== null) {
    $stmt = db()->prepare(
        'SELECT phone, first_name, last_name, date_of_birth, gender, email
           FROM users
          WHERE phone = ?'
    );
    $stmt->execute([$user['phone']]);
    $account = $stmt->fetch() ?: null;
}
?>

      <h2>Contact us</h2>

      <?php if ($user === null): ?>

        <?= loginPrompt('submit a comment') ?>

      <?php else: ?>

        <p class="intro">
          Send us a question or a comment and we will get back to you.
        </p>

        <?php if ($account !== null): ?>
          <div class="result">
            <h3>Filed under your account</h3>
            <p><strong>Phone number:</strong>
              <?= htmlspecialchars($account['phone']) ?></p>
            <p><strong>Name:</strong>
              <?= htmlspecialchars($account['first_name'] . ' ' . $account['last_name']) ?></p>
            <p><strong>Date of birth:</strong>
              <?= htmlspecialchars($account['date_of_birth']) ?></p>
            <p><strong>Email:</strong>
              <?= htmlspecialchars($account['email']) ?></p>
            <p><strong>Gender:</strong>
              <?= $account['gender'] !== null && $account['gender'] !== ''
                    ? htmlspecialchars($account['gender'])
                    : '<span class="muted">not given</span>' ?></p>
          </div>
        <?php endif; ?>

        <form id="contactForm" onsubmit="return false;">
          <label>Your comment
            <textarea name="comment" id="comment" rows="6"
                      placeholder="At least 10 characters"
                      oninput="updateCharCount()"></textarea>
          </label>

          <p class="saved-note" id="charCount">0 characters. At least 10 needed.</p>

          <button type="button" onclick="submitComment()">Submit</button>
        </form>

        <div id="contactMessage"></div>
        <div id="contactRecord"></div>

      <?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
