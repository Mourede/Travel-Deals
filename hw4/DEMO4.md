# Assignment 4 — demo script

Every numbered requirement, where it lives, and what to click. Work down the
page in order and you will hit all of them.

**Admin login:** phone `222-222-2222`, password `admin123`.

---

## Before the demo

### 1. Start the servers

Either stack works. The code finds MySQL on its own.

**Without XAMPP** (what this was developed against):

```bash
./hw4/sql/start-dev-server.sh
```

MySQL comes up on port 3306 and PHP serves the app at `http://localhost:8080/`.
Leave that terminal running.

**With XAMPP:** start Apache and MySQL from the XAMPP control panel, then

```bash
ln -s "$(pwd)/hw4" /Applications/XAMPP/xamppfiles/htdocs/hw4
```

and open `http://localhost/hw4/`.

### 2. Build the database, once

```bash
mysql -u root < hw4/sql/schema.sql
```

That creates `travel_deals`, all 8 tables, and the admin user. It **drops the
database first**, so it wipes any bookings — fine before a demo, not during one.

### 3. Load the data files

Log in as the admin, go to **My Account**, and press **Load flights.json**
and **Load hotels.xml**. You should see "Loaded 50 flights" and "Loaded 23
hotels". Nothing can be searched before this, because the tables start empty.

Both loaders are safe to press twice. Re-running the flights loader also puts
the seat counts back to what the file says, which is the fastest way to reset
after a practice run.

### 4. Check it worked

```bash
./hw4/tests/pages.sh      # every page renders, no PHP notices, 7 nav links
./hw4/tests/reports.sh    # all 12 reports, plus the access-control checks
```

---

## The walkthrough

### Section 1 — register and log in

`register.php` and `login.php`, built by the teammate against
`AUTH-CONTRACT.md`. Register a normal user, for example `214-555-1234`, then
log in.

Bad input to show the validation: a phone as `2145551234` (wrong format), two
different passwords, a 7-character password, `2024-13-45` as a date of birth,
an email with no `.com`, and re-registering a phone that already exists.

### Section 2 — current local date and time

Top of **every** page, under the tagline, and it ticks every second. It comes
from `includes/header.php` plus `updateDateTime()` in `script.js`.

### Section 3 — the user's name on every page

Also in the header, on the right of the date: "Signed in as Jane Doe". Click
through Flights, Stays, Cart, Contact and My Account to show it follows you.
An `admin` badge appears next to it when the admin is logged in.

### Section 5 — font size and background colour

Left sidebar, on every page.

- **Text Size** to 24: the text in the white panel grows, and the header, nav
  bar, sidebar and footer stay put. That is deliberate — the assignment asks
  for the font size of the *main content*, so `changeFont()` sets it on
  `#mainContent` only and the sizes inside it are in `em` so they scale.
- **Background**: pick a colour, the page background changes.

Both settings are remembered in `localStorage`, so navigate to another page
and they are still applied.

### Section 6 — the flights JSON file and the admin loader

`hw4/flights.json`: 50 flights, each with exactly the 9 fields the `flights`
table has, all between Texas and California and all between 2024-09-01 and
2024-12-01. Loaded by the admin from My Account, as in step 3 above.

### Section 7 — flights, cart and booking

**One way.** On **Flights**: leave "One way trip" selected, origin `Dallas`,
destination `Los Angeles`, departure date `2024-09-01`. Click the
**Passengers** icon to open the count form, set 2 adults and 1 child, then
**Search flights**.

You get "Your search" echoing everything entered, then the matching flights
with flight-id, origin, destination, both dates, both times, seats and fare.
Click **Select as departing flight**, then go to the **Cart**.

The cart shows every field the assignment lists, the per-category fares, and
the total for the group. Fill in first name, last name, date of birth and SSN
for all three passengers — SSNs must look like `123-45-6789` and must differ —
then **Book this flight**.

The confirmation shows the flight-booking-id and all the flight details, then
a ticket table with a ticket-id per passenger.

