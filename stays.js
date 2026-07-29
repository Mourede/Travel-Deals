// ======================================================
// stays.js
// The assignment says not to use regular expressions on this page, so
// every check below is a plain comparison or an array lookup.
// City list, date window and helpers all come from data.js.
// ======================================================

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
    TravelData.showError("Please enter a city.");
    return;
  }

  if (!TravelData.isValidCity(city)) {
    TravelData.showError("City must be a city in Texas or California.");
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

  if (adults + children + infants == 0) {
    TravelData.showError("Please enter at least one guest.");
    return;
  }

  // max 2 adults/children per room, infants can stay with adults without
  // counting toward that limit
  var roomsNeeded = 1;
  if (adults + children > 0) {
    roomsNeeded = Math.ceil((adults + children) / 2);
  }

  TravelData.getHotels()
    .then(function (hotels) {
      renderHotelResults(hotels, city, checkIn, checkOut, adults, children, infants, roomsNeeded);
    })
    .catch(function (err) {
      TravelData.showError(
        "Could not load hotel data (" + err.message + "). " +
        "Make sure this page is being served from a local web server (like VS Code Live Server), " +
        "not just opened directly as a file, or the browser will block the xml file from loading."
      );
    });
}


// ---------------------------------------------------
// Rendering
// ---------------------------------------------------

function renderHotelResults(hotels, city, checkIn, checkOut, adults, children, infants, roomsNeeded) {

  var messageBox = document.getElementById("message");
  messageBox.innerHTML = "";

  // ---- first echo back what the user searched for ----
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

  addLine("City", TravelData.formatWords(city));
  addLine("Check-in Date", checkIn);
  addLine("Check-out Date", checkOut);
  addLine("Adults", adults);
  addLine("Children", children);
  addLine("Infants", infants);
  addLine("Rooms Needed", roomsNeeded);

  messageBox.appendChild(resultBox);

  // ---- then the hotels in that city with enough rooms left ----
  var inCity = [];
  var soldOut = [];
  var i;

  for (i = 0; i < hotels.length; i++) {

    if (hotels[i].city.toLowerCase() != city) {
      continue;
    }

    if (hotels[i].availableRooms >= roomsNeeded) {
      inCity.push(hotels[i]);
    } else {
      soldOut.push(hotels[i]);
    }
  }

  var listBox = document.createElement("div");
  listBox.className = "hotel-list";

  var listHeading = document.createElement("h3");
  listHeading.appendChild(
    document.createTextNode("Available Hotels in " + TravelData.formatWords(city))
  );
  listBox.appendChild(listHeading);

  if (inCity.length === 0) {

    var noneMsg = document.createElement("p");
    noneMsg.appendChild(document.createTextNode(
      "No hotels in this city have " + roomsNeeded + " room(s) available right now."
    ));
    listBox.appendChild(noneMsg);

  } else {

    for (i = 0; i < inCity.length; i++) {
      listBox.appendChild(
        buildHotelCard(inCity[i], checkIn, checkOut, adults, children, infants, roomsNeeded)
      );
    }
  }

  // showing the sold out ones makes the booked-and-gone behaviour obvious
  for (i = 0; i < soldOut.length; i++) {
    listBox.appendChild(buildSoldOutCard(soldOut[i], roomsNeeded));
  }

  messageBox.appendChild(listBox);
}

function buildHotelCard(hotel, checkIn, checkOut, adults, children, infants, roomsNeeded) {

  var card = document.createElement("div");
  card.className = "hotel-card";

  var name = document.createElement("h4");
  name.appendChild(document.createTextNode(hotel.hotelName + " (" + hotel.hotelId + ")"));
  card.appendChild(name);

  addCardLine(card, "City", hotel.city);
  addCardLine(card, "Check-in", checkIn);
  addCardLine(card, "Check-out", checkOut);
  addCardLine(card, "Price per night", "$" + hotel.pricePerNight);
  addCardLine(card, "Rooms available", hotel.availableRooms);

  var selectBtn = document.createElement("button");
  selectBtn.type = "button";
  selectBtn.className = "btn-select";
  selectBtn.appendChild(document.createTextNode("Select This Hotel"));

  selectBtn.onclick = function () {
    addHotelToCart(hotel, checkIn, checkOut, adults, children, infants, roomsNeeded);
  };

  card.appendChild(selectBtn);

  return card;
}

function buildSoldOutCard(hotel, roomsNeeded) {

  var card = document.createElement("div");
  card.className = "hotel-card sold-out";

  var name = document.createElement("h4");
  name.appendChild(document.createTextNode(hotel.hotelName + " (" + hotel.hotelId + ")"));
  card.appendChild(name);

  addCardLine(card, "City", hotel.city);
  addCardLine(card, "Price per night", "$" + hotel.pricePerNight);
  addCardLine(card, "Rooms available", hotel.availableRooms);

  var note = document.createElement("p");
  note.className = "error";
  note.appendChild(document.createTextNode(
    "Not enough rooms left for this search (" + roomsNeeded + " needed). Already booked."
  ));
  card.appendChild(note);

  return card;
}

function addCardLine(card, label, value) {
  var p = document.createElement("p");
  p.appendChild(document.createTextNode(label + ": " + value));
  card.appendChild(p);
}

function addHotelToCart(hotel, checkIn, checkOut, adults, children, infants, roomsNeeded) {

  var nights = TravelData.nightsBetween(checkIn, checkOut);
  var totalPrice = (parseFloat(hotel.pricePerNight) * roomsNeeded * nights).toFixed(2);

  TravelData.addToCart({
    type: "stay",
    hotelId: hotel.hotelId,
    hotelName: hotel.hotelName,
    city: hotel.city,
    checkIn: checkIn,
    checkOut: checkOut,
    adults: adults,
    children: children,
    infants: infants,
    roomsNeeded: roomsNeeded,
    pricePerNight: hotel.pricePerNight,
    nights: nights,
    totalPrice: totalPrice
  });

  alert(
    hotel.hotelName + " added to your cart.\n" +
    "Total: $" + totalPrice + " for " + nights + " night(s), " + roomsNeeded + " room(s)."
  );
}
