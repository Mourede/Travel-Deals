

var texasandCaliforniaCities = [

  // Texas airport cities
  "dallas",
  "houston",
  "austin",
  "san antonio",
  "fort worth",
  "el paso",
  "lubbock",
  "corpus christi",
  "amarillo",
  "midland",

  // California airport cities
  "los angeles",
  "san francisco",
  "san diego",
  "sacramento",
  "san jose",
  "oakland",
  "fresno",
  "long beach",
  "burbank",
  "ontario"
];

function changeTrip() {
  var tripType = document.getElementById("tripType").value;
  var returnDiv = document.getElementById("returnDiv");

  if (tripType == "round") {
    returnDiv.style.display = "block";
  } else {
    returnDiv.style.display = "none";
  }
}

function togglePassengers() {
  var passengerBox = document.getElementById("passengerBox");

  if (passengerBox.style.display == "block") {
    passengerBox.style.display = "none";
  } else {
    passengerBox.style.display = "block";
  }
}

function dateInRange(dateValue) {
  var selectedDate = new Date(dateValue);
  var startDate = new Date("2024-09-01");
  var endDate = new Date("2024-12-01");

  return selectedDate >= startDate && selectedDate <= endDate;
}

function formatCityName(city) {
  var words = city.split(" ");
  var result = "";

  for (var i = 0; i < words.length; i++) {
    result += words[i].charAt(0).toUpperCase() + words[i].slice(1);

    if (i < words.length - 1) {
      result += " ";
    }
  }

  return result;
}

function loadFlightsJson() {
  return fetch("flights.json")
    .then(function(response) {
      if (!response.ok) {
        throw new Error("Could not load flights.json.");
      }

      return response.json();
    });
}

function getDateDifference(date1, date2) {
  var firstDate = new Date(date1 + "T00:00:00");
  var secondDate = new Date(date2 + "T00:00:00");

  return Math.abs(firstDate - secondDate) / (1000 * 60 * 60 * 24);
}

function findAvailableFlights(
  flights,
  origin,
  destination,
  requestedDate,
  totalPassengers
) {
  var exactFlights = flights.filter(function(flight) {
    return (
      flight.origin.toLowerCase() == origin &&
      flight.destination.toLowerCase() == destination &&
      flight.departureDate == requestedDate &&
      flight.availableSeats >= totalPassengers
    );
  });

  if (exactFlights.length > 0) {
    return exactFlights;
  }

  return flights.filter(function(flight) {
    return (
      flight.origin.toLowerCase() == origin &&
      flight.destination.toLowerCase() == destination &&
      getDateDifference(flight.departureDate, requestedDate) <= 3 &&
      flight.availableSeats >= totalPassengers
    );
  });
}

function searchFlight() {

  var message = document.getElementById("message");
  message.innerHTML = "";
  
  var flightResults = document.getElementById("flightResults");
  flightResults.innerHTML = "";

  var tripType = document.getElementById("tripType").value;

  var originInput = document.getElementById("origin").value.trim();
  var destinationInput = document.getElementById("destination").value.trim();

  var origin = originInput.toLowerCase();
  var destination = destinationInput.toLowerCase();

  var departDate = document.getElementById("departDate").value;
  var returnDate = document.getElementById("returnDate").value;

  var adults = document.getElementById("adults").value;
  var children = document.getElementById("children").value;
  var infants = document.getElementById("infants").value;


  var cityRegex = /^(Dallas|Houston|Austin|San Antonio|Fort Worth|El Paso|Lubbock|Corpus Christi|Amarillo|Midland|Los Angeles|San Francisco|San Diego|Sacramento|San Jose|Oakland|Fresno|Long Beach|Burbank|Ontario)$/i;
  var adultsNum = parseInt(adults);
  var childrenNum = parseInt(children);
  var infantsNum = parseInt(infants);

  if (
      isNaN(adultsNum) || adultsNum < 0 || adultsNum > 4 ||
      isNaN(childrenNum) || childrenNum < 0 || childrenNum > 4 ||
      isNaN(infantsNum) || infantsNum < 0 || infantsNum > 4
  ) {
      message.innerHTML =
          "<p class='error'>Each passenger category must contain between 0 and 4 passengers.</p>";
      return;
  }

  if (adultsNum + childrenNum + infantsNum == 0) {
    message.innerHTML =
        "<p class='error'>Please enter at least one passenger.</p>";
    return;
  }


  if (originInput == "" || destinationInput == "") {
    message.innerHTML = "<p class='error'>Please enter origin and destination.</p>";
    return;
  }

  if (
    !cityRegex.test(originInput) ||
    !cityRegex.test(destinationInput)
  ) {
    message.innerHTML =
      "<p class='error'>Please enter a valid city in Texas or California.</p>";
    return;
  }

  if (origin == destination) {
    message.innerHTML =
      "<p class='error'>Origin and destination cannot be the same.</p>";
    return;
  }


  if (departDate == "" || !dateInRange(departDate)) {
    message.innerHTML =
      "<p class='error'>Departure date must be between Sep 1, 2024 and Dec 1, 2024.</p>";
    return;
  }

  
  if (tripType == "round") {

    if (returnDate == "" || !dateInRange(returnDate)) {
      message.innerHTML =
        "<p class='error'>Return date must be between Sep 1, 2024 and Dec 1, 2024.</p>";
      return;
    }

    if (new Date(returnDate) < new Date(departDate)) {
      message.innerHTML =
        "<p class='error'>Return date cannot be before departure date.</p>";
      return;
    }
  }



  var result = "<div class='result'>";
  result += "<h3>Flight Details</h3>";
  
  var tripName;

  if (tripType == "oneway") {
    tripName = "One Way";
  } else {
    tripName = "Round Trip";
  }
  result += "<p><strong>Trip Type:</strong> " + tripName + "</p>";

  result += "<p><strong>Origin:</strong> " + formatCityName(origin) + "</p>";
  result += "<p><strong>Destination:</strong> " + formatCityName(destination) + "</p>";
  result += "<p><strong>Departure Date:</strong> " + departDate + "</p>";

  if (tripType == "round") {
    result += "<p><strong>Return Date:</strong> " + returnDate + "</p>";
  }

  result += "<p><strong>Adults:</strong> " + adults + "</p>";
  result += "<p><strong>Children:</strong> " + children + "</p>";
  result += "<p><strong>Infants:</strong> " + infants + "</p>";
  result += "</div>";

  message.innerHTML = result;

  var totalPassengers = adultsNum + childrenNum + infantsNum;

  loadFlightsJson()
  .then(function(flights) {
    var departingFlights = findAvailableFlights(
      flights,
      origin,
      destination,
      departDate,
      totalPassengers
    );

    displayFlights(
      departingFlights,
      "Departing Flights",
      "departing",
      tripType,
      adultsNum,
      childrenNum,
      infantsNum
    );

    if (tripType == "round") {
      var returningFlights = findAvailableFlights(
        flights,
        destination,
        origin,
        returnDate,
        totalPassengers
      );

      displayFlights(
        returningFlights,
        "Returning Flights",
        "returning",
        tripType,
        adultsNum,
        childrenNum,
        infantsNum
      );
    }
  })
  .catch(function(error) {
    document.getElementById("flightResults").innerHTML =
      "<p class='error'>" + error.message +
      " Use Live Server to open the project.</p>";
  });

}

