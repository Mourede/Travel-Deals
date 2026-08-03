// ======================================================
// cars.js
// The assignment says this page must be built with DOM methods, so
// everything here is createElement / createTextNode / appendChild rather
// than innerHTML or jQuery.
//
// As well as the normal search, this page suggests cars based on what the
// user has booked before, so they only have to enter check-in and
// check-out dates to book a car they are likely to want.
// ======================================================


// ----------------------------------------------------
// DOM helpers
// ----------------------------------------------------

function removeAllChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function makeElement(tag, className, text) {
  var element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text != null) {
    element.appendChild(document.createTextNode(text));
  }

  return element;
}

function addCarLine(card, label, value) {
  card.appendChild(makeElement("p", null, label + ": " + value));
}


// ----------------------------------------------------
// Search
// ----------------------------------------------------

function searchCar() {

  removeAllChildren(document.getElementById("message"));
  removeAllChildren(document.getElementById("carResults"));

  var city = document.getElementById("city").value.trim().toLowerCase();
  var carType = document.getElementById("carType").value.toLowerCase();
  var checkIn = document.getElementById("checkIn").value;
  var checkOut = document.getElementById("checkOut").value;

  if (city == "") {
    TravelData.showError("Please enter a city.");
    return;
  }

  if (!TravelData.isValidCity(city)) {
    TravelData.showError("City must be a city in Texas or California.");
    return;
  }

  if (!TravelData.isValidCarType(carType)) {
    TravelData.showError("Car type must be economy, SUV, compact, or midsize.");
    return;
  }

  if (checkIn == "" || !TravelData.dateInRange(checkIn)) {
    TravelData.showError("Check-in date must be between Sep 1, 2024 and Dec 1, 2024.");
    return;
  }

  if (checkOut == "" || !TravelData.dateInRange(checkOut)) {
    TravelData.showError("Check-out date must be between Sep 1, 2024 and Dec 1, 2024.");
    return;
  }

  if (new Date(checkOut) < new Date(checkIn)) {
    TravelData.showError("Check-out date must be after check-in date.");
    return;
  }

  // echo back what was entered
  var messageBox = document.getElementById("message");
  var resultBox = makeElement("div", "result");

  resultBox.appendChild(makeElement("h3", null, "Car Rental Details"));

  addSummaryLine(resultBox, "City", TravelData.formatWords(city));
  addSummaryLine(resultBox, "Car Type", TravelData.formatWords(carType));
  addSummaryLine(resultBox, "Check-in Date", checkIn);
  addSummaryLine(resultBox, "Check-out Date", checkOut);

  messageBox.appendChild(resultBox);

  TravelData.getCars()
    .then(function (cars) {
      displayAvailableCars(cars, city, carType, checkIn, checkOut);
    })
    .catch(function (error) {
      TravelData.showError(
        error.message +
        " Use Live Server and make sure cars.xml is in the project folder."
      );
    });
}

function addSummaryLine(resultBox, label, value) {
  var p = document.createElement("p");

  p.appendChild(makeElement("span", null, label + ": "));
  p.appendChild(makeElement("span", null, value));

  resultBox.appendChild(p);
}

function displayAvailableCars(cars, city, selectedCarType, checkIn, checkOut) {

  var carResults = document.getElementById("carResults");
  removeAllChildren(carResults);

  var matches = [];
  var alreadyBooked = [];
  var i;

  for (i = 0; i < cars.length; i++) {

    if (cars[i].city.toLowerCase() != city) {
      continue;
    }

    if (cars[i].carType.toLowerCase() != selectedCarType) {
      continue;
    }

    if (cars[i].available) {
      matches.push(cars[i]);
    } else {
      alreadyBooked.push(cars[i]);
    }
  }

  carResults.appendChild(
    makeElement("h3", null, "Available Cars in " + TravelData.formatWords(city))
  );

  if (matches.length == 0) {

    var emptyText = alreadyBooked.length > 0
      ? "Every " + TravelData.formatWords(selectedCarType) + " car in " +
        TravelData.formatWords(city) + " has already been booked."
      : "No matching cars were found.";

    carResults.appendChild(makeElement("p", "error", emptyText));
  }

  for (i = 0; i < matches.length; i++) {
    carResults.appendChild(createCarCard(matches[i], checkIn, checkOut));
  }

  // listing the booked ones makes it obvious that booking removed them
  for (i = 0; i < alreadyBooked.length; i++) {
    carResults.appendChild(createBookedCarCard(alreadyBooked[i]));
  }
}

