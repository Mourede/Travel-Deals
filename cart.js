// ======================================================
// cart.js
// Handles the cart page: showing selected flight(s),
// price summary, passenger forms, and booking.
// ======================================================

var cartData = null;
var passengerCount = 0;

// ----------------------------------------------------
// Init
// ----------------------------------------------------

window.addEventListener("DOMContentLoaded", function () {

    initCart();

});

function initCart() {

    var raw = localStorage.getItem("cart");

    if (raw == null) {

        document.getElementById("cartFlights").innerHTML +=
            "<p class='error'>Your cart is empty. Please search and select a flight first.</p>";

        return;

    }

    cartData = JSON.parse(raw);

    renderCartFlights();

    renderPriceSummary();

    renderPassengerForms();

}

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------

function flightCardHtml(flight, label) {

    return (
        "<div class='hotel-card'>" +
        "<h4>" + label + "</h4>" +
        "<p><strong>Flight ID:</strong> " + flight.flightId + "</p>" +
        "<p><strong>Origin:</strong> " + flight.origin + "</p>" +
        "<p><strong>Destination:</strong> " + flight.destination + "</p>" +
        "<p><strong>Departure Date:</strong> " + flight.departureDate + "</p>" +
        "<p><strong>Arrival Date:</strong> " + flight.arrivalDate + "</p>" +
        "<p><strong>Departure Time:</strong> " + flight.departureTime + "</p>" +
        "<p><strong>Arrival Time:</strong> " + flight.arrivalTime + "</p>" +
        "</div>"
    );

}

function legTotal(flight, adults, children, infants) {

    var adultPrice = flight.price;
    var childPrice = flight.price * 0.7;
    var infantPrice = flight.price * 0.1;

    return (
        (adults * adultPrice) +
        (children * childPrice) +
        (infants * infantPrice)
    );

}

// ----------------------------------------------------
// Render selected flight(s)
// ----------------------------------------------------

function renderCartFlights() {

    var container = document.getElementById("cartFlights");

    var html = "<h3>Selected Flight(s)</h3>";

    html += flightCardHtml(cartData.departingFlight, "Departing Flight");

    if (cartData.tripType == "round" &&
        cartData.returningFlight != null) {

        html += flightCardHtml(cartData.returningFlight, "Returning Flight");

    }

    container.innerHTML = html;

}

// ----------------------------------------------------
// Render price summary
// ----------------------------------------------------

function renderPriceSummary() {

    var container = document.getElementById("priceSummary");

    var adults = cartData.adults;
    var children = cartData.children;
    var infants = cartData.infants;

    var total = legTotal(
        cartData.departingFlight,
        adults,
        children,
        infants
    );

    if (cartData.tripType == "round" &&
        cartData.returningFlight != null) {

        total += legTotal(
            cartData.returningFlight,
            adults,
            children,
            infants
        );

    }

    var html = "<h3>Total Price</h3>";

    html += "<p><strong>Adults:</strong> " + adults + "</p>";
    html += "<p><strong>Children:</strong> " + children + "</p>";
    html += "<p><strong>Infants:</strong> " + infants + "</p>";
    html += "<p><strong>Total Price:</strong> $" + total.toFixed(2) + "</p>";

    container.innerHTML = html;

    cartData.totalPrice = total;

}

// ----------------------------------------------------
// Render passenger forms
// ----------------------------------------------------

function renderPassengerForms() {

    var container = document.getElementById("passengerForms");

    var html = "<h3>Passenger Information</h3>";

    var index = 0;

    for (var a = 1; a <= cartData.adults; a++) {

        html += passengerFormHtml(index, "Adult " + a);
        index++;

    }

    for (var c = 1; c <= cartData.children; c++) {

        html += passengerFormHtml(index, "Child " + c);
        index++;

    }

    for (var i = 1; i <= cartData.infants; i++) {

        html += passengerFormHtml(index, "Infant " + i);
        index++;

    }

    passengerCount = index;

    container.innerHTML = html;

}

function passengerFormHtml(index, label) {

    return (
        "<div class='passenger-form' id='passengerForm_" + index + "'>" +

        "<h4>" + label + "</h4>" +

        "<label>First Name" +
        "<input type='text' id='firstName_" + index + "'></label>" +

        "<label>Last Name" +
        "<input type='text' id='lastName_" + index + "'></label>" +

        "<label>Date of Birth" +
        "<input type='date' id='dob_" + index + "'></label>" +

        "<label>SSN (9 digits)" +
        "<input type='text' id='ssn_" + index + "' maxlength='9'></label>" +

        "</div>"
    );

}

// ----------------------------------------------------
// Validate passengers
// ----------------------------------------------------

