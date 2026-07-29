// ======================================================
// data.js
// Shared data + inventory layer for the whole app.
//
// The browser cannot write back to flights.json / Hotels.xml / cars.xml,
// so availability changes are kept in localStorage and applied on top of
// the source files every time they are read. That makes a booking stick
// across refreshes and across pages, and the "Download updated ..."
// buttons on the cart page regenerate the real files with the current
// numbers in them so the updated availability can be opened and checked.
// ======================================================

var TravelData = (function () {

  // ----------------------------------------------------
  // Shared constants (previously copy-pasted into
  // book.js, stays.js and cars.js)
  // ----------------------------------------------------

  var CITIES = [

    // Texas
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

    // California
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

  var CAR_TYPES = ["economy", "suv", "compact", "midsize"];

  var DATE_MIN = "2024-09-01";
  var DATE_MAX = "2024-12-01";

  var KEYS = {
    flightSeats: "flightSeatCounts",
    hotelRooms: "hotelRoomCounts",
    carAvailable: "carAvailability",
    bookings: "bookings",
    cart: "cartItems",
    userId: "userId",
    contact: "contactSubmissions",
    fontSize: "displayFontSize",
    bgColor: "displayBgColor"
  };

  // the untouched source files, cached after the first fetch. Availability
  // deltas are layered on at read time, so caching these is safe.
  var flightsSource = null;
  var hotelsSourceText = null;
  var carsSourceText = null;

  // ----------------------------------------------------
  // localStorage helpers
  // ----------------------------------------------------

  function readStore(key) {
    var raw = localStorage.getItem(key);

    if (raw == null) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readMap(key) {
    var map = readStore(key);

    if (map == null || typeof map != "object") {
      return {};
    }

    return map;
  }

  // ----------------------------------------------------
  // Validation helpers
  // ----------------------------------------------------

  function dateInRange(dateText) {
    if (!dateText) {
      return false;
    }

    var selected = new Date(dateText + "T00:00:00");
    var start = new Date(DATE_MIN + "T00:00:00");
    var end = new Date(DATE_MAX + "T00:00:00");

    return selected >= start && selected <= end;
  }

  function isValidCity(city) {
    return CITIES.indexOf(String(city).trim().toLowerCase()) != -1;
  }

  function isValidCarType(carType) {
    return CAR_TYPES.indexOf(String(carType).trim().toLowerCase()) != -1;
  }

  function formatWords(text) {
    var words = String(text).split(" ");
    var result = "";

    for (var i = 0; i < words.length; i++) {
      result += words[i].charAt(0).toUpperCase() + words[i].slice(1);

      if (i < words.length - 1) {
        result += " ";
      }
    }

    return result;
  }

  function daysBetween(dateA, dateB) {
    var first = new Date(dateA + "T00:00:00");
    var second = new Date(dateB + "T00:00:00");

    return Math.abs(first - second) / 86400000;
  }

  function nightsBetween(checkIn, checkOut) {
    var nights = Math.round(
      (new Date(checkOut + "T00:00:00") - new Date(checkIn + "T00:00:00")) / 86400000
    );

    if (nights < 1) {
      nights = 1;
    }

    return nights;
  }

  function showError(text, containerId) {
    var box = document.getElementById(containerId || "message");

    if (!box) {
      alert(text);
      return;
    }

    box.innerHTML = "";

    var paragraph = document.createElement("p");
    paragraph.className = "error";
    paragraph.appendChild(document.createTextNode(text));

    box.appendChild(paragraph);
  }

  // ----------------------------------------------------
  // Loading flights.json (seat counts layered on top)
  // ----------------------------------------------------

  function loadFlightsSource() {
    if (flightsSource != null) {
      return Promise.resolve(flightsSource);
    }

    return fetch("flights.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to load flights.json");
        }

        return response.json();
      })
      .then(function (flights) {
        flightsSource = flights;
        return flightsSource;
      });
  }

  function getFlights() {
    return loadFlightsSource().then(function (source) {

      var booked = readMap(KEYS.flightSeats);
      var flights = [];

      for (var i = 0; i < source.length; i++) {

        var flight = source[i];
        var copy = {};

        for (var field in flight) {
          if (Object.prototype.hasOwnProperty.call(flight, field)) {
            copy[field] = flight[field];
          }
        }

        if (booked[copy.flightId] != null) {
          copy.availableSeats = booked[copy.flightId];
        }

        flights.push(copy);
      }

      return flights;
    });
  }

  function getFlightById(flightId) {
    return getFlights().then(function (flights) {
      for (var i = 0; i < flights.length; i++) {
        if (flights[i].flightId == flightId) {
          return flights[i];
        }
      }

      return null;
    });
  }

  // ----------------------------------------------------
  // Loading Hotels.xml (room counts layered on top)
  // ----------------------------------------------------

  function loadHotelsSource() {
    if (hotelsSourceText != null) {
      return Promise.resolve(hotelsSourceText);
    }

    // note the capital H, the file on disk is Hotels.xml
    return fetch("Hotels.xml")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to load Hotels.xml");
        }

        return response.text();
      })
      .then(function (xmlText) {
        hotelsSourceText = xmlText;
        return hotelsSourceText;
      });
  }

  function parseXml(xmlText) {
    var parser = new DOMParser();
    return parser.parseFromString(xmlText, "text/xml");
  }

  // pulls the text out of a child tag the same way the lecture slides did
  function tagValue(node, tag) {
    var el = node.getElementsByTagName(tag)[0];

    if (!el || el.childNodes.length === 0) {
      return "";
    }

    return el.childNodes[0].nodeValue;
  }

  function getHotels() {
    return loadHotelsSource().then(function (xmlText) {

      var xmlDoc = parseXml(xmlText);
      var nodes = xmlDoc.getElementsByTagName("hotel");
      var booked = readMap(KEYS.hotelRooms);
      var hotels = [];

      for (var i = 0; i < nodes.length; i++) {

        var hotelId = tagValue(nodes[i], "hotelId");
        var rooms = parseInt(tagValue(nodes[i], "availableRooms"), 10);

        if (booked[hotelId] != null) {
          rooms = booked[hotelId];
        }

        hotels.push({
          hotelId: hotelId,
          hotelName: tagValue(nodes[i], "hotelName"),
          city: tagValue(nodes[i], "city"),
          availableRooms: rooms,
          date: tagValue(nodes[i], "date"),
          pricePerNight: tagValue(nodes[i], "pricePerNight")
        });
      }

      return hotels;
    });
  }

  function getHotelById(hotelId) {
    return getHotels().then(function (hotels) {
      for (var i = 0; i < hotels.length; i++) {
        if (hotels[i].hotelId == hotelId) {
          return hotels[i];
        }
      }

      return null;
    });
  }

  // ----------------------------------------------------
  // Loading cars.xml (availability layered on top)
  // ----------------------------------------------------

  function loadCarsSource() {
    if (carsSourceText != null) {
      return Promise.resolve(carsSourceText);
    }

    return fetch("cars.xml")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to load cars.xml");
        }

        return response.text();
      })
      .then(function (xmlText) {
        carsSourceText = xmlText;
        return carsSourceText;
      });
  }

  function getCars() {
    return loadCarsSource().then(function (xmlText) {

      var xmlDoc = parseXml(xmlText);
      var nodes = xmlDoc.getElementsByTagName("car");
      var booked = readMap(KEYS.carAvailable);
      var cars = [];

      for (var i = 0; i < nodes.length; i++) {

        var carId = tagValue(nodes[i], "carId");
        var available = tagValue(nodes[i], "available").toLowerCase() == "true";

        if (booked[carId] != null) {
          available = booked[carId] === true || booked[carId] === "true";
        }

        cars.push({
          carId: carId,
          city: tagValue(nodes[i], "city"),
          carType: tagValue(nodes[i], "carType"),
          checkInDate: tagValue(nodes[i], "checkInDate"),
          checkOutDate: tagValue(nodes[i], "checkOutDate"),
          pricePerDay: parseFloat(tagValue(nodes[i], "pricePerDay")),
          available: available
        });
      }

      return cars;
    });
  }

  function getCarById(carId) {
    return getCars().then(function (cars) {
      for (var i = 0; i < cars.length; i++) {
        if (cars[i].carId == carId) {
          return cars[i];
        }
      }

      return null;
    });
  }

  // ----------------------------------------------------
  // Booking inventory down
  // ----------------------------------------------------

  function bookFlightSeats(flightId, seats) {
    return getFlightById(flightId).then(function (flight) {

      if (flight == null) {
        return false;
      }

      var map = readMap(KEYS.flightSeats);
      var remaining = flight.availableSeats - seats;

      if (remaining < 0) {
        remaining = 0;
      }

      map[flightId] = remaining;
      writeStore(KEYS.flightSeats, map);

      return true;
    });
  }

  function bookHotelRooms(hotelId, rooms) {
    return getHotelById(hotelId).then(function (hotel) {

      if (hotel == null) {
        return false;
      }

      var map = readMap(KEYS.hotelRooms);
      var remaining = hotel.availableRooms - rooms;

      if (remaining < 0) {
        remaining = 0;
      }

      map[hotelId] = remaining;
      writeStore(KEYS.hotelRooms, map);

      return true;
    });
  }

  // a car is a single vehicle, so booking it takes it off the lot entirely
  function bookCar(carId) {
    var map = readMap(KEYS.carAvailable);

    map[carId] = false;
    writeStore(KEYS.carAvailable, map);

    return Promise.resolve(true);
  }

  // ----------------------------------------------------
  // Availability guard - this is what stops the same
  // hotel room / car / seat being booked twice
  // ----------------------------------------------------

  function checkAvailability(item) {

    if (item.type == "flight") {

      var seats = item.adults + item.children + item.infants;
      var legs = [item.departingFlight];

      if (item.tripType == "round" && item.returningFlight) {
        legs.push(item.returningFlight);
      }

      return getFlights().then(function (flights) {

        for (var i = 0; i < legs.length; i++) {

          var current = null;

          for (var j = 0; j < flights.length; j++) {
            if (flights[j].flightId == legs[i].flightId) {
              current = flights[j];
              break;
            }
          }

          if (current == null) {
            return {
              ok: false,
              message: "Flight " + legs[i].flightId + " is no longer in the schedule."
            };
          }

          if (current.availableSeats < seats) {
            return {
              ok: false,
              message:
                "Flight " + current.flightId + " only has " + current.availableSeats +
                " seat(s) left, but this booking needs " + seats +
                ". It has already been booked."
            };
          }
        }

        return { ok: true };
      });
    }

    if (item.type == "stay") {

      return getHotelById(item.hotelId).then(function (hotel) {

        if (hotel == null) {
          return { ok: false, message: "That hotel is no longer listed." };
        }

        if (hotel.availableRooms < item.roomsNeeded) {
          return {
            ok: false,
            message:
              hotel.hotelName + " only has " + hotel.availableRooms +
              " room(s) left, but this booking needs " + item.roomsNeeded +
              ". It has already been booked."
          };
        }

        return { ok: true };
      });
    }

    if (item.type == "car") {

      return getCarById(item.carId).then(function (car) {

        if (car == null) {
          return { ok: false, message: "That car is no longer listed." };
        }

        if (!car.available) {
          return {
            ok: false,
            message:
              "Car " + car.carId + " (" + car.carType + " in " + car.city +
              ") has already been booked and is no longer available."
          };
        }

        return { ok: true };
      });
    }

    return Promise.resolve({ ok: true });
  }

  // ----------------------------------------------------
  // Cart
  // ----------------------------------------------------

  function getCart() {
    var items = readStore(KEYS.cart);

    if (items == null) {
      return [];
    }

    return items;
  }

  function saveCart(items) {
    writeStore(KEYS.cart, items);
  }

  function addToCart(entry) {
    var items = getCart();
    items.push(entry);
    saveCart(items);
  }

  // ----------------------------------------------------
  // Bookings + user id
  // ----------------------------------------------------

  function getUserId() {
    var userId = localStorage.getItem(KEYS.userId);

    if (userId == null) {
      userId = "U" + Date.now();
      localStorage.setItem(KEYS.userId, userId);
    }

    return userId;
  }

  function generateBookingNumber() {
    return "BK" + Date.now() + Math.floor(Math.random() * 1000);
  }

  function getBookings() {
    var bookings = readStore(KEYS.bookings);

    if (bookings == null) {
      return [];
    }

    return bookings;
  }

  function addBooking(booking) {
    var bookings = getBookings();
    bookings.push(booking);
    writeStore(KEYS.bookings, bookings);
  }

  // ----------------------------------------------------
  // Regenerating the data files with current availability
  // ----------------------------------------------------

  function updatedFlightsJson() {
    return getFlights().then(function (flights) {
      return JSON.stringify(flights, null, 2);
    });
  }

  function serializeXml(xmlDoc) {
    return new XMLSerializer().serializeToString(xmlDoc);
  }

  function setTagValue(node, tag, value) {
    var el = node.getElementsByTagName(tag)[0];

    if (!el) {
      return;
    }

    if (el.childNodes.length === 0) {
      el.appendChild(el.ownerDocument.createTextNode(String(value)));
    } else {
      el.childNodes[0].nodeValue = String(value);
    }
  }

  function updatedHotelsXml() {
    return loadHotelsSource().then(function (xmlText) {

      var xmlDoc = parseXml(xmlText);
      var nodes = xmlDoc.getElementsByTagName("hotel");
      var booked = readMap(KEYS.hotelRooms);

      for (var i = 0; i < nodes.length; i++) {
        var hotelId = tagValue(nodes[i], "hotelId");

        if (booked[hotelId] != null) {
          setTagValue(nodes[i], "availableRooms", booked[hotelId]);
        }
      }

      return serializeXml(xmlDoc);
    });
  }

  function updatedCarsXml() {
    return loadCarsSource().then(function (xmlText) {

      var xmlDoc = parseXml(xmlText);
      var nodes = xmlDoc.getElementsByTagName("car");
      var booked = readMap(KEYS.carAvailable);

      for (var i = 0; i < nodes.length; i++) {
        var carId = tagValue(nodes[i], "carId");

        if (booked[carId] != null) {
          setTagValue(nodes[i], "available", booked[carId] ? "true" : "false");
        }
      }

      return serializeXml(xmlDoc);
    });
  }

  function escapeXml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // the assignment asks for car booking information in an XML file,
  // while flights and hotels go to a JSON file
  function carBookingsXml() {
    var bookings = getBookings();
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<carBookings>\n';

    for (var i = 0; i < bookings.length; i++) {

      var booking = bookings[i];

      if (booking.type != "car") {
        continue;
      }

      var details = booking.details;

      xml += "  <carBooking>\n";
      xml += "    <userId>" + escapeXml(booking.userId) + "</userId>\n";
      xml += "    <bookingNumber>" + escapeXml(booking.bookingNumber) + "</bookingNumber>\n";
      xml += "    <carId>" + escapeXml(details.carId) + "</carId>\n";
      xml += "    <city>" + escapeXml(details.city) + "</city>\n";
      xml += "    <carType>" + escapeXml(details.carType) + "</carType>\n";
      xml += "    <checkInDate>" + escapeXml(details.checkIn) + "</checkInDate>\n";
      xml += "    <checkOutDate>" + escapeXml(details.checkOut) + "</checkOutDate>\n";
      xml += "    <pricePerDay>" + escapeXml(details.pricePerDay) + "</pricePerDay>\n";
      xml += "    <numberOfDays>" + escapeXml(details.numberOfDays) + "</numberOfDays>\n";
      xml += "    <totalPrice>" + escapeXml(details.totalPrice) + "</totalPrice>\n";
      xml += "  </carBooking>\n";
    }

    xml += "</carBookings>";

    return xml;
  }

  // flights and hotels are stored as JSON, cars are stored as XML above
  function bookingsJson() {
    var bookings = getBookings();
    var jsonBookings = [];

    for (var i = 0; i < bookings.length; i++) {
      if (bookings[i].type != "car") {
        jsonBookings.push(bookings[i]);
      }
    }

    return JSON.stringify(jsonBookings, null, 2);
  }

  // ----------------------------------------------------
  // Downloads
  // ----------------------------------------------------

  function download(filename, text, mimeType) {
    var blob = new Blob([text], { type: mimeType });
    var url = URL.createObjectURL(blob);

    var link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function downloadJson(filename, text) {
    download(filename, text, "application/json");
  }

  function downloadXml(filename, text) {
    download(filename, text, "application/xml");
  }

  // ----------------------------------------------------
  // Reset, so the demo can be run again from a clean slate
  // ----------------------------------------------------

  function resetDemoData() {
    localStorage.removeItem(KEYS.flightSeats);
    localStorage.removeItem(KEYS.hotelRooms);
    localStorage.removeItem(KEYS.carAvailable);
    localStorage.removeItem(KEYS.bookings);
    localStorage.removeItem(KEYS.cart);
    localStorage.removeItem(KEYS.userId);
    localStorage.removeItem(KEYS.contact);
  }

  // ----------------------------------------------------

  return {
    CITIES: CITIES,
    CAR_TYPES: CAR_TYPES,
    DATE_MIN: DATE_MIN,
    DATE_MAX: DATE_MAX,
    KEYS: KEYS,

    dateInRange: dateInRange,
    isValidCity: isValidCity,
    isValidCarType: isValidCarType,
    formatWords: formatWords,
    daysBetween: daysBetween,
    nightsBetween: nightsBetween,
    showError: showError,

    getFlights: getFlights,
    getFlightById: getFlightById,
    getHotels: getHotels,
    getHotelById: getHotelById,
    getCars: getCars,
    getCarById: getCarById,

    bookFlightSeats: bookFlightSeats,
    bookHotelRooms: bookHotelRooms,
    bookCar: bookCar,
    checkAvailability: checkAvailability,

    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,

    getUserId: getUserId,
    generateBookingNumber: generateBookingNumber,
    getBookings: getBookings,
    addBooking: addBooking,

    updatedFlightsJson: updatedFlightsJson,
    updatedHotelsXml: updatedHotelsXml,
    updatedCarsXml: updatedCarsXml,
    carBookingsXml: carBookingsXml,
    bookingsJson: bookingsJson,

    download: download,
    downloadJson: downloadJson,
    downloadXml: downloadXml,

    resetDemoData: resetDemoData
  };

})();