function createCarCard(car, checkIn, checkOut) {

  var card = makeElement("div", "hotel-card");

  card.appendChild(makeElement("h4", null, car.carType + " - " + car.carId));

  addCarLine(card, "City", car.city);
  addCarLine(card, "Car Type", car.carType);
  addCarLine(card, "Check-in Date", checkIn);
  addCarLine(card, "Check-out Date", checkOut);
  addCarLine(card, "Price Per Day", "$" + car.pricePerDay.toFixed(2));

  var button = makeElement("button", "btn-select", "Add to Cart");
  button.type = "button";

  button.onclick = function () {
    addCarToCart(car, checkIn, checkOut);
  };

  card.appendChild(button);

  return card;
}

function createBookedCarCard(car) {

  var card = makeElement("div", "hotel-card sold-out");

  card.appendChild(makeElement("h4", null, car.carType + " - " + car.carId));

  addCarLine(card, "City", car.city);
  addCarLine(card, "Car Type", car.carType);
  addCarLine(card, "Price Per Day", "$" + car.pricePerDay.toFixed(2));

  card.appendChild(makeElement(
    "p",
    "error",
    "Already booked, this car is no longer available."
  ));

  return card;
}

function addCarToCart(car, checkIn, checkOut) {

  var numberOfDays = TravelData.nightsBetween(checkIn, checkOut);
  var totalPrice = car.pricePerDay * numberOfDays;

  TravelData.addToCart({
    type: "car",
    carId: car.carId,
    city: car.city,
    carType: car.carType,
    checkIn: checkIn,
    checkOut: checkOut,
    pricePerDay: car.pricePerDay,
    numberOfDays: numberOfDays,
    totalPrice: totalPrice.toFixed(2)
  });

  alert(
    car.carType +
    " car added to the cart.\nTotal price: $" +
    totalPrice.toFixed(2)
  );
}


// ----------------------------------------------------
// Suggested cars, based on previous bookings
//
// Cities and car types the user has booked before are counted up, then
// available cars are scored against those counts. A city match matters
// more than a car type match, so a returning customer sees cars in the
// place they are actually travelling to first.
// ----------------------------------------------------

function getBookingPreferences() {

  var bookings = TravelData.getBookings();
  var cities = {};
  var carTypes = {};
  var i;
  var j;

  function count(map, key) {
    if (!key) {
      return;
    }

    var normalized = String(key).toLowerCase();

    if (map[normalized] == null) {
      map[normalized] = 0;
    }

    map[normalized]++;
  }

  for (i = 0; i < bookings.length; i++) {

    var booking = bookings[i];

    if (booking.type == "car" && booking.details) {
      count(cities, booking.details.city);
      count(carTypes, booking.details.carType);
    } else if (booking.type == "stay" && booking.details) {
      count(cities, booking.details.city);
    } else if (booking.type == "flight" && booking.flights) {
      // where they flew to is where they will need a car
      for (j = 0; j < booking.flights.length; j++) {
        count(cities, booking.flights[j].destination);
      }
    }
  }

  return {
    cities: cities,
    carTypes: carTypes,
    bookingCount: bookings.length
  };
}

function scoreCar(car, preferences) {

  var cityScore = preferences.cities[car.city.toLowerCase()] || 0;
  var typeScore = preferences.carTypes[car.carType.toLowerCase()] || 0;

  return (cityScore * 2) + typeScore;
}

