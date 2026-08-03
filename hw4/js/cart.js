// ======================================================
// cart.js - booking from the cart (sections 7 and 8)
//
// The cart contents are rendered by cart.php. This file posts the
// traveller forms to the booking endpoints and draws the confirmation
// the assignment asks for afterwards.
// ======================================================

function bookFlight() {
    $("#bookingMessage").html('<p class="spinner">Booking...</p>');

    postJson("api/book_flight.php", $("#flightPassengerForm").serialize())
        .done(function (res) {
            clearBox("bookingMessage");
            renderFlightConfirmation(res);

            // The cart entry is gone now, so drop the form rather than
            // leaving a Book button that would fail.
            $("#flightPassengerForm").closest(".hotel-list").remove();
        })
        .fail(function (message) {
            showError("bookingMessage", message);
        });
}


function bookHotel() {
    $("#bookingMessage").html('<p class="spinner">Booking...</p>');

    postJson("api/book_hotel.php", $("#hotelGuestForm").serialize())
        .done(function (res) {
            clearBox("bookingMessage");
            renderHotelConfirmation(res);

            $("#hotelGuestForm").closest(".hotel-list").remove();
        })
        .fail(function (message) {
            showError("bookingMessage", message);
        });
}


function removeFromCart(kind) {
    postJson("api/cart_remove.php", { kind: kind })
        .done(function () {
            window.location.reload();
        })
        .fail(function (message) {
            showError("bookingMessage", message);
        });
}


// Section 7: after booking, show the booking id, the flight details, the
// group total, and a ticket line for every passenger on every leg.
function renderFlightConfirmation(res) {
    var html = '<div class="result confirmation"><h3>' + esc(res.message) + "</h3>";

    html += "<p><strong>Trip type:</strong> " +
        (res.tripType === "round" ? "Round trip" : "One way trip") + "</p>";
    html += "<p><strong>Passengers:</strong> " + esc(res.passengers) + "</p>";
    html += "<p><strong>Total for the whole trip:</strong> " + money(res.grandTotal) + "</p>";
    html += "</div>";

    res.bookings.forEach(function (booking) {
        html += '<div class="hotel-card confirmation">';
        html += "<h4>" + esc(booking.leg) + " &mdash; flight booking id " +
            esc(booking.flightBookingId) + "</h4>";

        html += "<p><strong>Flight booking id:</strong> " + esc(booking.flightBookingId) + "</p>";
        html += "<p><strong>Flight id:</strong> " + esc(booking.flightId) + "</p>";
        html += "<p><strong>Origin:</strong> " + esc(booking.origin) + "</p>";
        html += "<p><strong>Destination:</strong> " + esc(booking.destination) + "</p>";
        html += "<p><strong>Departure date:</strong> " + esc(booking.departureDate) + "</p>";
        html += "<p><strong>Arrival date:</strong> " + esc(booking.arrivalDate) + "</p>";
        html += "<p><strong>Departure time:</strong> " + esc(booking.departureTime) + "</p>";
        html += "<p><strong>Arrival time:</strong> " + esc(booking.arrivalTime) + "</p>";
        html += "<p><strong>Total price for all passengers:</strong> " +
            money(booking.totalPrice) + "</p>";
        html += '<p class="saved-note">Seats left on this flight: ' +
            esc(booking.seatsRemaining) + "</p>";

        html += ticketTable(booking.tickets);
        html += "</div>";
    });

    $("#confirmation").html(html);
}


function ticketTable(tickets) {
    var html = '<table class="report-table"><thead><tr>' +
        "<th>Ticket id</th><th>Flight booking id</th><th>SSN</th>" +
        "<th>First name</th><th>Last name</th><th>Date of birth</th>" +
        "<th>Category</th><th>Price</th>" +
        "</tr></thead><tbody>";

    tickets.forEach(function (ticket) {
        html += "<tr>" +
            "<td>" + esc(ticket.ticketId) + "</td>" +
            "<td>" + esc(ticket.flightBookingId) + "</td>" +
            "<td>" + esc(ticket.ssn) + "</td>" +
            "<td>" + esc(ticket.firstName) + "</td>" +
            "<td>" + esc(ticket.lastName) + "</td>" +
            "<td>" + esc(ticket.dob) + "</td>" +
            "<td>" + esc(ticket.category) + "</td>" +
            "<td>" + money(ticket.price) + "</td>" +
            "</tr>";
    });

    return html + "</tbody></table>";
}


// Section 8: after booking, show the hotel, the stay, the totals, and
// every guest.
function renderHotelConfirmation(res) {
    var booking = res.booking;

    var html = '<div class="result confirmation"><h3>' + esc(res.message) + "</h3>";
    html += "<p><strong>Hotel booking id:</strong> " + esc(booking.hotelBookingId) + "</p>";
    html += "</div>";

    html += '<div class="hotel-card confirmation">';
    html += "<h4>" + esc(booking.hotelName) + "</h4>";

    html += "<p><strong>Hotel booking id:</strong> " + esc(booking.hotelBookingId) + "</p>";
    html += "<p><strong>Hotel id:</strong> " + esc(booking.hotelId) + "</p>";
    html += "<p><strong>Hotel name:</strong> " + esc(booking.hotelName) + "</p>";
    html += "<p><strong>City:</strong> " + esc(booking.city) + "</p>";
    html += "<p><strong>Price per night for each room:</strong> " +
        money(booking.pricePerNight) + "</p>";
    html += "<p><strong>Number of rooms:</strong> " + esc(booking.rooms) + "</p>";
    html += "<p><strong>Check in date:</strong> " + esc(booking.checkInDate) + "</p>";
    html += "<p><strong>Check out date:</strong> " + esc(booking.checkOutDate) + "</p>";
    html += "<p><strong>Nights:</strong> " + esc(booking.nights) + "</p>";
    html += "<p><strong>Total price:</strong> " + money(booking.totalPrice) + "</p>";

    html += guestTable(booking.guests);
    html += "</div>";

    $("#confirmation").html(html);
}


function guestTable(guests) {
    var html = '<table class="report-table"><thead><tr>' +
        "<th>SSN</th><th>First name</th><th>Last name</th>" +
        "<th>Date of birth</th><th>Category</th>" +
        "</tr></thead><tbody>";

    guests.forEach(function (guest) {
        html += "<tr>" +
            "<td>" + esc(guest.ssn) + "</td>" +
            "<td>" + esc(guest.firstName) + "</td>" +
            "<td>" + esc(guest.lastName) + "</td>" +
            "<td>" + esc(guest.dob) + "</td>" +
            "<td>" + esc(guest.category) + "</td>" +
            "</tr>";
    });

    return html + "</tbody></table>";
}
