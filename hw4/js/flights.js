// ======================================================
// flights.js - the flight search page (section 7)
//
// Collects the form, posts it to api/search_flights.php, and draws the
// results. The server does the validating and the searching; this file
// only asks and renders.
// ======================================================

// Which flight is currently chosen for each leg, so the cards can show it.
var selectedLegs = { departing: null, returning: null };


function isRoundTrip() {
    return $("input[name='tripType']:checked").val() === "round";
}


function onTripTypeChange() {
    if (isRoundTrip()) {
        $("#returnDateField").show();
    } else {
        $("#returnDateField").hide();
        $("#returnDate").val("");
    }
}


function togglePassengerBox() {
    $("#passengerBox").toggle();
}


function updatePaxSummary() {
    var labels = { adult: ["adult", "adults"], child: ["child", "children"], infant: ["infant", "infants"] };
    var parts = [];

    ["adult", "child", "infant"].forEach(function (category) {
        var count = parseInt($("#" + category).val(), 10) || 0;

        if (count > 0) {
            parts.push(count + " " + labels[category][count === 1 ? 0 : 1]);
        }
    });

    $("#paxSummary").text(parts.length ? parts.join(", ") : "no passengers");
}


function searchFlights() {
    clearBox("searchSummary");
    clearBox("flightResults");
    $("#searchMessage").html('<p class="spinner">Searching...</p>');

    selectedLegs = { departing: null, returning: null };

    postJson("api/search_flights.php", $("#flightSearchForm").serialize())
        .done(function (res) {
            clearBox("searchMessage");
            renderSearchSummary(res.criteria);
            renderResults(res);
        })
        .fail(function (message) {
            showError("searchMessage", message);
        });
}


// Section 7: display everything the user entered, alongside the results.
function renderSearchSummary(criteria) {
    var html = '<div class="result"><h3>Your search</h3>';

    html += "<p><strong>Trip type:</strong> " +
        (criteria.tripType === "round" ? "Round trip" : "One way trip") + "</p>";
    html += "<p><strong>Origin:</strong> " + esc(criteria.origin) + "</p>";
    html += "<p><strong>Destination:</strong> " + esc(criteria.destination) + "</p>";
    html += "<p><strong>Departure date:</strong> " + esc(criteria.departureDate) + "</p>";

    if (criteria.tripType === "round") {
        html += "<p><strong>Return date:</strong> " + esc(criteria.returnDate) + "</p>";
    }

    html += "<p><strong>Passengers:</strong> " + esc(criteria.passengerText) +
        " (" + criteria.passengers + " total)</p>";

    html += "</div>";

    $("#searchSummary").html(html);
}


function renderResults(res) {
    var html = "";

    html += renderLeg("departing", "Departing flights", res.outbound, res.criteria);

    if (res.criteria.tripType === "round") {
        html += renderLeg("returning", "Returning flights", res.inbound, res.criteria);
    }

    html += '<div id="cartMessage"></div>';
    html += '<div id="selectionState"></div>';

    $("#flightResults").html(html);

    renderSelectionState(res.criteria);
}


function renderLeg(leg, heading, result, criteria) {
    var html = '<div class="hotel-list"><h3>' + heading + "</h3>";

    if (result.widened) {
        html += '<p class="saved-note">Nothing flies on the exact date you asked for, ' +
            "so these are the flights between " + esc(result.from) +
            " and " + esc(result.to) + ".</p>";
    }

    if (!result.flights.length) {
        html += '<p class="muted">No flights with ' + criteria.passengers +
            " seats available within 3 days of that date.</p></div>";
        return html;
    }

    result.flights.forEach(function (flight) {
        html += renderFlightCard(flight, leg);
    });

    return html + "</div>";
}


function renderFlightCard(flight, leg) {
    var chosen = selectedLegs[leg] === flight.flight_id;

    var html = '<div class="hotel-card' + (chosen ? " selected-card" : "") +
        '" id="' + leg + "-" + esc(flight.flight_id) + '">';

    html += "<h4>Flight " + esc(flight.flight_id) + " &mdash; " +
        esc(flight.origin) + " to " + esc(flight.destination) + "</h4>";

    html += "<p><strong>Departs:</strong> " + esc(flight.departure_date) +
        " at " + esc(flight.departure_time) + "</p>";
    html += "<p><strong>Arrives:</strong> " + esc(flight.arrival_date) +
        " at " + esc(flight.arrival_time) + "</p>";
    html += "<p><strong>Available seats:</strong> " + esc(flight.available_seats) + "</p>";
    html += "<p><strong>Adult fare:</strong> " + money(flight.price) + "</p>";

    html += '<button class="btn-select" onclick="selectFlight(\'' +
        esc(flight.flight_id) + "', '" + leg + "')\">" +
        (chosen ? "Selected as " + leg + " flight" : "Select as " + leg + " flight") +
        "</button>";

    return html + "</div>";
}


function selectFlight(flightId, leg) {
    postJson("api/cart_add.php", { kind: "flight", flightId: flightId, leg: leg })
        .done(function (res) {
            selectedLegs[leg] = flightId;

            showOk("cartMessage", res.message);
            highlightSelection(leg, flightId);
            renderSelectionState(res.cart);
        })
        .fail(function (message) {
            showError("cartMessage", message);
        });
}


function highlightSelection(leg, flightId) {
    // Only one card per leg stays highlighted.
    $("[id^='" + leg + "-']").removeClass("selected-card")
        .find("button").each(function () {
            $(this).text("Select as " + leg + " flight");
        });

    var card = $("#" + leg + "-" + flightId);
    card.addClass("selected-card");
    card.find("button").text("Selected as " + leg + " flight");
}


function renderSelectionState(cart) {
    if (!cart) {
        return;
    }

    var needsBoth = cart.tripType === "round";
    var haveOut = !!(cart.departing || selectedLegs.departing);
    var haveBack = !!(cart.returning || selectedLegs.returning);

    var html = "";

    if (needsBoth && !(haveOut && haveBack)) {
        html = '<p class="saved-note">Select both legs, then head to the ' +
            '<a href="cart.php">cart</a> to book.</p>';
    } else if (haveOut) {
        html = '<p class="ok-note">Ready to book. Go to the ' +
            '<a href="cart.php">cart</a> to enter passenger details.</p>';
    }

    $("#selectionState").html(html);
}


$(function () {
    onTripTypeChange();
    updatePaxSummary();
});
