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

function searchStays() {

  var city = document.getElementById("city").value.trim().toLowerCase();
  var checkIn = document.getElementById("checkIn").value;
  var checkOut = document.getElementById("checkOut").value;
  var adults = parseInt(document.getElementById("adults").value, 10);
  var children = parseInt(document.getElementById("children").value, 10);
  var infants = parseInt(document.getElementById("infants").value, 10);

  if (isNaN(adults)) {
    adults = 0;
  }
  if (isNaN(children)) {
    children = 0;
  }
  if (isNaN(infants)) {
    infants = 0;
  }

  if (city == "") {
    showError("Please enter a city.");
    return;
  }

  if (texasandCaliforniaCities.indexOf(city) == -1) {
    showError("City must be a city in Texas or California.");
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

  if (adults + children == 0 && infants == 0) {
    showError("Please enter at least one guest.");
    return;
  }

  // max 2 adults/children per room, infants can stay in any room without counting
  var roomsNeeded = 1;
  if (adults + children > 0) {
    roomsNeeded = Math.ceil((adults + children) / 2);
  }

  // everything typed in is valid now, so go grab the hotel data file and
  // show whatever hotels match the requested city
  loadHotelsXml()
    .then(function (xmlDoc) {
      renderHotelResults(xmlDoc, city, checkIn, checkOut, adults, children, infants, roomsNeeded);
    })
    .catch(function (err) {
      showError(
        "Could not load hotel data (" + err.message + "). " +
        "Make sure this page is being served from a local web server (like VS Code Live Server), " +
        "not just opened directly as a file, or the browser will block the xml file from loading."
      );
    });
}


// ---------------------------------------------------
// hotels.xml loading + rendering
// ---------------------------------------------------

// grabs the text inside a tag the same way the lecture slides did it:
// node.getElementsByTagName(tag)[0].childNodes[0].nodeValue
function getTagValue(node, tag) {
  var el = node.getElementsByTagName(tag)[0];
  if (!el || el.childNodes.length === 0) {
    return "";
  }
  return el.childNodes[0].nodeValue;
}

// fetches hotels.xml off disk and turns it into an xml dom object.
// same DOMParser pattern as the slides, just the text is coming from a
// separate file this time instead of being typed in as a string
function loadHotelsXml() {
  return fetch("hotels.xml")
    .then(function (response) {
      return response.text();
    })
    .then(function (xmlText) {
      var parser = new DOMParser();
      return parser.parseFromString(xmlText, "text/xml");
    });
}

function renderHotelResults(xmlDoc, city, checkIn, checkOut, adults, children, infants, roomsNeeded) {

  var hotelNodes = xmlDoc.getElementsByTagName("hotel");
  var matches = [];
  var i;

  // loop through every <hotel> node and keep the ones in the requested city
  for (i = 0; i < hotelNodes.length; i++) {
    var hotelCity = getTagValue(hotelNodes[i], "city").toLowerCase();
    if (hotelCity == city) {
      matches.push(hotelNodes[i]);
    }
  }

  var messageBox = document.getElementById("message");
  messageBox.innerHTML = "";

  // ---- first show what the user searched for, same as before ----
  var resultBox = document.createElement("div");
  resultBox.className = "result";

  var heading = document.createElement("h3");
  heading.appendChild(document.createTextNode("Stay Search Results"));
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
  addLine("Check-in Date", checkIn);
  addLine("Check-out Date", checkOut);
  addLine("Adults", adults);
  addLine("Children", children);
  addLine("Infants", infants);
  addLine("Rooms Needed", roomsNeeded);

  messageBox.appendChild(resultBox);

  // ---- now show the actual hotels that matched the city ----
  var listBox = document.createElement("div");
  listBox.className = "hotel-list";

  var listHeading = document.createElement("h3");
  listHeading.appendChild(document.createTextNode("Available Hotels in " + formatWords(city)));
  listBox.appendChild(listHeading);

  if (matches.length === 0) {

    var noneMsg = document.createElement("p");
    noneMsg.appendChild(document.createTextNode("No hotels available in this city right now."));
    listBox.appendChild(noneMsg);

  } else {

    for (i = 0; i < matches.length; i++) {

      var hotelId = getTagValue(matches[i], "hotelId");
      var hotelName = getTagValue(matches[i], "hotelName");
      var hotelCityName = getTagValue(matches[i], "city");
      var pricePerNight = getTagValue(matches[i], "pricePerNight");

      var card = document.createElement("div");
      card.className = "hotel-card";

      var name = document.createElement("h4");
      name.appendChild(document.createTextNode(hotelName + " (" + hotelId + ")"));
      card.appendChild(name);

      var cardCity = document.createElement("p");
      cardCity.appendChild(document.createTextNode("City: " + hotelCityName));
      card.appendChild(cardCity);

      var cardCheckIn = document.createElement("p");
      cardCheckIn.appendChild(document.createTextNode("Check-in: " + checkIn));
      card.appendChild(cardCheckIn);

      var cardCheckOut = document.createElement("p");
      cardCheckOut.appendChild(document.createTextNode("Check-out: " + checkOut));
      card.appendChild(cardCheckOut);

      var cardPrice = document.createElement("p");
      cardPrice.appendChild(document.createTextNode("Price per night: $" + pricePerNight));
      card.appendChild(cardPrice);

      var selectBtn = document.createElement("button");
      selectBtn.type = "button";
      selectBtn.className = "btn-select";
      selectBtn.appendChild(document.createTextNode("Select This Hotel"));

      // need this little wrapper function so each button remembers
      // its own hotel's info instead of all of them sharing the last
      // values from the loop
      (function (id, hName, hCity, price) {
        selectBtn.onclick = function () {
          addHotelToCart(id, hName, hCity, checkIn, checkOut, adults, children, infants, roomsNeeded, price);
        };
      })(hotelId, hotelName, hotelCityName, pricePerNight);

      card.appendChild(selectBtn);
      listBox.appendChild(card);
    }
  }

  messageBox.appendChild(listBox);
}

// there is no cart page yet, so for now selecting a hotel just saves it
// into localStorage under "cartItems". whenever the cart page gets built
// it can read this same key and show everything that's in it
function addHotelToCart(hotelId, hotelName, city, checkIn, checkOut, adults, children, infants, roomsNeeded, pricePerNight) {

  var nights = Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  if (nights < 1) {
    nights = 1;
  }

  var totalPrice = (parseFloat(pricePerNight) * roomsNeeded * nights).toFixed(2);

  var cartEntry = {
    type: "stay",
    hotelId: hotelId,
    hotelName: hotelName,
    city: city,
    checkIn: checkIn,
    checkOut: checkOut,
    adults: adults,
    children: children,
    infants: infants,
    roomsNeeded: roomsNeeded,
    pricePerNight: pricePerNight,
    nights: nights,
    totalPrice: totalPrice
  };

  var existing = localStorage.getItem("cartItems");
  var cartItems;

  if (existing) {
    cartItems = JSON.parse(existing);
  } else {
    cartItems = [];
  }

  cartItems.push(cartEntry);
  localStorage.setItem("cartItems", JSON.stringify(cartItems));

  alert(
    hotelName + " added to your cart.\n" +
    "Total: $" + totalPrice + " for " + nights + " night(s), " + roomsNeeded + " room(s)."
  );
}