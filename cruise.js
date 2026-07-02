// allowed cruise destinations
var validDestinations = ["Alaska", "Bahamas", "Europe", "Mexico"];

// check if date is valid for the assignment
function dateInRange(dateText) {
  var selectedDate = new Date(dateText);
  var startDate = new Date("2024-09-01");
  var endDate = new Date("2024-12-01");

  return selectedDate >= startDate && selectedDate <= endDate;
}

function showError(text) {
  $("#message").html("<p class='error'>" + text + "</p>");
}

function searchCruise() {

  var destination = $("#destination").val();
  var departDate = $("#departDate").val();
  var minDuration = parseInt($("#minDuration").val(), 10);
  var maxDuration = parseInt($("#maxDuration").val(), 10);
  var adults = parseInt($("#adults").val(), 10);
  var children = parseInt($("#children").val(), 10);
  var infants = parseInt($("#infants").val(), 10);

  if (isNaN(adults)) {
    adults = 0;
  }
  if (isNaN(children)) {
    children = 0;
  }
  if (isNaN(infants)) {
    infants = 0;
  }

  $("#message").html("");

  if (destination == "" || $.inArray(destination, validDestinations) == -1) {
    showError("Please select a valid destination.");
    return;
  }

  if (departDate == "" || !dateInRange(departDate)) {
    showError("Departure date must be between Sep 1, 2024 and Dec 1, 2024.");
    return;
  }

  if (isNaN(minDuration) || minDuration < 3) {
    showError("Minimum duration cannot be less than 3 days.");
    return;
  }

  if (isNaN(maxDuration) || maxDuration > 10) {
    showError("Maximum duration cannot be greater than 10 days.");
    return;
  }

  if (minDuration > maxDuration) {
    showError("Maximum duration must be greater than or equal to minimum duration.");
    return;
  }

  if (adults + children == 0 && infants == 0) {
    showError("Please enter at least one guest.");
    return;
  }

  // max 2 adults/children per room, infants can stay in any room without counting
  var roomsNeeded = 1;
  if (adults + children > 0) {
    roomsNeeded = Math.ceil((adults + children) / 2);
  }

  var result = "<div class='result'>";
  result += "<h3>Cruise Search Results</h3>";
  result += "<p><strong>Destination:</strong> " + destination + "</p>";
  result += "<p><strong>Departing:</strong> " + departDate + "</p>";
  result += "<p><strong>Duration:</strong> " + minDuration + " - " + maxDuration + " days</p>";
  result += "<p><strong>Adults:</strong> " + adults + "</p>";
  result += "<p><strong>Children:</strong> " + children + "</p>";
  result += "<p><strong>Infants:</strong> " + infants + "</p>";
  result += "<p><strong>Rooms Needed:</strong> " + roomsNeeded + "</p>";
  result += "</div>";

  $("#message").html(result);
}