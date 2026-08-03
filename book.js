// ======================================================
// book.js
// Flight search. City list, date window and flight loading all come from
// data.js, so seat counts here already reflect anything booked earlier.
// ======================================================

var selectedDepartingFlight = null;
var selectedReturningFlight = null;

// the last search, kept so selecting a flight does not have to refetch
var lastSearch = null;


// ----------------------------------------------------
// Trip type
// ----------------------------------------------------

function changeTrip() {

  var tripType = document.getElementById("tripType").value;

  if (tripType == "round") {
    document.getElementById("returnDiv").style.display = "block";
  } else {
    document.getElementById("returnDiv").style.display = "none";
  }
}


// ----------------------------------------------------
// Passenger popup
// ----------------------------------------------------

function togglePassengers() {

  var box = document.getElementById("passengerBox");

  if (box.style.display == "block") {
    box.style.display = "none";
  } else {
    box.style.display = "block";
  }
}


// ----------------------------------------------------
// Finding flights
// ----------------------------------------------------

// looks for flights on the requested date first. If there are none, falls
// back to anything within 3 days either side, and reports which of the two
// happened so the page can say so.
function findAvailableFlights(flights, origin, destination, requestedDate, totalPassengers) {

  var exact = [];
  var nearby = [];
  var i;

  for (i = 0; i < flights.length; i++) {

    var f = flights[i];

    if (f.origin.toLowerCase() != origin || f.destination.toLowerCase() != destination) {
      continue;
    }

    if (f.availableSeats < totalPassengers) {
      continue;
    }

    if (f.departureDate == requestedDate) {
      exact.push(f);
    } else if (TravelData.daysBetween(f.departureDate, requestedDate) <= 3) {
      nearby.push(f);
    }
  }

  if (exact.length > 0) {
    return { flights: exact, isExactDate: true };
  }

  return { flights: nearby, isExactDate: false };
}


// ----------------------------------------------------
// Search
// ----------------------------------------------------

function searchFlight() {

  var message = document.getElementById("message");
  var results = document.getElementById("flightResults");

  message.innerHTML = "";
  results.innerHTML = "";

  selectedDepartingFlight = null;
  selectedReturningFlight = null;

  var tripType = document.getElementById("tripType").value;
  var originInput = document.getElementById("origin").value.trim();
  var destinationInput = document.getElementById("destination").value.trim();

  var origin = originInput.toLowerCase();
  var destination = destinationInput.toLowerCase();

  var departDate = document.getElementById("departDate").value;
  var returnDate = document.getElementById("returnDate").value;

  var adults = parseInt(document.getElementById("adults").value, 10);
  var children = parseInt(document.getElementById("children").value, 10);
  var infants = parseInt(document.getElementById("infants").value, 10);

  if (
    isNaN(adults) || adults < 0 || adults > 4 ||
    isNaN(children) || children < 0 || children > 4 ||
    isNaN(infants) || infants < 0 || infants > 4
  ) {
    message.innerHTML =
      "<p class='error'>Each passenger category must be between 0 and 4.</p>";
    return;
  }

  if (adults + children + infants == 0) {
    message.innerHTML = "<p class='error'>At least one passenger is required.</p>";
    return;
  }

  if (!TravelData.isValidCity(originInput) || !TravelData.isValidCity(destinationInput)) {
    message.innerHTML =
      "<p class='error'>Origin and destination must be Texas or California cities.</p>";
    return;
  }

  if (origin == destination) {
    message.innerHTML =
      "<p class='error'>Origin and destination cannot be identical.</p>";
    return;
  }

  if (departDate == "" || !TravelData.dateInRange(departDate)) {
    message.innerHTML =
      "<p class='error'>Departure date must be between September 1 and December 1, 2024.</p>";
    return;
  }

  if (tripType == "round") {

    if (returnDate == "" || !TravelData.dateInRange(returnDate)) {
      message.innerHTML =
        "<p class='error'>Return date must be between September 1 and December 1, 2024.</p>";
      return;
    }

    if (new Date(returnDate) < new Date(departDate)) {
      message.innerHTML =
        "<p class='error'>Return date cannot be before departure date.</p>";
      return;
    }
  }

  // echo back everything the user entered
  var summary =
    "<div class='result'>" +
    "<h3>Flight Search</h3>" +
    "<p><b>Trip:</b> " + (tripType == "oneway" ? "One Way" : "Round Trip") + "</p>" +
    "<p><b>Origin:</b> " + TravelData.formatWords(origin) + "</p>" +
    "<p><b>Destination:</b> " + TravelData.formatWords(destination) + "</p>" +
    "<p><b>Departure:</b> " + departDate + "</p>";

  if (tripType == "round") {
    summary += "<p><b>Return:</b> " + returnDate + "</p>";
  }

  summary +=
    "<p><b>Adults:</b> " + adults + "</p>" +
    "<p><b>Children:</b> " + children + "</p>" +
    "<p><b>Infants:</b> " + infants + "</p>" +
    "</div>";

  message.innerHTML = summary;

  var totalPassengers = adults + children + infants;

  TravelData.getFlights()
    .then(function (flights) {

      var departing = findAvailableFlights(
        flights, origin, destination, departDate, totalPassengers
      );

      lastSearch = {
        tripType: tripType,
        adults: adults,
        children: children,
        infants: infants,
        departing: departing.flights,
        returning: []
      };

      displayFlights(departing, "Departing Flights", "departing", departDate);

      if (tripType == "round") {

        var returning = findAvailableFlights(
          flights, destination, origin, returnDate, totalPassengers
        );

        lastSearch.returning = returning.flights;

        displayFlights(returning, "Returning Flights", "returning", returnDate);
      }

      addSelectionArea();
    })
    .catch(function (error) {
      results.innerHTML = "<p class='error'>" + error.message + "</p>";
    });
}


