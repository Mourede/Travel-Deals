# Assignment 3 Demo Script

Everything below uses inputs that are known to return results. Run through it
once before the meeting so nobody is typing guesses in front of the TA.

## Before you start

1. Open the folder in VS Code and start **Live Server** (right click
   `index.html` to "Open with Live Server"). The pages read `flights.json`,
   `Hotels.xml` and `cars.xml` with `fetch`, and a browser blocks that on a
   plain `file://` URL, so the app **must** be served over `http://`.
2. Go to the **Cart** page and click **Reset Demo Data**. That clears the cart
   and bookings and puts all seats, rooms and cars back to full availability.
   Do this before every practice run and once more right before you present.

## Order to demo in

Follow this order. It builds up booking history, which the car suggestions on
step 6 need.

### 1. Layout, date and time, display controls

- On **Home**, point out the header, nav bar with links to all pages, sidebar
  and footer, all coming from the external `mystyle.css`.
- The live date and time is under the title and ticks every second.
- In the sidebar set **Text Size** to `24`. Only the main content grows; the
  header, nav bar, sidebar and footer stay the same size, which is what the
  assignment asks for ("font size of main content").
- Change **Background** to any color.
- Click through to **Flights**. Both settings carry over, because they are
  saved in `localStorage` and reapplied on every page.
- Set the text size back to `16` before continuing.

### 2. Contact Us validation (the TA will try different formats)

Go to **Contact Us**. He will ask to see the regular expressions, then try to
break them. They are at the top of `contact.js`:

