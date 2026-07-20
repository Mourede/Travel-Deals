// ======================================================
// cart.js
// Reads whatever got saved into localStorage under "cartItems".
// stays.js, cars.js, and book.js all push into this SAME array, each
// entry tagged with a "type" field ("stay", "car", or "flight"), so this
// page just loops through it and renders each one differently depending
// on what type it is.
// ======================================================

var passengerFormCounts = {}; // how many passenger forms are showing per flight cart index

function loadCartItems() {
  var existing = localStorage.getItem("cartItems");

  if (!existing) {
    return [];
  }

  return JSON.parse(existing);
}

function saveCartItems(items) {
  localStorage.setItem("cartItems", JSON.stringify(items));
}

function getUserId() {
  var userId = localStorage.getItem("userId");

  if (userId == null) {
    userId = "U" + Date.now();
    localStorage.setItem("userId", userId);
  }

  return userId;
}

function generateBookingNumber() {
  return "BK" + Date.now() + Math.floor(Math.random() * 1000);
}

function saveBooking(booking) {
  var bookings = JSON.parse(localStorage.getItem("bookings"));

  if (bookings == null) {
    bookings = [];
  }

  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));

  // also drop a real bookings.json download, same pattern contact.js
  // uses for contact-submissions.json
  var jsonText = JSON.stringify(bookings, null, 2);
  var blob = new Blob([jsonText], { type: "application/json" });
  var url = URL.createObjectURL(blob);

  var downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "bookings.json";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

// keeps the simulated seat count in sync the same way book.js already did
function updateFlightSeatCounts(flight, totalPassengers) {
  var saved = JSON.parse(localStorage.getItem("flightSeatCounts"));

  if (saved == null) {
    saved = {};
  }

  var currentSeats = saved[flight.flightId] != null ? saved[flight.flightId] : flight.availableSeats;
  saved[flight.flightId] = currentSeats - totalPassengers;

  localStorage.setItem("flightSeatCounts", JSON.stringify(saved));
}


// ----------------------------------------------------
// Main render
// ----------------------------------------------------

function renderCart() {

  var items = loadCartItems();
  var container = document.getElementById("cartContainer");
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = "<p>Your cart is empty. Go add a stay, car, or flight from their pages.</p>";
    return;
  }

  var grandTotal = 0;
  var i;

  for (i = 0; i < items.length; i++) {

    var item = items[i];
    grandTotal += parseFloat(item.totalPrice);

    if (item.type == "stay") {
      container.appendChild(buildStayCard(item, i));
    } else if (item.type == "car") {
      container.appendChild(buildCarCard(item, i));
    } else if (item.type == "flight") {
      container.appendChild(buildFlightCard(item, i));
    }
  }

  var totalBox = document.createElement("div");
  totalBox.className = "result";
  var totalHeading = document.createElement("h3");
  totalHeading.appendChild(document.createTextNode("Cart Total: $" + grandTotal.toFixed(2)));
  totalBox.appendChild(totalHeading);
  container.appendChild(totalBox);
}

function addDetailLine(card, label, value) {
  var p = document.createElement("p");
  p.appendChild(document.createTextNode(label + ": " + value));
  card.appendChild(p);
}

function removeCartItem(index) {
  var items = loadCartItems();
  items.splice(index, 1);
  saveCartItems(items);
  renderCart();
}


// ----------------------------------------------------
// Stay cards
// ----------------------------------------------------

function buildStayCard(item, index) {

  var card = document.createElement("div");
  card.className = "hotel-card";

  var title = document.createElement("h4");
  title.appendChild(document.createTextNode(item.hotelName + " (" + item.hotelId + ")"));
  card.appendChild(title);

  addDetailLine(card, "City", item.city);
  addDetailLine(card, "Check-in", item.checkIn);
  addDetailLine(card, "Check-out", item.checkOut);
  addDetailLine(card, "Guests", item.adults + " adult(s), " + item.children + " child(ren), " + item.infants + " infant(s)");
  addDetailLine(card, "Rooms", item.roomsNeeded);
  addDetailLine(card, "Price per night", "$" + item.pricePerNight);
  addDetailLine(card, "Nights", item.nights);
  addDetailLine(card, "Item Total", "$" + item.totalPrice);

  var bookBtn = document.createElement("button");
  bookBtn.type = "button";
  bookBtn.className = "btn-select";
  bookBtn.appendChild(document.createTextNode("Book This Stay"));
  bookBtn.onclick = function () {
    bookSimpleItem(index, "stay");
  };
  card.appendChild(bookBtn);

  var removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn-ghost";
  removeBtn.appendChild(document.createTextNode("Remove"));
  removeBtn.onclick = function () {
    removeCartItem(index);
  };
  card.appendChild(removeBtn);

  return card;
}


