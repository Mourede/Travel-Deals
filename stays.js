var texasandCaliforniaCities = [
    // Texas airport cities
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
    // California airport cities
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
  
  // check if date is valid for the assignment
  function dateInRange(dateText) {
    var selectedDate = new Date(dateText);
    var startDate = new Date("2024-09-01");
    var endDate = new Date("2024-12-01");
  
    return selectedDate >= startDate && selectedDate <= endDate;
  }
  
  function showError(text) {
    var messageBox = document.getElementById("message");
    messageBox.innerHTML = "";
  
    var paragraph = document.createElement("p");
    paragraph.className = "error";
  
    var errorText = document.createTextNode(text);
    paragraph.appendChild(errorText);
    messageBox.appendChild(paragraph);
  }
  
  function formatWords(text) {
    var words = text.split(" ");
    var result = "";
  
    for (var i = 0; i < words.length; i++) {
      result += words[i].charAt(0).toUpperCase() + words[i].slice(1);
  
      if (i < words.length - 1) {
        result += " ";
      }
    }
  
    return result;
  }
  
  function searchStays() {
  
    var city = document.getElementById("city").value.trim().toLowerCase();
    var checkIn = document.getElementById("checkIn").value;
    var checkOut = document.getElementById("checkOut").value;
    var adults = parseInt(document.getElementById("adults").value, 10);
    var children = parseInt(document.getElementById("children").value, 10);
    var infants = parseInt(document.getElementById("infants").value, 10);
  
    if (isNaN(adults)) {
      adults = 0;
    }
    if (isNaN(children)) {
      children = 0;
    }
    if (isNaN(infants)) {
      infants = 0;
    }
  
    if (city == "") {
      showError("Please enter a city.");
      return;
    }
  
    if (texasandCaliforniaCities.indexOf(city) == -1) {
      showError("City must be a city in Texas or California.");
      return;
    }
  
    if (checkIn == "" || !dateInRange(checkIn)) {
      showError("Check-in date must be between Sep 1, 2024 and Dec 1, 2024.");
      return;
    }
  
    if (checkOut == "" || !dateInRange(checkOut)) {
      showError("Check-out date must be between Sep 1, 2024 and Dec 1, 2024.");
      return;
    }
  
    if (new Date(checkOut) < new Date(checkIn)) {
      showError("Check-out date must be after check-in date.");
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
  
    var messageBox = document.getElementById("message");
    messageBox.innerHTML = "";
  
    var resultBox = document.createElement("div");
    resultBox.className = "result";
  
    var heading = document.createElement("h3");
    heading.appendChild(document.createTextNode("Stay Search Results"));
    resultBox.appendChild(heading);
  
    function addLine(label, value) {
      var p = document.createElement("p");
      var left = document.createElement("span");
      left.appendChild(document.createTextNode(label + ": "));
      var right = document.createElement("span");
      right.appendChild(document.createTextNode(value));
      p.appendChild(left);
      p.appendChild(right);
      resultBox.appendChild(p);
    }
  
    addLine("City", formatWords(city));
    addLine("Check-in Date", checkIn);
    addLine("Check-out Date", checkOut);
    addLine("Adults", adults);
    addLine("Children", children);
    addLine("Infants", infants);
    addLine("Rooms Needed", roomsNeeded);
  
    messageBox.appendChild(resultBox);
  }