// ======================================================
// account.js - the my-account page (sections 6, 8 and 9)
//
// The admin data loaders, and all twelve reports. Every report answers in
// the same {tables, summary, note} shape, so one renderer draws them all.
// ======================================================

// The reports that read extra input from a form on the page. Anything not
// listed here just runs.
var QUERY_FORMS = {
    booking_lookup: "#q_booking_lookup",
    booking_passengers: "#q_booking_passengers",
    flights_by_ssn: "#q_flights_by_ssn"
};


function loadFlights() {
    runLoader("api/admin_load_flights.php");
}


function loadHotels() {
    runLoader("api/admin_load_hotels.php");
}


function runLoader(url) {
    $("#loaderMessage").html('<p class="spinner">Loading...</p>');

    postJson(url, {})
        .done(function (res) {
            showOk("loaderMessage", res.message);

            // The row counts at the top of the page are now out of date.
            $("#loaderMessage").append(
                '<p class="saved-note">' +
                '<a href="my-account.php">Reload the page</a> to update the counts.</p>'
            );
        })
        .fail(function (message) {
            showError("loaderMessage", message);
        });
}


function runQuery(queryName) {
    clearBox("queryResults");
    $("#queryMessage").html('<p class="spinner">Running...</p>');

    var data = { query: queryName };
    var formSelector = QUERY_FORMS[queryName];

    if (formSelector) {
        // serializeArray so the form fields merge into the query name rather
        // than replacing it.
        $(formSelector).serializeArray().forEach(function (field) {
            data[field.name] = field.value;
        });
    }

    postJson("api/account_query.php", data)
        .done(function (res) {
            clearBox("queryMessage");
            renderResults(res);
        })
        .fail(function (message) {
            showError("queryMessage", message);
        });
}


function renderResults(res) {
    var html = "";

    if (res.summary) {
        html += '<div class="result"><h3>' + esc(res.summary.label) + "</h3>";
        html += '<p class="big-number">' + esc(res.summary.value) + "</p></div>";
    }

    if (res.note) {
        html += '<p class="saved-note">' + esc(res.note) + "</p>";
    }

    (res.tables || []).forEach(function (table) {
        html += renderTable(table);
    });

    $("#queryResults").html(html);

    // Long reports push the results below the fold, so bring them into view.
    var results = document.getElementById("queryResults");

    if (results) {
        results.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}


function renderTable(table) {
    var html = '<div class="hotel-list"><h3>' + esc(table.title) + "</h3>";

    if (!table.rows.length) {
        html += '<p class="muted">' + esc(table.empty) + "</p></div>";
        return html;
    }

    html += '<p class="saved-note">' + table.rows.length + " row" +
        (table.rows.length === 1 ? "" : "s") + ".</p>";

    html += '<table class="report-table"><thead><tr>';

    table.columns.forEach(function (column) {
        html += "<th>" + esc(column.label) + "</th>";
    });

    html += "</tr></thead><tbody>";

    table.rows.forEach(function (row) {
        html += "<tr>";

        table.columns.forEach(function (column) {
            var value = row[column.key];

            if (value === null || value === undefined || value === "") {
                html += '<td class="muted">&mdash;</td>';
            } else if (column.money) {
                html += "<td>" + money(value) + "</td>";
            } else {
                html += "<td>" + esc(value) + "</td>";
            }
        });

        html += "</tr>";
    });

    return html + "</tbody></table></div>";
}