function buildSuggestionPanel() {

  var panel = document.getElementById("suggestionPanel");

  if (!panel) {
    return;
  }

  removeAllChildren(panel);

  var preferences = getBookingPreferences();

  var box = makeElement("div", "result");
  box.appendChild(makeElement("h3", null, "Suggested For You"));

  if (preferences.bookingCount == 0) {
    box.appendChild(makeElement(
      "p",
      "saved-note",
      "Once you have booked a flight, hotel or car, this section will suggest " +
      "cars that match where you are going and the kind of car you like, so you " +
      "only need to enter your dates."
    ));

    panel.appendChild(box);
    return;
  }

  box.appendChild(makeElement(
    "p",
    "saved-note",
    "Based on your previous bookings. Enter only your check-in and check-out " +
    "dates to book one of these."
  ));

  var inLabel = makeElement("label", null, "Check-in Date");
  var inInput = document.createElement("input");
  inInput.type = "date";
  inInput.id = "suggestCheckIn";
  inLabel.appendChild(inInput);
  box.appendChild(inLabel);

  var outLabel = makeElement("label", null, "Check-out Date");
  var outInput = document.createElement("input");
  outInput.type = "date";
  outInput.id = "suggestCheckOut";
  outLabel.appendChild(outInput);
  box.appendChild(outLabel);

  var button = makeElement("button", "btn-select", "Show Suggested Cars");
  button.type = "button";
  button.onclick = showSuggestedCars;
  box.appendChild(button);

  var suggestionMessage = document.createElement("div");
  suggestionMessage.id = "suggestionMessage";
  box.appendChild(suggestionMessage);

  var suggestionResults = document.createElement("div");
  suggestionResults.id = "suggestionResults";
  box.appendChild(suggestionResults);

  panel.appendChild(box);
}

function showSuggestedCars() {

  var checkIn = document.getElementById("suggestCheckIn").value;
  var checkOut = document.getElementById("suggestCheckOut").value;

  var messageBox = document.getElementById("suggestionMessage");
  var resultsBox = document.getElementById("suggestionResults");

  removeAllChildren(messageBox);
  removeAllChildren(resultsBox);

  if (checkIn == "" || !TravelData.dateInRange(checkIn)) {
    messageBox.appendChild(makeElement(
      "p",
      "error",
      "Check-in date must be between Sep 1, 2024 and Dec 1, 2024."
    ));
    return;
  }

  if (checkOut == "" || !TravelData.dateInRange(checkOut)) {
    messageBox.appendChild(makeElement(
      "p",
      "error",
      "Check-out date must be between Sep 1, 2024 and Dec 1, 2024."
    ));
    return;
  }

  if (new Date(checkOut) < new Date(checkIn)) {
    messageBox.appendChild(makeElement(
      "p",
      "error",
      "Check-out date must be after check-in date."
    ));
    return;
  }

  var preferences = getBookingPreferences();

  TravelData.getCars()
    .then(function (cars) {

      var scored = [];
      var i;

      for (i = 0; i < cars.length; i++) {

        if (!cars[i].available) {
          continue;
        }

        var score = scoreCar(cars[i], preferences);

        if (score > 0) {
          scored.push({ car: cars[i], score: score });
        }
      }

      scored.sort(function (a, b) {
        return b.score - a.score;
      });

      if (scored.length == 0) {
        messageBox.appendChild(makeElement(
          "p",
          null,
          "No available cars match your previous bookings right now. " +
          "Try the full search below."
        ));
        return;
      }

      // a short list keeps this useful rather than another full listing
      var limit = scored.length < 4 ? scored.length : 4;

      for (i = 0; i < limit; i++) {
        resultsBox.appendChild(
          createSuggestedCarCard(scored[i].car, checkIn, checkOut)
        );
      }
    })
    .catch(function (error) {
      messageBox.appendChild(makeElement("p", "error", error.message));
    });
}

function createSuggestedCarCard(car, checkIn, checkOut) {

  var card = makeElement("div", "hotel-card");

  card.appendChild(makeElement("h4", null, car.carType + " - " + car.carId));

  addCarLine(card, "City", car.city);
  addCarLine(card, "Car Type", car.carType);
  addCarLine(card, "Check-in Date", checkIn);
  addCarLine(card, "Check-out Date", checkOut);
  addCarLine(card, "Price Per Day", "$" + car.pricePerDay.toFixed(2));
  addCarLine(
    card,
    "Days",
    TravelData.nightsBetween(checkIn, checkOut)
  );

  var button = makeElement("button", "btn-select", "Add Suggested Car to Cart");
  button.type = "button";

  button.onclick = function () {
    addCarToCart(car, checkIn, checkOut);
  };

  card.appendChild(button);

  return card;
}


// the script tags sit at the bottom of the page, so the DOM is ready here.
// script.js owns window.onload, so don't reassign it.
buildSuggestionPanel();
