<?php
/**
 * Flight search (assignment section 7).
 *
 * The form only collects input. Validation and the search itself happen in
 * api/search_flights.php so they cannot be bypassed from the browser.
 */

$pageTitle  = 'Flights';
$activePage = 'flights';
$pageScript = 'flights.js';
require __DIR__ . '/includes/header.php';
?>

      <h2>Find a flight</h2>

      <?php if ($user === null): ?>

        <?= loginPrompt('search for flights') ?>

      <?php else: ?>

        <p class="intro">
          Flights between Texas and California,
          <?= DATE_MIN ?> through <?= DATE_MAX ?>.
        </p>

        <form id="flightSearchForm" onsubmit="return false;">

          <div class="trip-type">
            <strong>Trip type</strong><br>
            <label>
              <input type="radio" name="tripType" value="oneway" checked
                     onchange="onTripTypeChange()">
              One way trip
            </label>
            <label>
              <input type="radio" name="tripType" value="round"
                     onchange="onTripTypeChange()">
              Round trip
            </label>
          </div>

          <div class="field-row">
            <label>Origin
              <input type="text" name="origin" id="origin"
                     list="cityList" placeholder="Dallas" autocomplete="off">
            </label>

            <label>Destination
              <input type="text" name="destination" id="destination"
                     list="cityList" placeholder="Los Angeles" autocomplete="off">
            </label>
          </div>

          <datalist id="cityList">
            <?php foreach (all_cities() as $city): ?>
              <option value="<?= htmlspecialchars($city) ?>"></option>
            <?php endforeach; ?>
          </datalist>

          <div class="field-row">
            <label>Departure date
              <input type="date" name="departureDate" id="departureDate"
                     min="<?= DATE_MIN ?>" max="<?= DATE_MAX ?>">
            </label>

            <label id="returnDateField" style="display:none;">Return date
              <input type="date" name="returnDate" id="returnDate"
                     min="<?= DATE_MIN ?>" max="<?= DATE_MAX ?>">
            </label>
          </div>

          <!-- The passenger icon section 7 asks for: clicking it opens the
               form with a count for each category. -->
          <button type="button" class="pax-toggle" onclick="togglePassengerBox()">
            &#128100; Passengers
          </button>
          <span class="pax-summary" id="paxSummary">1 adult</span>

          <div id="passengerBox" style="display:none;">
            <div class="field-row">
              <label>Adults
                <input type="number" name="adult" id="adult" value="1"
                       min="0" max="4" onchange="updatePaxSummary()">
              </label>

              <label>Children
                <input type="number" name="child" id="child" value="0"
                       min="0" max="4" onchange="updatePaxSummary()">
              </label>

              <label>Infants
                <input type="number" name="infant" id="infant" value="0"
                       min="0" max="4" onchange="updatePaxSummary()">
              </label>
            </div>
            <p class="saved-note">No more than 4 in any one category.</p>
          </div>

          <br>
          <button type="button" onclick="searchFlights()">Search flights</button>
        </form>

        <div id="searchMessage"></div>
        <div id="searchSummary"></div>
        <div id="flightResults"></div>

      <?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
