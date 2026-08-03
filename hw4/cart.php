<?php
/**
 * The cart (assignment sections 7 and 8).
 *
 * Shows what was selected, the total for the whole group, and the traveller
 * form that has to be filled in before booking. The cart lives in the
 * session, so it is rendered here in PHP; only the booking itself and the
 * confirmation go through Ajax.
 */

$pageTitle  = 'Cart';
$activePage = 'cart';
$pageScript = 'cart.js';
require __DIR__ . '/includes/header.php';
require_once __DIR__ . '/config/travel.php';

$cartFlight = cartGet('flight');
$cartHotel  = cartGet('hotel');

/**
 * The traveller form: one block per person, in the order the booking
 * endpoints expect (all adults, then children, then infants).
 */
function travellerForm(string $formId, array $counts, string $noun): void
{
    $index = 0;
    ?>
    <div class="passenger-form">
      <p><strong><?= ucfirst($noun) ?> details</strong></p>
      <p class="saved-note">
        Every <?= $noun ?> needs a first name, last name, date of birth and SSN.
      </p>

      <form id="<?= $formId ?>" onsubmit="return false;">
        <?php foreach ($counts as $category => $count): ?>
          <?php for ($i = 0; $i < $count; $i++): $index++; ?>
            <p><strong><?= ucfirst($noun) ?> <?= $index ?></strong>
              (<?= CATEGORY_LABELS_SINGULAR[$category] ?>)</p>

            <div class="field-row">
              <label>First name
                <input type="text" name="firstName[]" required>
              </label>

              <label>Last name
                <input type="text" name="lastName[]" required>
              </label>
            </div>

            <div class="field-row">
              <label>Date of birth
                <input type="date" name="dob[]" required>
              </label>

              <label>SSN
                <input type="text" name="ssn[]" placeholder="123-45-6789"
                       pattern="\d{3}-\d{2}-\d{4}" required>
              </label>
            </div>
          <?php endfor; ?>
        <?php endforeach; ?>
      </form>
    </div>
    <?php
}
?>

      <h2>Your cart</h2>

      <?php if ($user === null): ?>

        <?= loginPrompt('use the cart') ?>

      <?php elseif ($cartFlight === null && $cartHotel === null): ?>

        <p class="intro">
          Your cart is empty. Search for
          <a href="flights.php">flights</a> or
          <a href="stays.php">stays</a> to get started.
        </p>

      <?php else: ?>

        <?php if ($cartFlight !== null): ?>
          <?php
          $counts = $cartFlight['counts'];
          $legs   = [['label' => 'Departing flight', 'flight' => $cartFlight['departing']]];

          if ($cartFlight['tripType'] === 'round') {
              $legs[] = ['label' => 'Returning flight', 'flight' => $cartFlight['returning']];
          }

          $grandTotal = 0.0;
          ?>

          <div class="hotel-list">
            <h3><?= $cartFlight['tripType'] === 'round' ? 'Round trip' : 'One way trip' ?></h3>

            <?php foreach ($legs as $leg): ?>
              <?php
              $flight = $leg['flight'];

              if ($flight === null) {
                  continue;
              }

              $adultFare = (float) $flight['price'];
              $legTotal  = leg_total($adultFare, $counts);
              $grandTotal += $legTotal;
              ?>

              <div class="hotel-card">
                <h4><?= $leg['label'] ?>: <?= htmlspecialchars($flight['flight_id']) ?></h4>

                <p><strong>Flight id:</strong> <?= htmlspecialchars($flight['flight_id']) ?></p>
                <p><strong>Origin:</strong> <?= htmlspecialchars($flight['origin']) ?></p>
                <p><strong>Destination:</strong> <?= htmlspecialchars($flight['destination']) ?></p>
                <p><strong>Departure date:</strong> <?= htmlspecialchars($flight['departure_date']) ?></p>
                <p><strong>Arrival date:</strong> <?= htmlspecialchars($flight['arrival_date']) ?></p>
                <p><strong>Departure time:</strong> <?= htmlspecialchars($flight['departure_time']) ?></p>
                <p><strong>Arrival time:</strong> <?= htmlspecialchars($flight['arrival_time']) ?></p>

                <p><strong>Fares:</strong>
                  <?php
                  $fareParts = [];
                  foreach ($counts as $category => $count) {
                      if ($count > 0) {
                          $fareParts[] = $count . ' &times; '
                              . strtolower(CATEGORY_LABELS[$category]) . ' at $'
                              . number_format(ticket_price($adultFare, $category), 2);
                      }
                  }
                  echo implode(', ', $fareParts);
                  ?>
                </p>

                <p><strong>Total for this flight:</strong>
                  $<?= number_format($legTotal, 2) ?></p>
              </div>
            <?php endforeach; ?>

            <?php if ($cartFlight['tripType'] === 'round' && $cartFlight['returning'] === null): ?>
              <div class="error">
                Only the departing flight is selected. Go back to
                <a href="flights.php">flights</a> and pick a returning flight.
              </div>
            <?php else: ?>
              <div class="result">
                <p><strong>Passengers:</strong>
                  <?= htmlspecialchars(describe_passengers($counts)) ?></p>
                <p><strong>Total price for all passengers:</strong>
                  $<?= number_format($grandTotal, 2) ?></p>
                <p class="saved-note">
                  A child's ticket is 70% of the adult fare and an infant's is 10%.
                </p>
              </div>

              <?php travellerForm('flightPassengerForm', $counts, 'passenger'); ?>

              <button onclick="bookFlight()">Book <?=
                $cartFlight['tripType'] === 'round' ? 'both flights' : 'this flight' ?></button>
              <button class="btn-ghost" onclick="removeFromCart('flight')">Remove</button>
            <?php endif; ?>
          </div>
        <?php endif; ?>

        <?php if ($cartHotel !== null): ?>
          <?php $hotel = $cartHotel['hotel']; ?>

          <div class="hotel-list">
            <h3>Hotel stay</h3>

            <div class="hotel-card">
              <h4><?= htmlspecialchars($hotel['hotel_name']) ?></h4>

              <p><strong>Hotel id:</strong> <?= htmlspecialchars($hotel['hotel_id']) ?></p>
              <p><strong>Hotel name:</strong> <?= htmlspecialchars($hotel['hotel_name']) ?></p>
              <p><strong>City:</strong> <?= htmlspecialchars($hotel['city']) ?></p>
              <p><strong>Guests:</strong>
                <?= htmlspecialchars(describe_passengers($cartHotel['counts'])) ?></p>
              <p><strong>Number of rooms:</strong> <?= (int) $cartHotel['rooms'] ?></p>
              <p><strong>Check in date:</strong>
                <?= htmlspecialchars($cartHotel['checkInDate']) ?></p>
              <p><strong>Check out date:</strong>
                <?= htmlspecialchars($cartHotel['checkOutDate']) ?></p>
              <p><strong>Nights:</strong> <?= (int) $cartHotel['nights'] ?></p>
              <p><strong>Price per night for each room:</strong>
                $<?= number_format((float) $hotel['price_per_night'], 2) ?></p>
              <p><strong>Total price:</strong>
                $<?= number_format((float) $cartHotel['totalPrice'], 2) ?></p>
              <p class="saved-note">
                <?= (int) $cartHotel['rooms'] ?> room<?= $cartHotel['rooms'] === 1 ? '' : 's' ?>
                &times; <?= (int) $cartHotel['nights'] ?>
                night<?= $cartHotel['nights'] === 1 ? '' : 's' ?>
                &times; $<?= number_format((float) $hotel['price_per_night'], 2) ?>.
                Two guests to a room; infants stay with an adult.
              </p>
            </div>

            <?php travellerForm('hotelGuestForm', $cartHotel['counts'], 'guest'); ?>

            <button onclick="bookHotel()">Book this hotel</button>
            <button class="btn-ghost" onclick="removeFromCart('hotel')">Remove</button>
          </div>
        <?php endif; ?>

      <?php endif; ?>

      <div id="bookingMessage"></div>
      <div id="confirmation"></div>

<?php require __DIR__ . '/includes/footer.php'; ?>
