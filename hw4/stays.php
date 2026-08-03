<?php
/**
 * Hotel search (assignment section 8).
 */

$pageTitle  = 'Stays';
$activePage = 'stays';
$pageScript = 'stays.js';
require __DIR__ . '/includes/header.php';
?>

      <h2>Find a hotel</h2>

      <?php if ($user === null): ?>

        <?= loginPrompt('search for hotels') ?>

      <?php else: ?>

        <p class="intro">
          Hotels in Texas and California,
          <?= DATE_MIN ?> through <?= DATE_MAX ?>.
        </p>

        <form id="hotelSearchForm" onsubmit="return false;">

          <label>City
            <input type="text" name="city" id="city"
                   list="cityList" placeholder="Dallas" autocomplete="off">
          </label>

          <datalist id="cityList">
            <?php foreach (all_cities() as $city): ?>
              <option value="<?= htmlspecialchars($city) ?>"></option>
            <?php endforeach; ?>
          </datalist>

          <div class="field-row">
            <label>Check in date
              <input type="date" name="checkInDate" id="checkInDate"
                     min="<?= DATE_MIN ?>" max="<?= DATE_MAX ?>">
            </label>

            <label>Check out date
              <input type="date" name="checkOutDate" id="checkOutDate"
                     min="<?= DATE_MIN ?>" max="<?= DATE_MAX ?>">
            </label>
          </div>

          <button type="button" class="pax-toggle" onclick="toggleGuestBox()">
            &#128100; Guests
          </button>
          <span class="pax-summary" id="guestSummary">1 adult</span>

          <div id="passengerBox" style="display:none;">
            <div class="field-row">
              <label>Adults
                <input type="number" name="adult" id="adult" value="1"
                       min="0" max="4" onchange="updateGuestSummary()">
              </label>

              <label>Children
                <input type="number" name="child" id="child" value="0"
                       min="0" max="4" onchange="updateGuestSummary()">
              </label>

              <label>Infants
                <input type="number" name="infant" id="infant" value="0"
                       min="0" max="4" onchange="updateGuestSummary()">
              </label>
            </div>
            <p class="saved-note">
              No more than 4 in any one category. Two guests to a room;
              infants stay with an adult and do not count towards that.
            </p>
          </div>

          <br>
          <button type="button" onclick="searchHotels()">Search hotels</button>
        </form>

        <div id="searchMessage"></div>
        <div id="searchSummary"></div>
        <div id="hotelResults"></div>

      <?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