**Round trip.** Same thing with "Round trip" selected, `Dallas` to
`Los Angeles`, departure `2024-09-01`, return `2024-09-03`. Select a departing
*and* a returning flight, then book. You get **two** flight-booking-ids, one
per leg, and a ticket for each passenger on each leg.

Every route in `flights.json` has a return flight exactly 2 days later, so
depart + 2 days always finds something.

**Things worth showing:**

| What | How |
| --- | --- |
| Date outside the window | Departure `2025-01-15` → rejected |
| City outside TX/CA | Origin `Miami` → rejected |
| More than 4 in a category | 9 children → rejected |
| All at once | Do all three together; every error is listed, not just the first |
| The ±3 day fallback | Dallas to Los Angeles on `2024-09-03`. Nothing flies that day, so it shows the 2024-08-31 to 2024-09-06 flights with a note |
| Seats actually drop | Note the seat count before booking, book 3 passengers, search again — it is 3 lower |
| Casing does not matter | `dallas` and `LOS ANGELES` both work |

**Pricing.** Adult full fare, child 70%, infant 10%. On an $180 flight that is
$180 / $126 / $18. The cart itemises it and the ticket table shows the price
each passenger paid.

### Section 8 — stays

On **Stays**: city `Dallas`, check in `2024-09-10`, check out `2024-09-13`,
then the **Guests** form with 2 adults and 1 child. **Search hotels**.

The summary echoes the input and shows **2 rooms** — two guests to a room, and
3 guests needs 2 rooms. Worth showing the infant rule too: 2 adults and 4
infants is 6 guests but still only **1 room**, because infants stay with an
adult and do not count.

Select a hotel, go to the **Cart**, and it shows hotel-id, name, city, guests
per category, rooms, both dates, price per night and the total
(rooms × nights × rate). Fill in the guest details and **Book this hotel**.

The confirmation shows the hotel-booking-id, everything about the stay, and a
table of every guest with SSN, name, date of birth and category.

### Section 4 — contact us

On **Contact**: your account details are shown read-only, because that is what
gets stored and it comes from the `users` table rather than from the form.

Type fewer than 10 characters and submit — refused, with the current count.
Type a real comment and submit — it is saved with a contact-id and the page
shows the stored record.

Then open `hw4/contacts.xml` to show contact-id, phone, first name, last name,
date of birth, email and gender in the file. Contact ids start at 3001 and
each new comment is appended rather than replacing the file.

`contacts.xml` is not in git, because the app creates it on the first comment.
The one thing that can go wrong here is permissions: under XAMPP, Apache runs
as a different user and needs to be able to write to the `hw4` folder. If you
get "Could not open contacts.xml for writing", run `chmod 777 hw4` and submit
again. Worth testing this once *before* the demo rather than discovering it in
front of the TA.

Logging out and trying again gets the login prompt, which is the other half of
what section 4 asks for.

### Section 9 — the my-account reports

Four for any user, eight more for the admin. Every one prints the SQL result
as a table with a row count.

**As a normal user:**

1. **A booked flight and a booked hotel by id** — enter `1001` and `2001`.
   Returns the booking plus its tickets, and the hotel plus its guests. Either
   id works on its own.
2. **All passengers on a booked flight** — `1001`.
3. **Everything booked for September 2024** — flights by departure date,
   hotels by check-in date.
4. **Flights booked for one person, by SSN** — use an SSN you booked with.

**As the admin** (log out, log back in as `222-222-2222`):

5. Booked flights departing Texas, Sep–Oct 2024
6. Booked hotels in Texas, Sep–Oct 2024
7. Most expensive booked hotels
8. Booked flights with an infant passenger
9. Booked flights with an infant and at least 5 children
10. Most expensive booked flights
11. Booked flights departing Texas with no infant passenger
12. How many booked flights arrive in California in Sep or Oct 2024

**Report 9 always returns zero rows, and that is correct.** Section 7 caps
children at 4 per booking, so no single booking can contain 5. The query is
written the way it would have to be; there is simply nothing that can satisfy
it. The page says so above the empty result.