```js
var nameRegex  = /^[A-Z][a-zA-Z]*$/;
var phoneRegex = /^\(\d{3}\)\d{3}-\d{4}$/;
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

Type these in and click Submit each time. Every row on the left is rejected
with a specific message, the row on the right is accepted.

| Field | These are rejected | This is accepted |
| --- | --- | --- |
| First name | `john`, `JOHN2`, `J0hn`, `Jo-hn` | `John` |
| Last name | `smith`, `Smith1` | `Smith` |
| Both names | `John` / `John` (identical) | `John` / `Smith` |
| Phone | `214-555-1234`, `(214) 555-1234`, `2145551234`, `(21)555-1234` | `(214)555-1234` |
| Gender | leave all three unselected | pick any one |
| Email | `johnx.com` (no @), `john@xcom` (no dot) | `john@example.com` |
| Comment | `hi` (under 10 characters) | `This is a long enough comment` |

A valid submission shows a "Message Received" summary and a button to download
`contact-submissions.json`. Submissions are kept in `localStorage` and written
to the JSON file when that button is clicked.

### 3. One way flight, with the seat count going down

Go to **Flights**.

- Trip Type: **One Way**
- Origin: `Dallas`
- Destination: `Los Angeles`
- Departure Date: `09/01/2024`
- Click the **Passengers** button (this is the passenger icon requirement) and
  set Adults `2`, Children `1`, Infants `0`

Click **Search Flights**. You get:

- a panel echoing back everything that was entered
- flight **F001** with flight id, origin, destination, departure and arrival
  dates, departure and arrival times, available seats (**12**), price per adult
  ticket (**$180.00**) and the total for the party (**$486.00**)

That $486 is the pricing rule: 2 adults at $180 plus 1 child at 70% of $180
($126). Infants would be 10%.

Click **Select as Departing Flight**. The card turns green and "Your Selection"
at the bottom names the flight and the total. Click
**Add to Cart and Go to Cart**.

On the **Cart** page:

- Click **Book This Flight** with the passenger forms empty. It refuses.
- Type `123` into the first SSN. It refuses again, asking for 9 digits.
- Fill all three passengers with a first name, last name, date of birth and a
  9 digit SSN, then click **Book This Flight**.

The green **Booking Confirmed** panel shows the user id, booking number, the
full itinerary and every passenger's SSN, name and date of birth. The item
leaves the cart and appears under **My Bookings**.

**This is the part he cares about most.** Go back to **Flights** and run the
exact same search again. F001 now shows **9 available seats** instead of 12,
because 3 passengers were booked. Refresh the page and it is still 9.

### 4. Round trip

Still on **Flights**:

- Trip Type: **Round Trip** (the Return Date field appears)
- Origin: `Dallas`, Destination: `Los Angeles`
- Departure Date: `09/01/2024`, Return Date: `09/03/2024`
- Passengers: Adults `1`, Infants `1`

Click **Search Flights**. You get **Departing Flights** (Dallas to Los Angeles)
and **Returning Flights** (Los Angeles to Dallas). Select one from each; the
selection panel lists both legs and the combined total. Add to cart and book it
the same way as step 3.

### 5. The 3 day fallback

Search **Dallas** to **Los Angeles** departing `09/02/2024`. There is no flight
that day, so the page shows the flights within 3 days either side along with a
note explaining that is what it did.

### 6. Hotel, with the room count going down in the XML

Go to **Stays**.

- City: `Dallas`
- Check-in: `09/10/2024`, Check-out: `09/13/2024`
- Adults `4`, Children `0`, Infants `1`

Click **Search**. It echoes the inputs and shows **Rooms Needed: 2**, because
the limit is 2 guests per room and infants do not count. Downtown Dallas Suites
(H001) is listed with 18 rooms available at $142.00 a night.

Click **Select This Hotel**, go to the **Cart**, and check the total is
**$852.00** ($142 x 2 rooms x 3 nights). Click **Book This Stay** to get the
confirmation with the hotel id, city, guests per category, rooms and booking
number.

Now click **Download updated Hotels.xml** in the Data Files box at the bottom of
the cart page and open it. H001 reads
`<availableRooms>16</availableRooms>` instead of 18. Search Stays for Dallas
again and the listing shows 16 rooms.

### 7. Car, and proving it cannot be booked twice

Go to **Cars**.

- City: `Dallas`, Car Type: `Economy`
- Check-in: `09/10/2024`, Check-out: `09/13/2024`

Click **Submit**. Car **C001** is listed. Click **Add to Cart twice** so there
are two copies of the same car in the cart. Go to the **Cart**:

- Click **Book This Car** on the first one. It books and confirms.
- Click **Book This Car** on the second one. It is **refused**, with a message
  saying that car has already been booked and is no longer available.

Then:

- Click **Download updated cars.xml** and open it. C001 now reads
  `<available>false</available>`.
- Click **Download carBookings.xml**. Car bookings are stored as XML, which is
  what section 6 of the assignment asks for, while flight and hotel bookings go
  to `bookings.json`.
- Go back to **Cars** and search Dallas / Economy again. C001 is greyed out and
  labelled "Already booked, this car is no longer available."

### 8. Suggested cars from previous bookings

Still on **Cars**, look at the **Suggested For You** panel at the top. It is
there because of the bookings made in the previous steps: it reads the booking
history, works out which cities and car types this user prefers, and scores the
available cars against that.

Enter only **Check-in `10/01/2024`** and **Check-out `10/04/2024`**, then click
**Show Suggested Cars**. Cars in the cities already booked or flown to come
back, and each one can be added to the cart straight from there without
entering a city or car type. That is the "streamlining the booking process"
requirement.

### 9. Cruise (jQuery)

Go to **Cruises**. This page is written with jQuery, as required.

- Destination `Alaska`, Departing `09/15/2024`
- Min Duration `2` -> rejected, minimum cannot be under 3
- Min `4`, Max `12` -> rejected, maximum cannot be over 10
- Min `4`, Max `8`, Adults `2` -> shows the search summary and rooms needed

### 10. All the bookings together

Back on the **Cart** page, scroll to **My Bookings**. Every booking from the
session is listed with its user id, booking number and full details. The Data
Files box downloads `flights.json`, `Hotels.xml`, `cars.xml`, `bookings.json`
and `carBookings.xml` with the current numbers in them.

## If he asks where something is in the code

| What he asks about | Where to point |
| --- | --- |
| Regular expressions | top of `contact.js`, and the SSN check in `validateFlightPassengers` in `cart.js` |
| Reading the XML files | `getHotels` and `getCars` in `data.js` (`DOMParser`) |
| Reading the JSON file | `getFlights` in `data.js` |
| jQuery page | `cruise.js` |
| DOM methods page | `cars.js` (all `createElement` / `appendChild`, no `innerHTML`) |
| No regex on the stays page | `stays.js`, validation is plain comparisons and an array lookup |
| Availability going down | `bookFlightSeats`, `bookHotelRooms`, `bookCar` in `data.js` |
| Blocking a second booking | `checkAvailability` in `data.js`, called before every booking in `cart.js` |
| Pricing (70% / 10%) | `legTotal` in `book.js` |
| The 3 day window | `findAvailableFlights` in `book.js` |

## If he asks why the files on disk do not change by themselves

Say this: JavaScript running in a browser is not allowed to write to files on
the user's disk, so the app keeps every availability change in `localStorage`
and layers it over `flights.json`, `Hotels.xml` and `cars.xml` each time they
are read. That is why a booked car stays booked after a refresh and across
pages. The **Download updated ...** buttons regenerate the real files with the
current availability so they can be opened and checked. Writing back to the
original files on disk would need a server, which is outside the
HTML/CSS/JS/jQuery/XML/JSON scope of the assignment.

## If a demo goes wrong

- **A page shows "Could not load ..."** - it is being opened as a `file://`
  URL. Start Live Server.
- **A search returns nothing** - the date is probably outside Sep 1 to Dec 1
  2024, or everything matching has already been booked in an earlier run. Click
  **Reset Demo Data** on the Cart page.
- **Availability looks wrong from a previous practice run** - **Reset Demo
  Data** on the Cart page.
