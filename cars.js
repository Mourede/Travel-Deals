
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

// allowed car types
var carTypes = ["economy", "suv", "compact", "midsize"];

// check if date is valid for the assignment
function dateInRange(dateText) {
  var selectedDate = new Date(dateText);
  var startDate = new Date("2024-09-01");
  var endDate = new Date("2024-12-01");

  return selectedDate >= startDate && selectedDate <= endDate;
}

function showError(text) {
  var messageBox = document.getElementById("message");
  messageBox.innerHTML = "";

  var paragraph = document.createElement("p");
  paragraph.className = "error";

  var errorText = document.createTextNode(text);
  paragraph.appendChild(errorText);

  messageBox.appendChild(paragraph);
}


function formatWords(text) {
  var words = text.split(" ");
  var result = "";

  for (var i = 0; i < words.length; i++) {
    result += words[i].charAt(0).toUpperCase() + words[i].slice(1);

    if (i < words.length - 1) {
      result += " ";
    }
  }

  return result;
}


function searchCar() {
  var city = document.getElementById("city").value.trim().toLowerCase();
  var carType = document.getElementById("carType").value.toLowerCase();
  var checkIn = document.getElementById("checkIn").value;
  var checkOut = document.getElementById("checkOut").value;


  if (city == "") {
    showError("Please enter a city.");
    return;
  }


  if (texasandCaliforniaCities.indexOf(city) == -1) {
    showError("City must be a city in Texas or California.");
    return;
  }


  if (carTypes.indexOf(carType) == -1) {
    showError("Car type must be economy, SUV, compact, or midsize.");
    return;
  }

  if (checkIn == "" || !dateInRange(checkIn)) {
    showError("Check-in date must be between Sep 1, 2024 and Dec 1, 2024.");
    return;
  }

  if (checkOut == "" || !dateInRange(checkOut)) {
    showError("Check-out date must be between Sep 1, 2024 and Dec 1, 2024.");
    return;
  }


  if (new Date(checkOut) < new Date(checkIn)) {
    showError("Check-out date must be after check-in date.");
    return;
  }

  var messageBox = document.getElementById("message");
  messageBox.innerHTML = "";


  var resultBox = document.createElement("div");
  resultBox.className = "result";

  var heading = document.createElement("h3");
  heading.appendChild(document.createTextNode("Car Rental Details"));
  resultBox.appendChild(heading);

  function addLine(label, value) {
    var p = document.createElement("p");

    var left = document.createElement("span");
    left.appendChild(document.createTextNode(label + ": "));

    var right = document.createElement("span");
    right.appendChild(document.createTextNode(value));

    p.appendChild(left);
    p.appendChild(right);
    resultBox.appendChild(p);
  }

  addLine("City", formatWords(city));
  addLine("Car Type", formatWords(carType));
  addLine("Check-in Date", checkIn);
  addLine("Check-out Date", checkOut);

  messageBox.appendChild(resultBox);
}