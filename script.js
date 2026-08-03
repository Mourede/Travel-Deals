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

// Update immediately
updateDateTime();

// Update every second
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
    localStorage.setItem(TravelData.KEYS.fontSize, size);
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
    localStorage.setItem(TravelData.KEYS.bgColor, color);
}

function applyBg(color) {
    document.body.style.backgroundColor = color;
}


// ---------------------------
// Initialize page
//
// Both settings are remembered in localStorage so they carry across every
// page instead of resetting each time the user navigates.
// ---------------------------
function restoreDisplaySettings() {

    const sizeInput = document.getElementById("fontSize");
    const colorInput = document.getElementById("bgColor");

    const savedSize = localStorage.getItem(TravelData.KEYS.fontSize);
    const savedColor = localStorage.getItem(TravelData.KEYS.bgColor);

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

window.onload = function () {
    restoreDisplaySettings();
};
