<?php
/**
 * My account (assignment sections 6, 8 and 9).
 *
 * Four lookups for any logged-in user, and for the admin the two data
 * loaders plus eight reports. The admin blocks are only drawn for the admin,
 * and api/account_query.php checks again on its side, so hiding a button is
 * not the only thing keeping a report private.
 */

$pageTitle  = 'My Account';
$activePage = 'my-account';
$pageScript = 'account.js';
require __DIR__ . '/includes/header.php';

// Row counts, so it is obvious at a glance whether the loaders have been run.
$counts = ['flights' => 0, 'hotels' => 0, 'flight_booking' => 0, 'hotel_booking' => 0];
$dbError = null;

if ($user !== null) {
    try {
        foreach (array_keys($counts) as $tableName) {
            $counts[$tableName] = (int) db()
                ->query('SELECT COUNT(*) FROM ' . $tableName)
                ->fetchColumn();
        }
    } catch (Throwable $e) {
        $dbError = $e->getMessage();
    }
}
?>

      <h2>My account</h2>

      <?php if ($user === null): ?>

        <?= loginPrompt('view your account') ?>

      <?php elseif ($dbError !== null): ?>

        <div class="error">
          Could not reach the database. Start MySQL and run
          <code>hw4/sql/schema.sql</code>, then reload.
          <br><br><?= htmlspecialchars($dbError) ?>
        </div>

      <?php else: ?>

        <p class="intro">
          Signed in as <strong><?= htmlspecialchars($user['firstName']
            . ' ' . $user['lastName']) ?></strong>
          (<?= htmlspecialchars($user['phone']) ?>).
        </p>

        <div class="result">
          <h3>What is in the database</h3>
          <p><strong>Flights:</strong> <?= $counts['flights'] ?></p>
          <p><strong>Hotels:</strong> <?= $counts['hotels'] ?></p>
          <p><strong>Flight bookings:</strong> <?= $counts['flight_booking'] ?></p>
          <p><strong>Hotel bookings:</strong> <?= $counts['hotel_booking'] ?></p>
        </div>

        <?php if (isAdmin()): ?>
          <h2>Load the data files</h2>
          <p class="intro">
            Admin only. Loads flights.json and hotels.xml into the database.
            Both are safe to run more than once, and re-running the flights
            loader also puts the seat counts back to what the file says.
          </p>

          <div class="query-card admin-only">
            <h4>Flights from flights.json</h4>
            <button onclick="loadFlights()">Load flights.json</button>
            <button class="btn-ghost" onclick="loadHotels()">Load hotels.xml</button>
            <div id="loaderMessage"></div>
          </div>
        <?php endif; ?>

        <h2>Look up your bookings</h2>

        <div class="query-card">
          <h4>1. A booked flight and a booked hotel by id</h4>
          <form id="q_booking_lookup" onsubmit="return false;">
            <div class="field-row">
              <label>Flight booking id
                <input type="text" name="flightBookingId" placeholder="1001">
              </label>
              <label>Hotel booking id
                <input type="text" name="hotelBookingId" placeholder="2001">
              </label>
            </div>
          </form>
          <button onclick="runQuery('booking_lookup')">Look up</button>
          <p class="saved-note">Either id on its own works, or both together.</p>
        </div>

        <div class="query-card">
          <h4>2. All passengers on a booked flight</h4>
          <form id="q_booking_passengers" onsubmit="return false;">
            <label>Flight booking id
              <input type="text" name="flightBookingId" placeholder="1001">
            </label>
          </form>
          <button onclick="runQuery('booking_passengers')">Look up</button>
        </div>

        <div class="query-card">
          <h4>3. Everything booked for September 2024</h4>
          <button onclick="runQuery('september_2024')">Run</button>
        </div>

        <div class="query-card">
          <h4>4. Flights booked for one person, by SSN</h4>
          <form id="q_flights_by_ssn" onsubmit="return false;">
            <label>SSN
              <input type="text" name="ssn" placeholder="123-45-6789">
            </label>
          </form>
          <button onclick="runQuery('flights_by_ssn')">Look up</button>
        </div>

        <?php if (isAdmin()): ?>
          <h2>Admin reports</h2>
          <p class="intro">Admin only.</p>

          <div class="query-card admin-only">
            <h4>5. Booked flights departing Texas, Sep to Oct 2024</h4>
            <button onclick="runQuery('tx_departures')">Run</button>
          </div>

          <div class="query-card admin-only">
            <h4>6. Booked hotels in Texas, Sep to Oct 2024</h4>
            <button onclick="runQuery('tx_hotels')">Run</button>
          </div>

          <div class="query-card admin-only">
            <h4>7. Most expensive booked hotels</h4>
            <button onclick="runQuery('expensive_hotels')">Run</button>
          </div>

          <div class="query-card admin-only">
            <h4>8. Booked flights with an infant passenger</h4>
            <button onclick="runQuery('flights_with_infant')">Run</button>
          </div>

          <div class="query-card admin-only">
            <h4>9. Booked flights with an infant and at least 5 children</h4>
            <button onclick="runQuery('infant_and_children')">Run</button>
          </div>

          <div class="query-card admin-only">
            <h4>10. Most expensive booked flights</h4>
            <button onclick="runQuery('expensive_flights')">Run</button>
          </div>

          <div class="query-card admin-only">
            <h4>11. Booked flights departing Texas with no infant passenger</h4>
            <button onclick="runQuery('tx_no_infant')">Run</button>
          </div>

          <div class="query-card admin-only">
            <h4>12. How many booked flights arrive in California in Sep or Oct 2024</h4>
            <button onclick="runQuery('ca_arrivals_count')">Run</button>
          </div>
        <?php endif; ?>

        <div id="queryMessage"></div>
        <div id="queryResults"></div>

      <?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