// ----------------------------------------------------
// Pricing
// ----------------------------------------------------

// full price for adults, 70% for children, 10% for infants
function legTotal(flight, adults, children, infants) {
  var adultPrice = flight.price;
  var childPrice = flight.price * 0.7;
  var infantPrice = flight.price * 0.1;

  return (adults * adultPrice) + (children * childPrice) + (infants * infantPrice);
}


// ----------------------------------------------------
// Rendering results
// ----------------------------------------------------

function displayFlights(searchResult, heading, type, requestedDate) {

  var results = document.getElementById("flightResults");
  var flights = searchResult.flights;

  var block = document.createElement("div");
  block.className = "result";

  var title = document.createElement("h3");
  title.appendChild(document.createTextNode(heading));
  block.appendChild(title);

  if (flights.length === 0) {

    var none = document.createElement("p");
    none.appendChild(document.createTextNode(
      "No available flights on " + requestedDate +
      ", or within 3 days either side, with enough seats for this many passengers."
    ));
    block.appendChild(none);

    results.appendChild(block);
    return;
  }

  if (!searchResult.isExactDate) {
    var note = document.createElement("p");
    note.className = "saved-note";
    note.appendChild(document.createTextNode(
      "No flights on " + requestedDate +
      ", so these are the available flights within 3 days before and after."
    ));
    block.appendChild(note);
  }

  for (var i = 0; i < flights.length; i++) {
    block.appendChild(buildFlightCard(flights[i], type));
  }

  results.appendChild(block);
}

function buildFlightCard(flight, type) {

  var card = document.createElement("div");
  card.className = "hotel-card";
  card.id = "flightCard_" + type + "_" + flight.flightId;

  var heading = document.createElement("h4");
  heading.appendChild(document.createTextNode(
    flight.flightId + ": " + flight.origin + " to " + flight.destination
  ));
  card.appendChild(heading);

  addFlightLine(card, "Flight ID", flight.flightId);
  addFlightLine(card, "Origin", flight.origin);
  addFlightLine(card, "Destination", flight.destination);
  addFlightLine(card, "Departure Date", flight.departureDate);
  addFlightLine(card, "Arrival Date", flight.arrivalDate);
  addFlightLine(card, "Departure Time", flight.departureTime);
  addFlightLine(card, "Arrival Time", flight.arrivalTime);
  addFlightLine(card, "Available Seats", flight.availableSeats);
  addFlightLine(card, "Price per adult ticket", "$" + flight.price.toFixed(2));

  var legPrice = legTotal(flight, lastSearch.adults, lastSearch.children, lastSearch.infants);

  addFlightLine(
    card,
    "Total for this flight",
    "$" + legPrice.toFixed(2) +
    " (" + lastSearch.adults + " adult(s), " + lastSearch.children +
    " child(ren), " + lastSearch.infants + " infant(s))"
  );

  var button = document.createElement("button");
  button.type = "button";
  button.className = "btn-select";
  button.appendChild(document.createTextNode(
    type == "departing" ? "Select as Departing Flight" : "Select as Returning Flight"
  ));

  button.onclick = function () {
    selectFlight(flight.flightId, type);
  };

  card.appendChild(button);

  return card;
}

function addFlightLine(card, label, value) {
  var p = document.createElement("p");

  var strong = document.createElement("strong");
  strong.appendChild(document.createTextNode(label + ": "));

  p.appendChild(strong);
  p.appendChild(document.createTextNode(value));

  card.appendChild(p);
}


// ----------------------------------------------------
// Selecting flights
// ----------------------------------------------------

