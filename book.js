// ======================================================
// book.js
// Part 1
// ======================================================

var texasandCaliforniaCities = [

    // Texas
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
  
    // California
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
  
  var selectedDepartingFlight = null;
  var selectedReturningFlight = null;
  
  // ----------------------------------------------------
  // Trip type
  // ----------------------------------------------------
  
  function changeTrip() {
  
    var tripType = document.getElementById("tripType").value;
  
    if (tripType == "round") {
  
        document.getElementById("returnDiv").style.display = "block";
  
    }
    else {
  
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
  
    }
    else {
  
        box.style.display = "block";
  
    }
  
  }
  
  // ----------------------------------------------------
  // Date validation
  // ----------------------------------------------------
  
  function dateInRange(dateValue) {
  
    var chosen = new Date(dateValue);
  
    var start = new Date("2024-09-01");
  
    var end = new Date("2024-12-01");
  
    return chosen >= start && chosen <= end;
  
  }
  
  // ----------------------------------------------------
  // Capitalize city
  // ----------------------------------------------------
  
  function formatCityName(city) {
  
    var words = city.split(" ");
  
    var output = "";
  
    for (var i = 0; i < words.length; i++) {
  
        output +=
            words[i].charAt(0).toUpperCase() +
            words[i].substring(1);
  
        if (i < words.length - 1) {
  
            output += " ";
  
        }
  
    }
  
    return output;
  
  }
  
  // Logic to select a flight. 
  
  function selectFlight(flightId, type) {
  
      loadFlightsJson().then(function(flights){
  
          var flight = flights.find(function(f){
              return f.flightId == flightId;
          });
  
          if(type == "departing"){
              selectedDepartingFlight = flight;
          }
          else{
              selectedReturningFlight = flight;
          }
  
          alert(type + " flight selected.");
  
      });
  
  }
  
  
  // ----------------------------------------------------
  // Load flights
  // ----------------------------------------------------
  
  function loadFlightsJson() {
  
    return fetch("flights.json")
  
        .then(function (response) {
  
            if (!response.ok) {
  
                throw new Error("Unable to load flights.json");
  
            }
  
            return response.json();
  
        })
  
        .then(function (flights) {
  
            // restore simulated seat counts
  
            var saved =
                JSON.parse(localStorage.getItem("flightSeatCounts"));
  
            if (saved != null) {
  
                for (var i = 0; i < flights.length; i++) {
  
                    if (saved[flights[i].flightId] != null) {
  
                        flights[i].availableSeats =
                            saved[flights[i].flightId];
  
                    }
  
                }
  
            }
  
            return flights;
  
        });
  
  }
  
  // ----------------------------------------------------
  // Difference in days
  // ----------------------------------------------------
  
  function getDateDifference(date1, date2) {
  
    var first = new Date(date1 + "T00:00:00");
  
    var second = new Date(date2 + "T00:00:00");
  
    return Math.abs(first - second) / 86400000;
  
  }
  
  // ----------------------------------------------------
  // Find flights
  // ----------------------------------------------------
  
  function findAvailableFlights(
  
    flights,
    origin,
    destination,
    requestedDate,
    totalPassengers
  
  ) {
  
    var matches = [];
  
    for (var i = 0; i < flights.length; i++) {
  
        var f = flights[i];
  
        if (
  
            f.origin.toLowerCase() == origin &&
            f.destination.toLowerCase() == destination &&
            f.departureDate == requestedDate &&
            f.availableSeats >= totalPassengers
  
        ) {
  
            matches.push(f);
  
        }
  
    }
  
    if (matches.length > 0) {
  
        return matches;
  
    }
  
    matches = [];
  
    for (var i = 0; i < flights.length; i++) {
  
        var f = flights[i];
  
        if (
  
            f.origin.toLowerCase() == origin &&
            f.destination.toLowerCase() == destination &&
            getDateDifference(
                f.departureDate,
                requestedDate
            ) <= 3 &&
            f.availableSeats >= totalPassengers
  
        ) {
  
            matches.push(f);
  
        }
  
    }
  
    return matches;
  
  }
  
  // ----------------------------------------------------
  // Search
  // ----------------------------------------------------
  
  function searchFlight() {
  
    var message =
        document.getElementById("message");
  
    var results =
        document.getElementById("flightResults");
  
    message.innerHTML = "";
  
    results.innerHTML = "";
  
  
  
    var tripType =
        document.getElementById("tripType").value;
  
    var originInput =
        document.getElementById("origin").value.trim();
  
    var destinationInput =
        document.getElementById("destination").value.trim();
  
    var origin =
        originInput.toLowerCase();
  
    var destination =
        destinationInput.toLowerCase();
  
    var departDate =
        document.getElementById("departDate").value;
  
    var returnDate =
        document.getElementById("returnDate").value;
  
    var adults =
        parseInt(document.getElementById("adults").value);
  
    var children =
        parseInt(document.getElementById("children").value);
  
    var infants =
        parseInt(document.getElementById("infants").value);
  
  
  
    var cityRegex =
        /^(Dallas|Houston|Austin|San Antonio|Fort Worth|El Paso|Lubbock|Corpus Christi|Amarillo|Midland|Los Angeles|San Francisco|San Diego|Sacramento|San Jose|Oakland|Fresno|Long Beach|Burbank|Ontario)$/i;
  
  
  
    if (
  
        isNaN(adults) ||
        adults < 0 ||
        adults > 4 ||
  
        isNaN(children) ||
        children < 0 ||
        children > 4 ||
  
        isNaN(infants) ||
        infants < 0 ||
        infants > 4
  
    ) {
  
        message.innerHTML =
            "<p class='error'>Each passenger category must be between 0 and 4.</p>";
  
        return;
  
    }
  
  
  
    if (adults + children + infants == 0) {
  
        message.innerHTML =
            "<p class='error'>At least one passenger is required.</p>";
  
        return;
  
    }
  
  
  
    if (
  
        !cityRegex.test(originInput) ||
        !cityRegex.test(destinationInput)
  
    ) {
  
        message.innerHTML =
            "<p class='error'>Origin and destination must be Texas or California cities.</p>";
  
        return;
  
    }
  
  
  
    if (origin == destination) {
  
        message.innerHTML =
            "<p class='error'>Origin and destination cannot be identical.</p>";
  
        return;
  
    }
  
  
  
    if (
  
        departDate == "" ||
        !dateInRange(departDate)
  
    ) {
  
        message.innerHTML =
            "<p class='error'>Departure date must be between September 1 and December 1, 2024.</p>";
  
        return;
  
    }
  
    if (tripType == "round") {
  
        if (
  
            returnDate == "" ||
            !dateInRange(returnDate)
  
        ) {
  
            message.innerHTML =
                "<p class='error'>Return date is invalid.</p>";
  
            return;
  
        }
  
        if (
  
            new Date(returnDate) <
            new Date(departDate)
  
        ) {
  
            message.innerHTML =
                "<p class='error'>Return date cannot be before departure date.</p>";
  
            return;
  
        }
  
    }
  
    var summary =
        "<div class='result'>" +
        "<h3>Flight Search</h3>" +
        "<p><b>Trip:</b> " +
        (tripType == "oneway" ? "One Way" : "Round Trip") +
        "</p>" +
  
        "<p><b>Origin:</b> " +
        formatCityName(origin) +
        "</p>" +
  
        "<p><b>Destination:</b> " +
        formatCityName(destination) +
        "</p>" +
  
        "<p><b>Departure:</b> " +
        departDate +
        "</p>";
  
    if (tripType == "round") {
  
        summary +=
            "<p><b>Return:</b> " +
            returnDate +
            "</p>";
  
    }
  
    summary +=
  
        "<p><b>Adults:</b> " + adults + "</p>" +
        "<p><b>Children:</b> " + children + "</p>" +
        "<p><b>Infants:</b> " + infants + "</p>" +
        "</div>";
  
    message.innerHTML = summary;
  
    var totalPassengers =
        adults + children + infants;
  
    loadFlightsJson()
  
        .then(function (flights) {
  
            var departing =
                findAvailableFlights(
  
                    flights,
                    origin,
                    destination,
                    departDate,
                    totalPassengers
  
                );
  
            displayFlights(
  
                departing,
                "Departing Flights",
                "departing",
                tripType,
                adults,
                children,
                infants
  
            );
  
            if (tripType == "round") {
  
                var returning =
                    findAvailableFlights(
  
                        flights,
                        destination,
                        origin,
                        returnDate,
                        totalPassengers
  
                    );
  
                displayFlights(
  
                    returning,
                    "Returning Flights",
                    "returning",
                    tripType,
                    adults,
                    children,
                    infants
  
                );
  
            }
  
        })
  
        .catch(function (error) {
  
            results.innerHTML =
                "<p class='error'>" +
                error.message +
                "</p>";
  
        });
  
  }
  
  // same pricing rule the cart used to use: full price for adults,
  // 70% for children, 10% for infants
  function legTotal(flight, adults, children, infants) {
      var adultPrice = flight.price;
      var childPrice = flight.price * 0.7;
      var infantPrice = flight.price * 0.1;
  
      return (adults * adultPrice) + (children * childPrice) + (infants * infantPrice);
  }
  
  function goToCart(){
  
      var tripType =
          document.getElementById("tripType").value;
  
      if(selectedDepartingFlight == null){
  
          alert("Please select a departing flight.");
  
          return;
      }
  
      if(tripType == "round" &&
         selectedReturningFlight == null){
  
          alert("Please select a returning flight.");
  
          return;
      }
  
      var adults = parseInt(document.getElementById("adults").value);
      var children = parseInt(document.getElementById("children").value);
      var infants = parseInt(document.getElementById("infants").value);
  
      var total = legTotal(selectedDepartingFlight, adults, children, infants);
  
      if (tripType == "round" && selectedReturningFlight != null) {
          total += legTotal(selectedReturningFlight, adults, children, infants);
      }
  
      // this needs to go into the SAME "cartItems" array that stays.js and
      // cars.js already use, with type: "flight", so the cart page can find
      // it alongside any hotels or cars the user also added
      var cartEntry = {
          type: "flight",
          tripType: tripType,
          departingFlight: selectedDepartingFlight,
          returningFlight: (tripType == "round") ? selectedReturningFlight : null,
          adults: adults,
          children: children,
          infants: infants,
          totalPrice: total.toFixed(2)
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
  
      window.location.href = "cart.html";
  
  }
  
  function displayFlights(
      flights,
      heading,
      type,
      tripType,
      adults,
      children,
      infants
  ) {
  
      const results = document.getElementById("flightResults");
  
      let html = `
          <div class="result">
              <h3>${heading}</h3>
      `;
  
      if (flights.length === 0) {
  
          html += "<p>No matching flights found.</p>";
  
      } else {
  
          flights.forEach(function (flight) {
  
              html += `
                  <div class="hotel-card">
  
                      <p><strong>Flight ID:</strong> ${flight.flightId}</p>
  
                      <p><strong>Origin:</strong>
                      ${flight.origin}</p>
  
                      <p><strong>Destination:</strong>
                      ${flight.destination}</p>
  
                      <p><strong>Departure Date:</strong>
                      ${flight.departureDate}</p>
  
                      <p><strong>Arrival Date:</strong>
                      ${flight.arrivalDate}</p>
  
                      <p><strong>Departure Time:</strong>
                      ${flight.departureTime}</p>
  
                      <p><strong>Arrival Time:</strong>
                      ${flight.arrivalTime}</p>
  
                      <p><strong>Available Seats:</strong>
                      ${flight.availableSeats}</p>
  
                      <button
                          class="btn-select"
                          onclick="selectFlight('${flight.flightId}','${type}')">
  
                          Add to Cart
  
                      </button>
  
                  </div>
              `;
  
          });
  
      }
  
      html += "</div>";
  
      results.innerHTML += html;
  
      if (tripType === "oneway" ||
          (tripType === "round" &&
           heading === "Returning Flights")) {
  
          results.innerHTML += `
              <button
                  class="btn-select"
                  onclick="goToCart()">
  
                  Proceed to Cart
  
              </button>
          `;
      }
  
  }