For reports 5, 7, 10 and 11 to show anything interesting you need a bit of
variety in the bookings. Book at least:

- a round trip with an infant (makes 8 and 12 return rows)
- a one-way from a Texas city with **no** infant (makes 11 return rows)
- two hotels at different prices (makes 7 meaningful)

Reports 7 and 10 compare against `MAX(total_price)` rather than taking the top
row, so if two bookings tie for most expensive, both are listed.

---

## Questions the TA is likely to ask

**Why are the table names `flight_booking` and not `flight-booking`?**
MySQL reads a hyphen as a minus sign, so `flight-booking` has to be backticked
everywhere it appears. Underscores avoid that. The *fields* match the
assignment exactly — 3 in `flight_booking`, 4 in `tickets`, 5 in `passenger`,
7 in `hotel_booking`, 6 in `guesses`, 9 in `flights`, 4 in `hotels`, 7 in
`users`.

**Where is the cart stored?**
In `$_SESSION`, not the database. The assignment lists 8 tables and none of
them is a cart. The session keeps it server-side, and only an id ever comes
from the browser — `cart_add.php` re-reads every price out of the database, so
editing the page cannot change what something costs.

**Why does a round trip create two bookings?**
`flight_booking` holds a single `flight_id`, so one row cannot represent two
legs. Each leg gets its own `flight_booking_id`, and each passenger gets one
ticket per leg. That is what section 7 describes: "one ticket for departing
flight and one ticket for returning flight for each passenger".

**What stops a flight being oversold?**
The seat decrement carries its own condition:

```sql
UPDATE flights SET available_seats = available_seats - :take
 WHERE flight_id = :id AND available_seats >= :need
```

If it matches no rows the whole transaction rolls back, so two people booking
the last seats at the same moment cannot both succeed. You can show this: put
a flight in the cart, lower its seats directly in MySQL, then try to book —
you get a clear refusal and nothing is written.

**Is the whole booking atomic?**
Yes. Passengers, bookings, tickets and the seat update are one transaction. If
any part fails everything rolls back, so there is never a booking with missing
tickets or seats taken for a booking that did not finish.

**What happens if the same person books twice?**
`passenger.ssn` and `guesses.ssn` are unique, per the assignment, so a second
booking by the same SSN would fail on a plain insert. Both use
`INSERT ... ON DUPLICATE KEY UPDATE` instead, which updates the existing row.
Worth knowing: because `guesses.ssn` is the primary key there, a guest on a
second hotel booking *moves* to the new booking. That follows from the
assignment making SSN unique in a table that also holds `hotel_booking_id`;
holding both would need SSN plus booking id as the key.

**Is the validation only in JavaScript?**
No. Every rule is enforced in the PHP endpoint. The checks in the browser are
there for quick feedback; the ones that count are server-side, and the admin
reports check `isAdmin()` in `account_query.php` rather than relying on the
buttons not being drawn.

**Do infants take a seat?**
Yes, in this implementation. Section 7 says a flight must have "enough
available seats for all passengers", so all three categories count towards the
seat check. Infants are only exempt from the hotel room count, which is what
section 8 says.

---

## Where everything is

```
hw4/
  index.php  flights.php  stays.php  cart.php  contact.php  my-account.php
  register.php  login.php            <- teammate's, see AUTH-CONTRACT.md
  mystyle.css  script.js             <- shared layout and the section 5 controls
  flights.json                       <- section 6, 50 flights
  hotels.xml                         <- section 8, 23 hotels
  contacts.xml                       <- section 4, written by the app
  config/
    db.php        PDO connection, finds XAMPP's MySQL or a local one
    session.php   login checks and the cart
    cities.php    the Texas and California lists, and the date window
    travel.php    passenger counts, ticket pricing, the rooms rule
  includes/       header, sidebar, footer
  js/             one file per page
  api/            every endpoint; all the SQL lives here
  sql/schema.sql  the 8 tables and the seeded admin
  tests/          pages.sh, reports.sh, call.php
```

The rule is that no SQL and no booking logic lives in JavaScript. The browser
asks; `api/` decides.