function validatePassengers() {

    var passengers = [];

    var ssnRegex = /^\d{9}$/;

    for (var i = 0; i < passengerCount; i++) {

        var firstName =
            document.getElementById("firstName_" + i).value.trim();

        var lastName =
            document.getElementById("lastName_" + i).value.trim();

        var dob =
            document.getElementById("dob_" + i).value;

        var ssn =
            document.getElementById("ssn_" + i).value.trim();

        if (firstName == "" ||
            lastName == "" ||
            dob == "" ||
            ssn == "") {

            return {
                error: "Please fill in all fields for every passenger."
            };

        }

        if (!ssnRegex.test(ssn)) {

            return {
                error: "SSN must be exactly 9 digits (passenger " + (i + 1) + ")."
            };

        }

        if (new Date(dob) > new Date()) {

            return {
                error: "Date of birth cannot be in the future (passenger " + (i + 1) + ")."
            };

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

// ----------------------------------------------------
// User id
// ----------------------------------------------------

function getUserId() {

    var userId = localStorage.getItem("userId");

    if (userId == null) {

        userId = "U" + Date.now();

        localStorage.setItem("userId", userId);

    }

    return userId;

}

// ----------------------------------------------------
// Booking number
// ----------------------------------------------------

function generateBookingNumber() {

    return "BK" + Date.now() + Math.floor(Math.random() * 1000);

}

// ----------------------------------------------------
// Update seat counts in simulated flights.json (localStorage)
// ----------------------------------------------------

function updateSeatCounts(flight, totalPassengers) {

    var saved = JSON.parse(localStorage.getItem("flightSeatCounts"));

    if (saved == null) {

        saved = {};

    }

    var currentSeats =
        saved[flight.flightId] != null ?
        saved[flight.flightId] :
        flight.availableSeats;

    saved[flight.flightId] = currentSeats - totalPassengers;

    localStorage.setItem(
        "flightSeatCounts",
        JSON.stringify(saved)
    );

}

// ----------------------------------------------------
// Save booking record (simulated JSON file via localStorage)
// ----------------------------------------------------

function saveBooking(booking) {

    var bookings = JSON.parse(localStorage.getItem("bookings"));

    if (bookings == null) {

        bookings = [];

    }

    bookings.push(booking);

    localStorage.setItem(
        "bookings",
        JSON.stringify(bookings)
    );

}

// ----------------------------------------------------
// Book flight(s)
// ----------------------------------------------------

function bookFlights() {

    var confirmation =
        document.getElementById("bookingConfirmation");

    confirmation.innerHTML = "";

    if (cartData == null) {

        confirmation.innerHTML =
            "<p class='error'>Your cart is empty.</p>";

        return;

    }

    var validation = validatePassengers();

    if (validation.error) {

        confirmation.innerHTML =
            "<p class='error'>" + validation.error + "</p>";

        return;

    }

    var passengers = validation.passengers;

    var totalPassengers =
        cartData.adults + cartData.children + cartData.infants;

    var userId = getUserId();

    var bookingNumber = generateBookingNumber();

    var flightsBooked = [cartData.departingFlight];

    if (cartData.tripType == "round" &&
        cartData.returningFlight != null) {

        flightsBooked.push(cartData.returningFlight);

    }

    for (var i = 0; i < flightsBooked.length; i++) {

        updateSeatCounts(flightsBooked[i], totalPassengers);

    }

    var booking = {

        userId: userId,
        bookingNumber: bookingNumber,
        tripType: cartData.tripType,
        totalPrice: cartData.totalPrice,
        flights: flightsBooked.map(function (f) {

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
        passengers: passengers

    };

    saveBooking(booking);

    renderConfirmation(booking);

    localStorage.removeItem("cart");

}

// ----------------------------------------------------
// Render confirmation
// ----------------------------------------------------

function renderConfirmation(booking) {

    var confirmation =
        document.getElementById("bookingConfirmation");

    var html =
        "<div class='result'>" +
        "<h3>Booking Confirmed</h3>" +
        "<p><strong>User ID:</strong> " + booking.userId + "</p>" +
        "<p><strong>Booking Number:</strong> " + booking.bookingNumber + "</p>" +
        "<p><strong>Total Price:</strong> $" + booking.totalPrice.toFixed(2) + "</p>";

    booking.flights.forEach(function (f) {

        html +=
            "<div class='hotel-card'>" +
            "<p><strong>Flight ID:</strong> " + f.flightId + "</p>" +
            "<p><strong>Origin:</strong> " + f.origin + "</p>" +
            "<p><strong>Destination:</strong> " + f.destination + "</p>" +
            "<p><strong>Departure Date:</strong> " + f.departureDate + "</p>" +
            "<p><strong>Arrival Date:</strong> " + f.arrivalDate + "</p>" +
            "<p><strong>Departure Time:</strong> " + f.departureTime + "</p>" +
            "<p><strong>Arrival Time:</strong> " + f.arrivalTime + "</p>" +
            "</div>";

    });

    html += "<h4>Passengers</h4>";

    booking.passengers.forEach(function (p) {

        html +=
            "<div class='hotel-card'>" +
            "<p><strong>Name:</strong> " + p.firstName + " " + p.lastName + "</p>" +
            "<p><strong>Date of Birth:</strong> " + p.dateOfBirth + "</p>" +
            "<p><strong>SSN:</strong> " + p.ssn + "</p>" +
            "</div>";

    });

    html += "</div>";

    confirmation.innerHTML = html;

}
