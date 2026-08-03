// ======================================================
// cart.js
// Reads whatever got saved into localStorage under "cartItems".
// stays.js, cars.js, and book.js all push into this SAME array, each
// entry tagged with a "type" field ("stay", "car", or "flight"), so this
// page just loops through it and renders each one differently depending
// on what type it is.
//
// Booking an item runs it past TravelData.checkAvailability first, then
// takes the seats / rooms / car out of inventory, so the same thing can
// never be booked twice.
// ======================================================

var passengerFormCounts = {}; // how many passenger forms are showing per flight cart index


// ----------------------------------------------------
// Small display helpers
// ----------------------------------------------------

function clearNode(id) {
  var node = document.getElementById(id);

  if (node) {
    node.innerHTML = "";
  }

  return node;
}

function showCartError(text) {
  var box = clearNode("cartMessage");

  var p = document.createElement("p");
  p.className = "error";
  p.appendChild(document.createTextNode(text));
  box.appendChild(p);

  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

function addDetailLine(card, label, value) {
  var p = document.createElement("p");
  p.appendChild(document.createTextNode(label + ": " + value));
  card.appendChild(p);
}

function guestSummary(item) {
  return item.adults + " adult(s), " + item.children + " child(ren), " + item.infants + " infant(s)";
}


// ----------------------------------------------------
// Main render
// ----------------------------------------------------

function renderAll() {
  renderCart();
  renderBookings();
  renderDataTools();
}

function renderCart() {

  var items = TravelData.getCart();
  var container = clearNode("cartContainer");

  var heading = document.createElement("h3");
  heading.appendChild(document.createTextNode("Items in Your Cart"));
  container.appendChild(heading);

  if (items.length === 0) {
    var empty = document.createElement("p");
    empty.appendChild(document.createTextNode(
      "Your cart is empty. Go add a stay, car, or flight from their pages."
    ));
    container.appendChild(empty);
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

function removeCartItem(index) {
  var items = TravelData.getCart();
  items.splice(index, 1);
  TravelData.saveCart(items);
  renderAll();
}

function addRemoveButton(card, index) {
  var removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn-ghost";
  removeBtn.appendChild(document.createTextNode("Remove"));

  removeBtn.onclick = function () {
    removeCartItem(index);
  };

  card.appendChild(removeBtn);
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
  addDetailLine(card, "Guests", guestSummary(item));
  addDetailLine(card, "Rooms", item.roomsNeeded);
  addDetailLine(card, "Price per night per room", "$" + item.pricePerNight);
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

  addRemoveButton(card, index);

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

  addRemoveButton(card, index);

  return card;
}

// stays and cars don't need passenger info, so booking them is a single
// step: check it is still available, take it out of inventory, give it a
// booking number, save it, then drop it from the cart
function bookSimpleItem(index, expectedType) {

  var items = TravelData.getCart();
  var item = items[index];

  clearNode("cartMessage");

  if (!item || item.type != expectedType) {
    showCartError("That item is no longer in your cart.");
    renderAll();
    return;
  }

  TravelData.checkAvailability(item)
    .then(function (result) {

      if (!result.ok) {
        showCartError(result.message);
        return null;
      }

      if (item.type == "stay") {
        return TravelData.bookHotelRooms(item.hotelId, item.roomsNeeded);
      }

      return TravelData.bookCar(item.carId);
    })
    .then(function (didBook) {

      if (didBook == null) {
        return;
      }

      var booking = {
        userId: TravelData.getUserId(),
        bookingNumber: TravelData.generateBookingNumber(),
        type: item.type,
        bookedAt: new Date().toISOString(),
        totalPrice: item.totalPrice,
        details: item
      };

      TravelData.addBooking(booking);

      var current = TravelData.getCart();
      current.splice(index, 1);
      TravelData.saveCart(current);

      renderAll();
      showConfirmation(booking);
    })
    .catch(function (error) {
      showCartError("Could not complete the booking: " + error.message);
    });
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

  var priceNote = document.createElement("p");
  priceNote.className = "saved-note";
  priceNote.appendChild(document.createTextNode(
    "Adults pay full fare, children 70%, infants 10%."
  ));
  card.appendChild(priceNote);

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

  addRemoveButton(card, index);

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

  var items = TravelData.getCart();
  var item = items[index];

  clearNode("cartMessage");

  if (!item || item.type != "flight") {
    showCartError("That flight is no longer in your cart.");
    renderAll();
    return;
  }

  var validation = validateFlightPassengers(index);

  if (validation.error) {
    showCartError(validation.error);
    return;
  }

  var totalPassengers = item.adults + item.children + item.infants;

  var legs = [item.departingFlight];
  if (item.tripType == "round" && item.returningFlight) {
    legs.push(item.returningFlight);
  }

  TravelData.checkAvailability(item)
    .then(function (result) {

      if (!result.ok) {
        showCartError(result.message);
        return false;
      }

      // take the seats out of inventory one leg at a time
      var chain = Promise.resolve();

      legs.forEach(function (leg) {
        chain = chain.then(function () {
          return TravelData.bookFlightSeats(leg.flightId, totalPassengers);
        });
      });

      return chain.then(function () {
        return true;
      });
    })
    .then(function (didBook) {

      if (!didBook) {
        return;
      }

      var booking = {
        userId: TravelData.getUserId(),
        bookingNumber: TravelData.generateBookingNumber(),
        type: "flight",
        bookedAt: new Date().toISOString(),
        tripType: item.tripType,
        totalPrice: item.totalPrice,
        adults: item.adults,
        children: item.children,
        infants: item.infants,
        flights: legs.map(function (f) {
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

      TravelData.addBooking(booking);

      var current = TravelData.getCart();
      current.splice(index, 1);
      TravelData.saveCart(current);

      delete passengerFormCounts[index];

      renderAll();
      showConfirmation(booking);
    })
    .catch(function (error) {
      showCartError("Could not complete the booking: " + error.message);
    });
}


// ----------------------------------------------------
// Booking confirmation + full booking details
// ----------------------------------------------------

function showConfirmation(booking) {

  var container = clearNode("confirmationContainer");

  var box = document.createElement("div");
  box.className = "result confirmation";

  var heading = document.createElement("h3");
  heading.appendChild(document.createTextNode("Booking Confirmed"));
  box.appendChild(heading);

  box.appendChild(buildBookingDetails(booking));
  container.appendChild(box);

  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

// used by both the confirmation panel and the My Bookings list, so the
// full set of fields the assignment asks for only has to be built once
function buildBookingDetails(booking) {

  var wrapper = document.createElement("div");

  addDetailLine(wrapper, "User ID", booking.userId);
  addDetailLine(wrapper, "Booking Number", booking.bookingNumber);

  if (booking.type == "flight") {
    buildFlightBookingDetails(wrapper, booking);
  } else if (booking.type == "stay") {
    buildStayBookingDetails(wrapper, booking.details);
  } else if (booking.type == "car") {
    buildCarBookingDetails(wrapper, booking.details);
  }

  addDetailLine(wrapper, "Total Price", "$" + booking.totalPrice);

  return wrapper;
}

function buildFlightBookingDetails(wrapper, booking) {

  addDetailLine(wrapper, "Type", booking.tripType == "round" ? "Round Trip Flight" : "One Way Flight");

  var i;

  for (i = 0; i < booking.flights.length; i++) {

    var flight = booking.flights[i];
    var label = booking.tripType == "round"
      ? (i === 0 ? "Departing Flight" : "Returning Flight")
      : "Flight";

    var legHeading = document.createElement("h4");
    legHeading.appendChild(document.createTextNode(label));
    wrapper.appendChild(legHeading);

    addDetailLine(wrapper, "Flight ID", flight.flightId);
    addDetailLine(wrapper, "Origin", flight.origin);
    addDetailLine(wrapper, "Destination", flight.destination);
    addDetailLine(wrapper, "Departure Date", flight.departureDate);
    addDetailLine(wrapper, "Arrival Date", flight.arrivalDate);
    addDetailLine(wrapper, "Departure Time", flight.departureTime);
    addDetailLine(wrapper, "Arrival Time", flight.arrivalTime);
  }

  var paxHeading = document.createElement("h4");
  paxHeading.appendChild(document.createTextNode("Passengers"));
  wrapper.appendChild(paxHeading);

  for (i = 0; i < booking.passengers.length; i++) {

    var passenger = booking.passengers[i];

    var paxBox = document.createElement("div");
    paxBox.className = "passenger-form";

    var paxLabel = document.createElement("p");
    paxLabel.appendChild(document.createTextNode("Passenger " + (i + 1)));
    paxBox.appendChild(paxLabel);

    addDetailLine(paxBox, "SSN", passenger.ssn);
    addDetailLine(paxBox, "First Name", passenger.firstName);
    addDetailLine(paxBox, "Last Name", passenger.lastName);
    addDetailLine(paxBox, "Date of Birth", passenger.dateOfBirth);

    wrapper.appendChild(paxBox);
  }
}

function buildStayBookingDetails(wrapper, details) {
  addDetailLine(wrapper, "Type", "Hotel Stay");
  addDetailLine(wrapper, "Hotel ID", details.hotelId);
  addDetailLine(wrapper, "Hotel Name", details.hotelName);
  addDetailLine(wrapper, "City", details.city);
  addDetailLine(wrapper, "Check-in Date", details.checkIn);
  addDetailLine(wrapper, "Check-out Date", details.checkOut);
  addDetailLine(wrapper, "Guests", guestSummary(details));
  addDetailLine(wrapper, "Number of Rooms", details.roomsNeeded);
  addDetailLine(wrapper, "Price per night per room", "$" + details.pricePerNight);
  addDetailLine(wrapper, "Nights", details.nights);
}

function buildCarBookingDetails(wrapper, details) {
  addDetailLine(wrapper, "Type", "Car Rental");
  addDetailLine(wrapper, "Car ID", details.carId);
  addDetailLine(wrapper, "City", details.city);
  addDetailLine(wrapper, "Car Type", details.carType);
  addDetailLine(wrapper, "Check-in Date", details.checkIn);
  addDetailLine(wrapper, "Check-out Date", details.checkOut);
  addDetailLine(wrapper, "Price per Day", "$" + details.pricePerDay);
  addDetailLine(wrapper, "Number of Days", details.numberOfDays);
}


// ----------------------------------------------------
// My Bookings
// ----------------------------------------------------

function renderBookings() {

  var container = clearNode("bookingsContainer");
  var bookings = TravelData.getBookings();

  var heading = document.createElement("h3");
  heading.appendChild(document.createTextNode("My Bookings (" + bookings.length + ")"));
  container.appendChild(heading);

  if (bookings.length === 0) {
    var none = document.createElement("p");
    none.appendChild(document.createTextNode("You have not booked anything yet."));
    container.appendChild(none);
    return;
  }

  for (var i = 0; i < bookings.length; i++) {

    var card = document.createElement("div");
    card.className = "hotel-card";

    var title = document.createElement("h4");
    title.appendChild(document.createTextNode(
      "Booking " + bookings[i].bookingNumber
    ));
    card.appendChild(title);

    card.appendChild(buildBookingDetails(bookings[i]));
    container.appendChild(card);
  }
}


// ----------------------------------------------------
// Data files
//
// The browser cannot write to flights.json / Hotels.xml / cars.xml
// directly, so these buttons regenerate them with the current
// availability in them, and write the bookings out to their own files.
// ----------------------------------------------------

function renderDataTools() {

  var container = clearNode("dataTools");

  var box = document.createElement("div");
  box.className = "result";

  var heading = document.createElement("h3");
  heading.appendChild(document.createTextNode("Data Files"));
  box.appendChild(heading);

  var note = document.createElement("p");
  note.className = "saved-note";
  note.appendChild(document.createTextNode(
    "Availability is updated live and kept across page loads. " +
    "Download a file to open it and see the updated seats, rooms and car availability."
  ));
  box.appendChild(note);

  addToolButton(box, "Download updated flights.json", function () {
    TravelData.updatedFlightsJson().then(function (text) {
      TravelData.downloadJson("flights.json", text);
    });
  });

  addToolButton(box, "Download updated Hotels.xml", function () {
    TravelData.updatedHotelsXml().then(function (text) {
      TravelData.downloadXml("Hotels.xml", text);
    });
  });

  addToolButton(box, "Download updated cars.xml", function () {
    TravelData.updatedCarsXml().then(function (text) {
      TravelData.downloadXml("cars.xml", text);
    });
  });

  addToolButton(box, "Download bookings.json", function () {
    TravelData.downloadJson("bookings.json", TravelData.bookingsJson());
  });

  addToolButton(box, "Download carBookings.xml", function () {
    TravelData.downloadXml("carBookings.xml", TravelData.carBookingsXml());
  });

  var reset = document.createElement("button");
  reset.type = "button";
  reset.className = "btn-ghost";
  reset.appendChild(document.createTextNode("Reset Demo Data"));
  reset.onclick = function () {
    if (confirm("Clear the cart, all bookings, and restore full availability?")) {
      TravelData.resetDemoData();
      clearNode("confirmationContainer");
      clearNode("cartMessage");
      renderAll();
    }
  };
  box.appendChild(reset);

  container.appendChild(box);
}

function addToolButton(box, label, handler) {
  var button = document.createElement("button");
  button.type = "button";
  button.className = "btn-select";
  button.appendChild(document.createTextNode(label));
  button.onclick = handler;
  box.appendChild(button);
}


// script.js already sets window.onload for the font-size/background
// controls, so don't overwrite that here. The script tags are at the
// bottom of the page, so the DOM is already ready by the time this runs.
renderAll();
