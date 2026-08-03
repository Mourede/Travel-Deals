// ======================================================
// script.js - loaded on every page
//
// The live date and time (section 2) and the two display controls
// (section 5). Both controls are remembered in localStorage so they
// carry across pages instead of resetting on every navigation.
// ======================================================

var DISPLAY_KEYS = {
    fontSize: "mainFontSize",
    bgColor: "pageBgColor"
};


// ---------------------------
// Display current date & time
// ---------------------------
function updateDateTime() {
    const now = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    };

    const box = document.getElementById("datetime");

    if (box) {
        box.innerHTML = now.toLocaleString("en-US", options);
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);


// ---------------------------
// Change font size
//
// The assignment asks for the font size of the *main content*, so this
// sets it on #mainContent only and leaves the header, navigation bar and
// footer alone. Font sizes inside .main are in em in mystyle.css so they
// scale with whatever is set here.
// ---------------------------
function changeFont() {
    const input = document.getElementById("fontSize");

    let size = parseInt(input.value, 10);

    if (isNaN(size)) {
        size = 16;
    }

    if (size < 10) {
        size = 10;
    }

    if (size > 30) {
        size = 30;
    }

    input.value = size;

    applyFontSize(size);
    localStorage.setItem(DISPLAY_KEYS.fontSize, size);
}

function applyFontSize(size) {
    const main = document.getElementById("mainContent");

    if (main) {
        main.style.fontSize = size + "px";
    }
}


// ---------------------------
// Change background color
// ---------------------------
function changeBg() {
    const color = document.getElementById("bgColor").value;

    applyBg(color);
    localStorage.setItem(DISPLAY_KEYS.bgColor, color);
}

function applyBg(color) {
    document.body.style.backgroundColor = color;
}


function restoreDisplaySettings() {

    const sizeInput = document.getElementById("fontSize");
    const colorInput = document.getElementById("bgColor");

    const savedSize = localStorage.getItem(DISPLAY_KEYS.fontSize);
    const savedColor = localStorage.getItem(DISPLAY_KEYS.bgColor);

    if (sizeInput) {
        if (savedSize != null) {
            sizeInput.value = savedSize;
        }

        applyFontSize(parseInt(sizeInput.value, 10) || 16);
    }

    if (colorInput) {
        if (savedColor != null) {
            colorInput.value = savedColor;
        }

        applyBg(colorInput.value);
    }
}


// ---------------------------
// Shared helpers for the page scripts
// ---------------------------

// Escapes anything that came from the database or the user before it
// goes into innerHTML.
function esc(value) {
    return $("<span>").text(value == null ? "" : value).html();
}

function money(value) {
    return "$" + Number(value).toFixed(2);
}

function showError(containerId, message) {
    $("#" + containerId).html('<div class="error">' + esc(message) + "</div>");
}

function showOk(containerId, message) {
    $("#" + containerId).html('<div class="ok-note">' + esc(message) + "</div>");
}

function clearBox(containerId) {
    $("#" + containerId).empty();
}

// Every endpoint answers {ok: false, error: "..."} on failure, including
// the 401 when the session has expired, so one handler covers them all.
function postJson(url, data) {
    return $.ajax({
        url: url,
        type: "POST",
        data: data,
        dataType: "json"
    }).then(null, function (xhr) {
        var message = "Could not reach the server. Is MySQL running?";

        if (xhr.responseJSON && xhr.responseJSON.error) {
            message = xhr.responseJSON.error;
        }

        return $.Deferred().reject(message).promise();
    });
}

$(function () {
    restoreDisplaySettings();
});
