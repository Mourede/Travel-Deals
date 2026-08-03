// ======================================================
// stays.js - the hotel search page (section 8)
// ======================================================

function toggleGuestBox() {
    $("#passengerBox").toggle();
}


function updateGuestSummary() {
    var labels = { adult: ["adult", "adults"], child: ["child", "children"], infant: ["infant", "infants"] };
    var parts = [];

    ["adult", "child", "infant"].forEach(function (category) {
        var count = parseInt($("#" + category).val(), 10) || 0;

        if (count > 0) {
            parts.push(count + " " + labels[category][count === 1 ? 0 : 1]);
        }
    });

    $("#guestSummary").text(parts.length ? parts.join(", ") : "no guests");
}


function searchHotels() {
    clearBox("searchSummary");
    clearBox("hotelResults");
    $("#searchMessage").html('<p class="spinner">Searching...</p>');

    postJson("api/search_hotels.php", $("#hotelSearchForm").serialize())
        .done(function (res) {
            clearBox("searchMessage");
            renderSearchSummary(res.criteria);
            renderHotels(res.hotels, res.criteria);
        })
        .fail(function (message) {
            showError("searchMessage", message);
        });
}


// Section 8: display everything entered, plus the number of rooms needed.
function renderSearchSummary(criteria) {
    var html = '<div class="result"><h3>Your search</h3>';

    html += "<p><strong>City:</strong> " + esc(criteria.city) + "</p>";
    html += "<p><strong>Check in date:</strong> " + esc(criteria.checkInDate) + "</p>";
    html += "<p><strong>Check out date:</strong> " + esc(criteria.checkOutDate) + "</p>";
    html += "<p><strong>Nights:</strong> " + esc(criteria.nights) + "</p>";
    html += "<p><strong>Guests:</strong> " + esc(criteria.guestText) +
        " (" + criteria.guests + " total)</p>";
    html += "<p><strong>Rooms you need:</strong> " + esc(criteria.rooms) + "</p>";
    html += '<p class="saved-note">Two guests to a room. Infants stay with an ' +
        "adult, so they do not add a room.</p>";

    html += "</div>";

    $("#searchSummary").html(html);
}


function renderHotels(hotels, criteria) {
    var html = '<div class="hotel-list"><h3>Hotels in ' + esc(criteria.city) + "</h3>";

    if (!hotels.length) {
        html += '<p class="muted">No hotels listed in that city.</p></div>';
        $("#hotelResults").html(html);
        return;
    }

    hotels.forEach(function (hotel) {
        html += '<div class="hotel-card">';
        html += "<h4>" + esc(hotel.hotel_name) + "</h4>";

        html += "<p><strong>Hotel id:</strong> " + esc(hotel.hotel_id) + "</p>";
        html += "<p><strong>Hotel name:</strong> " + esc(hotel.hotel_name) + "</p>";
        html += "<p><strong>City:</strong> " + esc(hotel.city) + "</p>";
        html += "<p><strong>Price per night:</strong> " + money(hotel.price_per_night) + "</p>";
        html += '<p class="saved-note">' + criteria.rooms + " room" +
            (criteria.rooms === 1 ? "" : "s") + " &times; " + criteria.nights +
            " night" + (criteria.nights === 1 ? "" : "s") + " = " +
            money(hotel.stay_total) + " total</p>";

        html += '<button class="btn-select" onclick="selectHotel(\'' +
            esc(hotel.hotel_id) + "')\">Select this hotel</button>";

        html += "</div>";
    });

    html += "</div>";
    html += '<div id="cartMessage"></div>';

    $("#hotelResults").html(html);
}


function selectHotel(hotelId) {
    postJson("api/cart_add.php", { kind: "hotel", hotelId: hotelId })
        .done(function (res) {
            $("#cartMessage").html(
                '<div class="ok-note">' + esc(res.message) +
                ' Go to the <a href="cart.php">cart</a> to enter guest details ' +
                "and book.</div>"
            );
        })
        .fail(function (message) {
            showError("cartMessage", message);
        });
}


$(function () {
    updateGuestSummary();
});
