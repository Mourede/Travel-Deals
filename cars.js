
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

var carsXmlDocument;

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


function loadCarsXml() {
  return fetch("cars.xml")
    .then(function(response) {
      if (!response.ok) {
        throw new Error("Could not load cars.xml.");
      }

      return response.text();
    })
    .then(function(xmlText) {
      var parser = new DOMParser();
      carsXmlDocument = parser.parseFromString(xmlText, "text/xml");

      return carsXmlDocument;
    });
}

function getCarTagValue(carNode, tagName) {
  var element = carNode.getElementsByTagName(tagName)[0];

  if (!element) {
    return "";
  }

  return element.textContent;
}

function searchCar() {
  document.getElementById("message").innerHTML = "";
  document.getElementById("carResults").innerHTML = "";
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

    loadCarsXml()
    .then(function(xmlDocument) {
      displayAvailableCars(
        xmlDocument,
        city,
        carType,
        checkIn,
        checkOut
      );
    })
    .catch(function(error) {
      showError(
        error.message +
        " Use Live Server and make sure cars.xml is in the project folder."
      );
    });

}

function displayAvailableCars(
  xmlDocument,
  city,
  selectedCarType,
  checkIn,
  checkOut
) {
  var carResults = document.getElementById("carResults");
  carResults.innerHTML = "";

  var carNodes = xmlDocument.getElementsByTagName("car");
  var matches = [];

  for (var i = 0; i < carNodes.length; i++) {
    var carCity = getCarTagValue(carNodes[i], "city").toLowerCase();
    var carType = getCarTagValue(carNodes[i], "carType").toLowerCase();
    var available = getCarTagValue(carNodes[i], "available").toLowerCase();

    if (
      carCity == city &&
      carType == selectedCarType &&
      available == "true"
    ) {
      matches.push(carNodes[i]);
    }
  }

  var heading = document.createElement("h3");
  heading.appendChild(
    document.createTextNode("Available Cars in " + formatWords(city))
  );
  carResults.appendChild(heading);

  if (matches.length == 0) {
    var noCars = document.createElement("p");
    noCars.className = "error";
    noCars.appendChild(
      document.createTextNode("No matching cars were found.")
    );

    carResults.appendChild(noCars);
    return;
  }

  for (var j = 0; j < matches.length; j++) {
    createCarCard(
      carResults,
      matches[j],
      checkIn,
      checkOut
    );
  }
}

function createCarCard(
  carResults,
  carNode,
  checkIn,
  checkOut
) {
  var car = {
    carId: getCarTagValue(carNode, "carId"),
    city: getCarTagValue(carNode, "city"),
    carType: getCarTagValue(carNode, "carType"),
    pricePerDay: parseFloat(
      getCarTagValue(carNode, "pricePerDay")
    )
  };

  var card = document.createElement("div");
  card.className = "hotel-card";

  var heading = document.createElement("h4");
  heading.appendChild(
    document.createTextNode(car.carType + " - " + car.carId)
  );
  card.appendChild(heading);

  addCarLine(card, "City", car.city);
  addCarLine(card, "Car Type", car.carType);
  addCarLine(card, "Check-in Date", checkIn);
  addCarLine(card, "Check-out Date", checkOut);
  addCarLine(
    card,
    "Price Per Day",
    "$" + car.pricePerDay.toFixed(2)
  );

  var button = document.createElement("button");
  button.type = "button";
  button.className = "btn-select";
  button.appendChild(document.createTextNode("Add to Cart"));

  button.onclick = function() {
    addCarToCart(car, checkIn, checkOut);
  };

  card.appendChild(button);
  carResults.appendChild(card);
}

function addCarLine(card, label, value) {
  var paragraph = document.createElement("p");

  paragraph.appendChild(
    document.createTextNode(label + ": " + value)
  );

  card.appendChild(paragraph);
}

function addCarToCart(car, checkIn, checkOut) {
  var startDate = new Date(checkIn + "T00:00:00");
  var endDate = new Date(checkOut + "T00:00:00");

  var numberOfDays = Math.round(
    (endDate - startDate) /
    (1000 * 60 * 60 * 24)
  );

  if (numberOfDays < 1) {
    numberOfDays = 1;
  }

  var totalPrice = car.pricePerDay * numberOfDays;

  var cartEntry = {
    type: "car",
    carId: car.carId,
    city: car.city,
    carType: car.carType,
    checkIn: checkIn,
    checkOut: checkOut,
    pricePerDay: car.pricePerDay,
    numberOfDays: numberOfDays,
    totalPrice: totalPrice.toFixed(2)
  };

  var existing = localStorage.getItem("cartItems");
  var cartItems;

  if (existing) {
    cartItems = JSON.parse(existing);
  } else {
    cartItems = [];
  }

  cartItems.push(cartEntry);

  localStorage.setItem(
    "cartItems",
    JSON.stringify(cartItems)
  );

  alert(
    car.carType +
    " car added to the cart.\nTotal price: $" +
    totalPrice.toFixed(2)
  );
}