// ----------------------------------------------------
// Car cards
// ----------------------------------------------------

function buildCarCard(item, index) {

  var card = document.createElement("div");
  card.className = "hotel-card";

  var title = document.createElement("h4");
  title.appendChild(document.createTextNode(item.carType + " (" + item.carId + ")"));
  card.appendChild(title);

  addDetailLine(card, "City", item.city);
  addDetailLine(card, "Check-in", item.checkIn);
  addDetailLine(card, "Check-out", item.checkOut);
  addDetailLine(card, "Price per day", "$" + item.pricePerDay);
  addDetailLine(card, "Days", item.numberOfDays);
  addDetailLine(card, "Item Total", "$" + item.totalPrice);

  var bookBtn = document.createElement("button");
  bookBtn.type = "button";
  bookBtn.className = "btn-select";
  bookBtn.appendChild(document.createTextNode("Book This Car"));
  bookBtn.onclick = function () {
    bookSimpleItem(index, "car");
  };
  card.appendChild(bookBtn);

  var removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn-ghost";
  removeBtn.appendChild(document.createTextNode("Remove"));
  removeBtn.onclick = function () {
    removeCartItem(index);
  };
  card.appendChild(removeBtn);

  return card;
}

// stays and cars don't need passenger info, so booking them is a single
// step: give it a booking number, save it, remove it from the cart
function bookSimpleItem(index, expectedType) {

  var items = loadCartItems();
  var item = items[index];

  if (!item || item.type != expectedType) {
    alert("That item is no longer in your cart.");
    renderCart();
    return;
  }

  var booking = {
    userId: getUserId(),
    bookingNumber: generateBookingNumber(),
    type: item.type,
    details: item
  };

  saveBooking(booking);

  items.splice(index, 1);
  saveCartItems(items);
  renderCart();

  alert("Booked! Booking number: " + booking.bookingNumber + "\nSaved to bookings.json");
}


// ----------------------------------------------------
// Flight cards (these need passenger info first)
// ----------------------------------------------------

function flightLegHtml(flight, label) {
  return (
    "<p><strong>" + label + " Flight ID:</strong> " + flight.flightId + "</p>" +
    "<p><strong>Origin:</strong> " + flight.origin + "</p>" +
    "<p><strong>Destination:</strong> " + flight.destination + "</p>" +
    "<p><strong>Departure Date:</strong> " + flight.departureDate + "</p>" +
    "<p><strong>Arrival Date:</strong> " + flight.arrivalDate + "</p>" +
    "<p><strong>Departure Time:</strong> " + flight.departureTime + "</p>" +
    "<p><strong>Arrival Time:</strong> " + flight.arrivalTime + "</p>"
  );
}

function buildFlightCard(item, index) {

  var card = document.createElement("div");
  card.className = "hotel-card";

  var title = document.createElement("h4");
  title.appendChild(document.createTextNode(
    (item.tripType == "round" ? "Round Trip" : "One Way") + " Flight"
  ));
  card.appendChild(title);

  var legsHtml = flightLegHtml(item.departingFlight, "Departing");
  if (item.tripType == "round" && item.returningFlight) {
    legsHtml += flightLegHtml(item.returningFlight, "Returning");
  }
  legsHtml += "<p><strong>Adults:</strong> " + item.adults + "</p>";
  legsHtml += "<p><strong>Children:</strong> " + item.children + "</p>";
  legsHtml += "<p><strong>Infants:</strong> " + item.infants + "</p>";
  legsHtml += "<p><strong>Item Total:</strong> $" + item.totalPrice + "</p>";

  var legsDiv = document.createElement("div");
  legsDiv.innerHTML = legsHtml;
  card.appendChild(legsDiv);

  // passenger forms: one per adult, child, and infant
  var formsDiv = document.createElement("div");
  formsDiv.id = "passengerForms_" + index;
  formsDiv.innerHTML = buildPassengerFormsHtml(item, index);
  card.appendChild(formsDiv);

  var bookBtn = document.createElement("button");
  bookBtn.type = "button";
  bookBtn.className = "btn-select";
  bookBtn.appendChild(document.createTextNode("Book This Flight"));
  bookBtn.onclick = function () {
    bookFlightItem(index);
  };
  card.appendChild(bookBtn);

  var removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn-ghost";
  removeBtn.appendChild(document.createTextNode("Remove"));
  removeBtn.onclick = function () {
    removeCartItem(index);
  };
  card.appendChild(removeBtn);

  return card;
}