function addSelectionArea() {

  var results = document.getElementById("flightResults");

  var area = document.createElement("div");
  area.className = "result";
  area.id = "selectionArea";

  var heading = document.createElement("h3");
  heading.appendChild(document.createTextNode("Your Selection"));
  area.appendChild(heading);

  var summary = document.createElement("div");
  summary.id = "selectionSummary";
  area.appendChild(summary);

  var proceed = document.createElement("button");
  proceed.type = "button";
  proceed.className = "btn-select";
  proceed.appendChild(document.createTextNode("Add to Cart and Go to Cart"));
  proceed.onclick = goToCart;
  area.appendChild(proceed);

  results.appendChild(area);

  updateSelectionSummary();
}

function selectFlight(flightId, type) {

  var pool = type == "departing" ? lastSearch.departing : lastSearch.returning;
  var flight = null;

  for (var i = 0; i < pool.length; i++) {
    if (pool[i].flightId == flightId) {
      flight = pool[i];
      break;
    }
  }

  if (flight == null) {
    return;
  }

  if (type == "departing") {
    selectedDepartingFlight = flight;
  } else {
    selectedReturningFlight = flight;
  }

  highlightSelectedCards();
  updateSelectionSummary();
}

// only one card per direction should look selected at a time
function highlightSelectedCards() {

  var cards = document.getElementsByClassName("hotel-card");

  for (var i = 0; i < cards.length; i++) {
    cards[i].classList.remove("selected-card");
  }

  if (selectedDepartingFlight != null) {
    markSelected("departing", selectedDepartingFlight.flightId);
  }

  if (selectedReturningFlight != null) {
    markSelected("returning", selectedReturningFlight.flightId);
  }
}

function markSelected(type, flightId) {
  var card = document.getElementById("flightCard_" + type + "_" + flightId);

  if (card) {
    card.classList.add("selected-card");
  }
}

function updateSelectionSummary() {

  var summary = document.getElementById("selectionSummary");

  if (!summary) {
    return;
  }

  summary.innerHTML = "";

  addSelectionLine(
    summary,
    "Departing flight",
    selectedDepartingFlight == null
      ? "not selected yet"
      : describeFlight(selectedDepartingFlight)
  );

  if (lastSearch.tripType == "round") {
    addSelectionLine(
      summary,
      "Returning flight",
      selectedReturningFlight == null
        ? "not selected yet"
        : describeFlight(selectedReturningFlight)
    );
  }

  var total = 0;

  if (selectedDepartingFlight != null) {
    total += legTotal(
      selectedDepartingFlight, lastSearch.adults, lastSearch.children, lastSearch.infants
    );
  }

  if (lastSearch.tripType == "round" && selectedReturningFlight != null) {
    total += legTotal(
      selectedReturningFlight, lastSearch.adults, lastSearch.children, lastSearch.infants
    );
  }

  addSelectionLine(summary, "Total price for all passengers", "$" + total.toFixed(2));
}

function addSelectionLine(summary, label, value) {
  var p = document.createElement("p");

  var strong = document.createElement("strong");
  strong.appendChild(document.createTextNode(label + ": "));

  p.appendChild(strong);
  p.appendChild(document.createTextNode(value));

  summary.appendChild(p);
}

function describeFlight(flight) {
  return (
    flight.flightId + " (" + flight.origin + " to " + flight.destination +
    ", departs " + flight.departureDate + " at " + flight.departureTime + ")"
  );
}


// ----------------------------------------------------
// Into the cart
// ----------------------------------------------------

function goToCart() {

  if (lastSearch == null) {
    return;
  }

  if (selectedDepartingFlight == null) {
    alert("Please select a departing flight.");
    return;
  }

  if (lastSearch.tripType == "round" && selectedReturningFlight == null) {
    alert("Please select a returning flight.");
    return;
  }

  var adults = lastSearch.adults;
  var children = lastSearch.children;
  var infants = lastSearch.infants;

  var total = legTotal(selectedDepartingFlight, adults, children, infants);

  if (lastSearch.tripType == "round" && selectedReturningFlight != null) {
    total += legTotal(selectedReturningFlight, adults, children, infants);
  }

  // goes into the SAME "cartItems" array that stays.js and cars.js use,
  // tagged with type "flight" so the cart page can tell them apart
  TravelData.addToCart({
    type: "flight",
    tripType: lastSearch.tripType,
    departingFlight: selectedDepartingFlight,
    returningFlight: lastSearch.tripType == "round" ? selectedReturningFlight : null,
    adults: adults,
    children: children,
    infants: infants,
    totalPrice: total.toFixed(2)
  });

  window.location.href = "cart.html";
}
