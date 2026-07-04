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

    document.getElementById("datetime").innerHTML =
        now.toLocaleString("en-US", options);
}

// Update immediately
updateDateTime();

// Update every second
setInterval(updateDateTime, 1000);


// ---------------------------
// Change font size
// ---------------------------
function changeFont() {
    const size = document.getElementById("fontSize").value;
    document.documentElement.style.fontSize = size + "px";
}


// ---------------------------
// Change background color
// ---------------------------
function changeBg() {
    const color = document.getElementById("bgColor").value;

    document.body.style.backgroundColor = color;
}


// ---------------------------
// Initialize page
// ---------------------------
window.onload = function () {
    changeFont();
    changeBg();
};