function buildPassengerFormsHtml(item, cartIndex) {

  var html = "<h4>Passenger Information</h4>";
  var formIndex = 0;
  var a, c, inf;

  for (a = 1; a <= item.adults; a++) {
    html += passengerFormHtml(cartIndex, formIndex, "Adult " + a);
    formIndex++;
  }
  for (c = 1; c <= item.children; c++) {
    html += passengerFormHtml(cartIndex, formIndex, "Child " + c);
    formIndex++;
  }
  for (inf = 1; inf <= item.infants; inf++) {
    html += passengerFormHtml(cartIndex, formIndex, "Infant " + inf);
    formIndex++;
  }

  passengerFormCounts[cartIndex] = formIndex;

  return html;
}

function passengerFormHtml(cartIndex, formIndex, label) {
  var prefix = "p_" + cartIndex + "_" + formIndex;

  return (
    "<div class='passenger-form'>" +
    "<p><strong>" + label + "</strong></p>" +
    "<label>First Name<input type='text' id='" + prefix + "_firstName'></label>" +
    "<label>Last Name<input type='text' id='" + prefix + "_lastName'></label>" +
    "<label>Date of Birth<input type='date' id='" + prefix + "_dob'></label>" +
    "<label>SSN (9 digits)<input type='text' id='" + prefix + "_ssn' maxlength='9'></label>" +
    "</div>"
  );
}

function validateFlightPassengers(cartIndex) {

  var passengers = [];
  var ssnRegex = /^\d{9}$/;
  var count = passengerFormCounts[cartIndex] || 0;
  var i;

  for (i = 0; i < count; i++) {

    var prefix = "p_" + cartIndex + "_" + i;
    var firstName = document.getElementById(prefix + "_firstName").value.trim();
    var lastName = document.getElementById(prefix + "_lastName").value.trim();
    var dob = document.getElementById(prefix + "_dob").value;
    var ssn = document.getElementById(prefix + "_ssn").value.trim();

    if (firstName == "" || lastName == "" || dob == "" || ssn == "") {
      return { error: "Please fill in all fields for every passenger." };
    }

    if (!ssnRegex.test(ssn)) {
      return { error: "SSN must be exactly 9 digits (passenger " + (i + 1) + ")." };
    }

    if (new Date(dob) > new Date()) {
      return { error: "Date of birth cannot be in the future (passenger " + (i + 1) + ")." };
    }

    passengers.push({
      ssn: ssn,
      firstName: firstName,
      lastName: lastName,
      dateOfBirth: dob
    });
  }

  return { passengers: passengers };
}

function bookFlightItem(index) {

  var items = loadCartItems();
  var item = items[index];

  if (!item || item.type != "flight") {
    alert("That flight is no longer in your cart.");
    renderCart();
    return;
  }

  var validation = validateFlightPassengers(index);

  if (validation.error) {
    alert(validation.error);
    return;
  }

  var totalPassengers = item.adults + item.children + item.infants;

  updateFlightSeatCounts(item.departingFlight, totalPassengers);
  if (item.tripType == "round" && item.returningFlight) {
    updateFlightSeatCounts(item.returningFlight, totalPassengers);
  }

  var flightsBooked = [item.departingFlight];
  if (item.tripType == "round" && item.returningFlight) {
    flightsBooked.push(item.returningFlight);
  }

  var booking = {
    userId: getUserId(),
    bookingNumber: generateBookingNumber(),
    type: "flight",
    tripType: item.tripType,
    totalPrice: item.totalPrice,
    flights: flightsBooked.map(function (f) {
      return {
        flightId: f.flightId,
        origin: f.origin,
        destination: f.destination,
        departureDate: f.departureDate,
        arrivalDate: f.arrivalDate,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime
      };
    }),
    passengers: validation.passengers
  };

  saveBooking(booking);

  items.splice(index, 1);
  saveCartItems(items);
  delete passengerFormCounts[index];
  renderCart();

  alert("Booked! Booking number: " + booking.bookingNumber + "\nSaved to bookings.json");
}


// script.js already sets window.onload for the font-size/background
// controls, so don't overwrite that here. The script tags are at the
// bottom of the page, so the DOM is already ready by the time this runs.
renderCart();