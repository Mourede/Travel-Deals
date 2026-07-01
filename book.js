

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

function searchFlight() {

  var message = document.getElementById("message");
  message.innerHTML = "";

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


  var cityRegex = /^[A-Za-z ]+$/;
  var passengerRegex = /^[0-4]$/;


  if (originInput == "" || destinationInput == "") {
    message.innerHTML = "<p class='error'>Please enter origin and destination.</p>";
    return;
  }


  if (!cityRegex.test(originInput) || !cityRegex.test(destinationInput)) {
    message.innerHTML = "<p class='error'>City names must contain letters only.</p>";
    return;
  }


  if (
    texasandCaliforniaCities.indexOf(origin) == -1 ||
    texasandCaliforniaCities.indexOf(destination) == -1
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

  if (
    !passengerRegex.test(adults) ||
    !passengerRegex.test(children) ||
    !passengerRegex.test(infants)
  ) {
    message.innerHTML =
      "<p class='error'>Passengers cannot be more than 4 in each category.</p>";
    return;
  }


  var result = "<div class='result'>";
  result += "<h3>Flight Details</h3>";
  result += "<p><strong>Trip Type:</strong> " + tripType + "</p>";
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
}