function displayFlights(
  flights,
  headingText,
  flightPart,
  tripType,
  adults,
  children,
  infants
) {
  var flightResults = document.getElementById("flightResults");

  var section = document.createElement("div");
  section.className = "flight-list";

  var heading = document.createElement("h3");
  heading.appendChild(document.createTextNode(headingText));
  section.appendChild(heading);

  if (flights.length == 0) {
    var noFlight = document.createElement("p");
    noFlight.className = "error";
    noFlight.appendChild(
      document.createTextNode(
        "No flights were found for this route within 3 days."
      )
    );

    section.appendChild(noFlight);
    flightResults.appendChild(section);
    return;
  }

  for (var i = 0; i < flights.length; i++) {
    createFlightCard(
      section,
      flights[i],
      flightPart,
      tripType,
      adults,
      children,
      infants
    );
  }

  flightResults.appendChild(section);
}

function createFlightCard(
  section,
  flight,
  flightPart,
  tripType,
  adults,
  children,
  infants
) {
  var card = document.createElement("div");
  card.className = "hotel-card";

  var heading = document.createElement("h4");
  heading.appendChild(
    document.createTextNode("Flight " + flight.flightId)
  );
  card.appendChild(heading);

  addFlightLine(card, "Origin", flight.origin);
  addFlightLine(card, "Destination", flight.destination);
  addFlightLine(card, "Departure Date", flight.departureDate);
  addFlightLine(card, "Arrival Date", flight.arrivalDate);
  addFlightLine(card, "Departure Time", flight.departureTime);
  addFlightLine(card, "Arrival Time", flight.arrivalTime);
  addFlightLine(card, "Available Seats", flight.availableSeats);
  addFlightLine(card, "Adult Price", "$" + flight.price);

  var button = document.createElement("button");
  button.type = "button";
  button.className = "btn-select";
  button.appendChild(document.createTextNode("Add to Cart"));

  button.onclick = function() {
    addFlightToCart(
      flight,
      flightPart,
      tripType,
      adults,
      children,
      infants
    );
  };

  card.appendChild(button);
  section.appendChild(card);
}

function addFlightLine(card, label, value) {
  var paragraph = document.createElement("p");
  paragraph.appendChild(
    document.createTextNode(label + ": " + value)
  );

  card.appendChild(paragraph);
}

function addFlightToCart(
  flight,
  flightPart,
  tripType,
  adults,
  children,
  infants
) {
  var totalPrice =
    adults * flight.price +
    children * flight.price * 0.7 +
    infants * flight.price * 0.1;

  var cartEntry = {
    type: "flight",
    tripType: tripType,
    flightPart: flightPart,
    flightId: flight.flightId,
    origin: flight.origin,
    destination: flight.destination,
    departureDate: flight.departureDate,
    arrivalDate: flight.arrivalDate,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    availableSeats: flight.availableSeats,
    adultTicketPrice: flight.price,
    adults: adults,
    children: children,
    infants: infants,
    totalPrice: totalPrice.toFixed(2)
  };

  if (flightPart == "departing") {
    localStorage.setItem(
      "selectedDepartingFlight",
      JSON.stringify(cartEntry)
    );

    if (tripType == "oneway") {
      localStorage.removeItem("selectedReturningFlight");
    }
  } else {
    localStorage.setItem(
      "selectedReturningFlight",
      JSON.stringify(cartEntry)
    );
  }

  alert(
    "Flight " +
    flight.flightId +
    " added to the cart.\nTotal price: $" +
    totalPrice.toFixed(2)
  );
}

document.addEventListener("DOMContentLoaded", function() {
  changeTrip();
});