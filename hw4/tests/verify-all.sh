#!/bin/bash
# ============================================================
# End-to-end check of the whole assignment, from an empty database.
#
#   ./tests/verify-all.sh
#
# Rebuilds travel_deals, loads both data files as the admin, books a one
# way trip, a round trip and a hotel, leaves a comment, proves the
# double-booking guard works, and runs all twelve reports.
#
# DESTRUCTIVE: schema.sql drops the database, so this wipes any bookings.
# Do not run it in the middle of a demo.
#
# register.php and login.php are not covered, because they are the
# teammate's and the session is set up directly here instead.
# ============================================================
cd "$(dirname "$0")/.."

MYSQL="/opt/anaconda3/bin/mysql -h 127.0.0.1 -P 3306 -u root"
if ! $MYSQL -e "SELECT 1" > /dev/null 2>&1; then
    MYSQL="mysql -u root"
fi

ADMIN='{"phone":"222-222-2222","firstName":"Site","lastName":"Admin"}'
USER='{"phone":"222-222-2222","firstName":"Site","lastName":"Admin"}'

PASS=0
FAIL=0

# Asserts that an endpoint's JSON reply matches an expectation. The third
# argument is a Python expression evaluated with the reply bound to d.
check() {
    local label="$1" json="$2" expression="$3"

    result=$(printf '%s' "$json" | python3 -c "
import json, sys

raw = sys.stdin.read()

try:
    d = json.loads(raw)
except ValueError:
    print('NOT JSON: ' + raw[:200]); sys.exit()

try:
    print('PASS' if ($expression) else 'FAIL got ' + json.dumps(d)[:200])
except Exception as exc:
    print('FAIL evaluating: %s -- %s' % (exc, json.dumps(d)[:200]))
")

    if [ "${result:0:4}" = "PASS" ]; then
        PASS=$((PASS + 1))
        printf '  ok    %s\n' "$label"
    else
        FAIL=$((FAIL + 1))
        printf '  FAIL  %s\n     -> %s\n' "$label" "$result"
    fi
}

api() {
    php tests/call.php "api/$1" "$2" "$3"
}

sql() {
    $MYSQL travel_deals -N -B -e "$1" 2>/dev/null
}

echo "=================================================="
echo " 0. Rebuild the database"
echo "=================================================="
$MYSQL < sql/schema.sql || { echo "could not run schema.sql, is MySQL up?"; exit 1; }
echo "  ok    8 tables created, admin seeded"
rm -f contacts.xml

echo
echo "=================================================="
echo " Sections 6 and 8: the admin data loaders"
echo "=================================================="
check "flights.json loads 50 flights" \
    "$(api admin_load_flights.php "$ADMIN" '{}')" \
    "d['ok'] and d['loaded'] == 50"

check "hotels.xml loads 23 hotels" \
    "$(api admin_load_hotels.php "$ADMIN" '{}')" \
    "d['ok'] and d['loaded'] == 23"

check "re-running the loader is safe" \
    "$(api admin_load_flights.php "$ADMIN" '{}')" \
    "d['ok'] and d['total'] == 50"

check "a normal user cannot load data" \
    "$(api admin_load_flights.php '{"phone":"214-555-9999"}' '{}')" \
    "not d['ok'] and 'admin' in d['error'].lower()"

echo
echo "=================================================="
echo " Section 7: flight search validation"
echo "=================================================="
check "date outside Sep 1 - Dec 1 2024 rejected" \
    "$(api search_flights.php "$USER" '{"origin":"Dallas","destination":"Los Angeles","departureDate":"2025-01-15","adult":"1"}')" \
    "not d['ok'] and '2024-12-01' in d['error']"

check "city outside Texas and California rejected" \
    "$(api search_flights.php "$USER" '{"origin":"Miami","destination":"Los Angeles","departureDate":"2024-09-01","adult":"1"}')" \
    "not d['ok'] and 'Miami' in d['error']"

check "more than 4 in a category rejected" \
    "$(api search_flights.php "$USER" '{"origin":"Dallas","destination":"Los Angeles","departureDate":"2024-09-01","adult":"1","child":"9"}')" \
    "not d['ok'] and 'more than 4' in d['error']"

check "every problem reported at once, not just the first" \
    "$(api search_flights.php "$USER" '{"origin":"Miami","destination":"Los Angeles","departureDate":"2025-01-15","adult":"1","child":"9"}')" \
    "not d['ok'] and d['error'].count('.') >= 3"

check "same origin and destination rejected" \
    "$(api search_flights.php "$USER" '{"origin":"Dallas","destination":"Dallas","departureDate":"2024-09-01","adult":"1"}')" \
    "not d['ok'] and 'different' in d['error']"

check "no passengers rejected" \
    "$(api search_flights.php "$USER" '{"origin":"Dallas","destination":"Los Angeles","departureDate":"2024-09-01","adult":"0"}')" \
    "not d['ok'] and 'at least one passenger' in d['error'].lower()"

check "children with no adult rejected" \
    "$(api search_flights.php "$USER" '{"origin":"Dallas","destination":"Los Angeles","departureDate":"2024-09-01","adult":"0","child":"2"}')" \
    "not d['ok'] and 'adult' in d['error'].lower()"

check "return date before departure rejected" \
    "$(api search_flights.php "$USER" '{"tripType":"round","origin":"Dallas","destination":"Los Angeles","departureDate":"2024-09-10","returnDate":"2024-09-02","adult":"1"}')" \
    "not d['ok'] and 'before the departure' in d['error']"

check "search needs a login" \
    "$(api search_flights.php '{"logout":true}' '{}')" \
    "not d['ok'] and 'log in' in d['error'].lower()"

echo
echo "=================================================="
echo " Section 7: search behaviour"
echo "=================================================="
check "mixed case and stray spaces still match a city" \
    "$(api search_flights.php "$USER" '{"origin":"  dallas ","destination":"LOS ANGELES","departureDate":"2024-09-01","adult":"1"}')" \
    "d['ok'] and d['criteria']['origin'] == 'Dallas' and d['criteria']['destination'] == 'Los Angeles'"

check "exact date match is not widened" \
    "$(api search_flights.php "$USER" '{"origin":"Dallas","destination":"Los Angeles","departureDate":"2024-09-01","adult":"1"}')" \
    "d['ok'] and d['outbound']['widened'] is False and len(d['outbound']['flights']) >= 1"

check "empty date falls back to plus or minus 3 days" \
    "$(api search_flights.php "$USER" '{"origin":"Dallas","destination":"Los Angeles","departureDate":"2024-09-03","adult":"1"}')" \
    "d['ok'] and d['outbound']['widened'] is True and d['outbound']['from'] == '2024-08-31' and d['outbound']['to'] == '2024-09-06'"

check "a flight without enough seats is filtered out" \
    "$(api search_flights.php "$USER" '{"origin":"Dallas","destination":"Los Angeles","departureDate":"2024-09-01","adult":"4","child":"4","infant":"4"}')" \
    "d['ok'] and all(f['available_seats'] >= 12 for f in d['outbound']['flights'])"

echo
echo "=================================================="
echo " Section 7: booking a one way trip"
echo "=================================================="
SEATS_BEFORE=$(sql "SELECT available_seats FROM flights WHERE flight_id='F001'")

api search_flights.php "$USER" '{"origin":"Dallas","destination":"Los Angeles","departureDate":"2024-09-01","adult":"2","child":"1","infant":"1"}' > /dev/null

check "flight goes into the cart" \
    "$(api cart_add.php "$USER" '{"kind":"flight","flightId":"F001","leg":"departing"}')" \
    "d['ok'] and d['complete'] is True"

check "a short SSN is rejected" \
    "$(api book_flight.php "$USER" '{"firstName":["A","B","C","D"],"lastName":["W","X","Y","Z"],"dob":["1990-01-01","1991-01-01","2015-01-01","2024-01-01"],"ssn":["123","111-22-0002","111-22-0003","111-22-0004"]}')" \
    "not d['ok'] and 'ddd-dd-dddd' in d['error']"

check "too few traveller forms is rejected" \
    "$(api book_flight.php "$USER" '{"firstName":["A"],"lastName":["W"],"dob":["1990-01-01"],"ssn":["111-22-0001"]}')" \
    "not d['ok'] and 'all 4 travellers' in d['error']"

check "duplicate SSNs are rejected" \
    "$(api book_flight.php "$USER" '{"firstName":["A","B","C","D"],"lastName":["W","X","Y","Z"],"dob":["1990-01-01","1991-01-01","2015-01-01","2024-01-01"],"ssn":["111-22-0001","111-22-0001","111-22-0003","111-22-0004"]}')" \
    "not d['ok'] and 'own SSN' in d['error']"

ONEWAY=$(api book_flight.php "$USER" '{"firstName":["Jane","John","Lily","Baby"],"lastName":["Doe","Doe","Doe","Doe"],"dob":["1990-04-12","1988-07-30","2016-03-09","2024-01-20"],"ssn":["111-22-0001","111-22-0002","111-22-0003","111-22-0004"]}')

check "one way booking succeeds with one booking id" \
    "$ONEWAY" \
    "d['ok'] and len(d['bookings']) == 1"

check "one ticket per passenger" \
    "$ONEWAY" \
    "len(d['bookings'][0]['tickets']) == 4"

check "child is 70% and infant is 10% of the adult fare" \
    "$ONEWAY" \
    "[t['price'] for t in d['bookings'][0]['tickets']] == [180, 180, 126, 18]"

check "leg total is the sum of the tickets" \
    "$ONEWAY" \
    "d['bookings'][0]['totalPrice'] == 504"

SEATS_AFTER=$(sql "SELECT available_seats FROM flights WHERE flight_id='F001'")

if [ "$((SEATS_BEFORE - SEATS_AFTER))" -eq 4 ]; then
    PASS=$((PASS + 1))
    echo "  ok    seats dropped by 4 ($SEATS_BEFORE -> $SEATS_AFTER)"
else
    FAIL=$((FAIL + 1))
    echo "  FAIL  seats went $SEATS_BEFORE -> $SEATS_AFTER, expected a drop of 4"
fi

check "the cart is empty after booking" \
    "$(api book_flight.php "$USER" '{}')" \
    "not d['ok'] and 'no flight in your cart' in d['error']"

echo
echo "=================================================="
echo " Section 7: booking a round trip"
echo "=================================================="
api search_flights.php "$USER" '{"tripType":"round","origin":"Dallas","destination":"Los Angeles","departureDate":"2024-09-01","returnDate":"2024-09-03","adult":"1","child":"0","infant":"1"}' > /dev/null

check "one leg selected is not enough to book" \
    "$(api cart_add.php "$USER" '{"kind":"flight","flightId":"F001","leg":"departing"}')" \
    "d['ok'] and d['complete'] is False"

check "the same flight cannot serve both legs" \
    "$(api cart_add.php "$USER" '{"kind":"flight","flightId":"F001","leg":"returning"}')" \
    "not d['ok'] and 'different flight' in d['error']"

check "booking a half-filled round trip is refused" \
    "$(api book_flight.php "$USER" '{"firstName":["Jane","Baby"],"lastName":["Doe","Doe"],"dob":["1990-04-12","2024-01-20"],"ssn":["111-22-0001","111-22-0004"]}')" \
    "not d['ok'] and 'returning flight' in d['error']"

api cart_add.php "$USER" '{"kind":"flight","flightId":"F026","leg":"returning"}' > /dev/null

ROUND=$(api book_flight.php "$USER" '{"firstName":["Jane","Baby"],"lastName":["Doe","Doe"],"dob":["1990-04-12","2024-01-20"],"ssn":["111-22-0001","111-22-0004"]}')

check "round trip writes two booking ids" \
    "$ROUND" \
    "d['ok'] and len(d['bookings']) == 2"

check "the two booking ids differ" \
    "$ROUND" \
    "d['bookings'][0]['flightBookingId'] != d['bookings'][1]['flightBookingId']"

check "each passenger gets a ticket on each leg" \
    "$ROUND" \
    "all(len(b['tickets']) == 2 for b in d['bookings'])"

check "the legs run in opposite directions" \
    "$ROUND" \
    "d['bookings'][0]['origin'] == d['bookings'][1]['destination']"

check "a repeat traveller does not duplicate the passenger row" \
    "$(sql 'SELECT COUNT(*) FROM passenger' | tr -d '[:space:]' | python3 -c 'import sys;print(chr(123)+chr(34)+"ok"+chr(34)+": true, "+chr(34)+"n"+chr(34)+": "+sys.stdin.read()+chr(125))')" \
    "d['n'] == 4"

echo
echo "=================================================="
echo " Section 7: a Texas departure with no infant, for report 11"
echo "=================================================="
api search_flights.php "$USER" '{"origin":"Houston","destination":"Los Angeles","departureDate":"2024-09-07","adult":"2"}' > /dev/null
api cart_add.php "$USER" '{"kind":"flight","flightId":"F003","leg":"departing"}' > /dev/null

check "one way, adults only, books cleanly" \
    "$(api book_flight.php "$USER" '{"firstName":["Mark","Ana"],"lastName":["Reed","Reed"],"dob":["1985-06-02","1987-11-19"],"ssn":["333-44-0001","333-44-0002"]}')" \
    "d['ok'] and len(d['bookings'][0]['tickets']) == 2"

echo
echo "=================================================="
echo " The double-booking guard"
echo "=================================================="
api search_flights.php "$USER" '{"origin":"Austin","destination":"Los Angeles","departureDate":"2024-09-16","adult":"3"}' > /dev/null
api cart_add.php "$USER" '{"kind":"flight","flightId":"F006","leg":"departing"}' > /dev/null

# Someone else takes the seats between the search and the booking.
sql "UPDATE flights SET available_seats = 1 WHERE flight_id = 'F006'"

BOOKINGS_BEFORE=$(sql "SELECT COUNT(*) FROM flight_booking")

check "booking a flight whose seats vanished is refused" \
    "$(api book_flight.php "$USER" '{"firstName":["P","Q","R"],"lastName":["A","B","C"],"dob":["1990-01-01","1991-01-01","1992-01-01"],"ssn":["555-66-0001","555-66-0002","555-66-0003"]}')" \
    "not d['ok'] and 'no longer has 3 seats' in d['error']"

BOOKINGS_AFTER=$(sql "SELECT COUNT(*) FROM flight_booking")
SEATS_F006=$(sql "SELECT available_seats FROM flights WHERE flight_id='F006'")

if [ "$BOOKINGS_BEFORE" = "$BOOKINGS_AFTER" ] && [ "$SEATS_F006" = "1" ]; then
    PASS=$((PASS + 1))
    echo "  ok    the whole transaction rolled back, nothing written"
else
    FAIL=$((FAIL + 1))
    echo "  FAIL  rollback leaked: bookings $BOOKINGS_BEFORE -> $BOOKINGS_AFTER, seats $SEATS_F006"
fi

echo
echo "=================================================="
echo " Section 8: hotels"
echo "=================================================="
check "check out before check in rejected" \
    "$(api search_hotels.php "$USER" '{"city":"Dallas","checkInDate":"2024-09-15","checkOutDate":"2024-09-12","adult":"1"}')" \
    "not d['ok'] and 'after the check in' in d['error']"

check "city outside Texas and California rejected" \
    "$(api search_hotels.php "$USER" '{"city":"Chicago","checkInDate":"2024-09-10","checkOutDate":"2024-09-12","adult":"1"}')" \
    "not d['ok'] and 'Chicago' in d['error']"

check "date outside the window rejected" \
    "$(api search_hotels.php "$USER" '{"city":"Dallas","checkInDate":"2024-08-01","checkOutDate":"2024-08-05","adult":"1"}')" \
    "not d['ok'] and '2024-09-01' in d['error']"

check "2 guests need 1 room" \
    "$(api search_hotels.php "$USER" '{"city":"Dallas","checkInDate":"2024-09-10","checkOutDate":"2024-09-13","adult":"2"}')" \
    "d['ok'] and d['criteria']['rooms'] == 1"

check "3 guests need 2 rooms" \
    "$(api search_hotels.php "$USER" '{"city":"Dallas","checkInDate":"2024-09-10","checkOutDate":"2024-09-13","adult":"3"}')" \
    "d['ok'] and d['criteria']['rooms'] == 2"

check "infants do not add a room" \
    "$(api search_hotels.php "$USER" '{"city":"Dallas","checkInDate":"2024-09-10","checkOutDate":"2024-09-13","adult":"2","infant":"4"}')" \
    "d['ok'] and d['criteria']['guests'] == 6 and d['criteria']['rooms'] == 1"

api search_hotels.php "$USER" '{"city":"Dallas","checkInDate":"2024-09-10","checkOutDate":"2024-09-13","adult":"2","child":"1"}' > /dev/null

check "hotel goes into the cart" \
    "$(api cart_add.php "$USER" '{"kind":"hotel","hotelId":"H001"}')" \
    "d['ok'] and d['cart']['rooms'] == 2 and d['cart']['nights'] == 3"

HOTEL=$(api book_hotel.php "$USER" '{"firstName":["Jane","John","Lily"],"lastName":["Doe","Doe","Doe"],"dob":["1990-04-12","1988-07-30","2016-03-09"],"ssn":["111-22-0001","111-22-0002","111-22-0003"]}')

check "hotel booking succeeds" \
    "$HOTEL" \
    "d['ok'] and d['booking']['hotelBookingId'] > 0"

check "total is rooms x nights x rate" \
    "$HOTEL" \
    "d['booking']['totalPrice'] == 2 * 3 * 142.0"

check "every guest is recorded" \
    "$HOTEL" \
    "len(d['booking']['guests']) == 3"

# A second, pricier hotel booking so the most-expensive report has something
# to choose between.
api search_hotels.php "$USER" '{"city":"Dallas","checkInDate":"2024-10-05","checkOutDate":"2024-10-09","adult":"4"}' > /dev/null
api cart_add.php "$USER" '{"kind":"hotel","hotelId":"H021"}' > /dev/null
api book_hotel.php "$USER" '{"firstName":["Mark","Ana","Paul","Sara"],"lastName":["Reed","Reed","Kim","Kim"],"dob":["1985-06-02","1987-11-19","1990-02-02","1991-03-03"],"ssn":["333-44-0001","333-44-0002","444-55-0001","444-55-0002"]}' > /dev/null

echo
echo "=================================================="
echo " Section 4: the contact page and contacts.xml"
echo "=================================================="
check "a comment under 10 characters is rejected" \
    "$(api submit_contact.php "$ADMIN" '{"comment":"too short"}')" \
    "not d['ok'] and '10 characters' in d['error']"

check "an empty comment is rejected" \
    "$(api submit_contact.php "$ADMIN" '{"comment":"    "}')" \
    "not d['ok']"

check "a comment needs a login" \
    "$(api submit_contact.php '{"logout":true}' '{"comment":"This is long enough to pass."}')" \
    "not d['ok'] and 'log in' in d['error'].lower()"

check "a valid comment is saved as contact id 3001" \
    "$(api submit_contact.php "$ADMIN" '{"comment":"The round trip search worked well, thanks."}')" \
    "d['ok'] and d['contactId'] == 3001"

check "a second comment appends rather than replacing" \
    "$(api submit_contact.php "$ADMIN" '{"comment":"Is 5 < 10 & is \"this\" escaped? Testing </contact> too."}')" \
    "d['ok'] and d['contactId'] == 3002 and d['total'] == 2"

if python3 -c "
import xml.etree.ElementTree as ET
import sys

root = ET.parse('contacts.xml').getroot()
contacts = root.findall('contact')

required = ['contactId', 'phone', 'firstName', 'lastName',
            'dateOfBirth', 'email', 'gender']

assert len(contacts) == 2, 'expected 2 contacts, found %d' % len(contacts)

for contact in contacts:
    for field in required:
        assert contact.find(field) is not None, 'missing ' + field

# The comment with the angle brackets has to have survived intact.
assert any('</contact>' in (c.findtext('comment') or '') for c in contacts), \
    'XML-hostile characters were not escaped and read back'
" 2>/dev/null; then
    PASS=$((PASS + 1))
    echo "  ok    contacts.xml is well-formed and has all 7 required fields"
else
    FAIL=$((FAIL + 1))
    echo "  FAIL  contacts.xml is malformed or missing fields"
fi

echo
echo "=================================================="
echo " Section 9: the twelve reports"
echo "=================================================="
report() {
    api account_query.php "$2" "{\"query\":\"$1\"$3}"
}

check "1. lookup by flight and hotel booking id" \
    "$(report booking_lookup "$USER" ',"flightBookingId":"1001","hotelBookingId":"2001"')" \
    "d['ok'] and len(d['tables']) == 4 and len(d['tables'][0]['rows']) == 1"

check "1b. either id works on its own" \
    "$(report booking_lookup "$USER" ',"flightBookingId":"1001"')" \
    "d['ok'] and len(d['tables']) == 2"

check "1c. neither id is an error" \
    "$(report booking_lookup "$USER" '')" \
    "not d['ok']"

check "2. all passengers on a booking" \
    "$(report booking_passengers "$USER" ',"flightBookingId":"1001"')" \
    "d['ok'] and len(d['tables'][0]['rows']) == 4"

check "3. everything booked for September 2024" \
    "$(report september_2024 "$USER" '')" \
    "d['ok'] and len(d['tables'][0]['rows']) >= 3 and len(d['tables'][1]['rows']) >= 1"

check "4. flights booked for one SSN" \
    "$(report flights_by_ssn "$USER" ',"ssn":"111-22-0001"')" \
    "d['ok'] and len(d['tables'][0]['rows']) >= 2"

check "4b. a malformed SSN is rejected" \
    "$(report flights_by_ssn "$USER" ',"ssn":"12345"')" \
    "not d['ok']"

check "5. Texas departures, Sep to Oct" \
    "$(report tx_departures "$ADMIN" '')" \
    "d['ok'] and len(d['tables'][0]['rows']) >= 1 and all(r['origin'] in ('Dallas','Houston','Austin','San Antonio','Fort Worth','El Paso','Lubbock','Corpus Christi','Amarillo','Midland') for r in d['tables'][0]['rows'])"

check "6. Texas hotels, Sep to Oct" \
    "$(report tx_hotels "$ADMIN" '')" \
    "d['ok'] and len(d['tables'][0]['rows']) >= 2"

check "7. most expensive hotels picks the maximum" \
    "$(report expensive_hotels "$ADMIN" '')" \
    "d['ok'] and len(d['tables'][0]['rows']) >= 1 and float(d['tables'][0]['rows'][0]['total_price']) == 2304.0"

check "8. flights with an infant" \
    "$(report flights_with_infant "$ADMIN" '')" \
    "d['ok'] and len(d['tables'][0]['rows']) == 3"

check "9. infant plus 5 children is empty by design" \
    "$(report infant_and_children "$ADMIN" '')" \
    "d['ok'] and len(d['tables'][0]['rows']) == 0 and 'caps children at 4' in d['note']"

check "10. most expensive flights" \
    "$(report expensive_flights "$ADMIN" '')" \
    "d['ok'] and len(d['tables'][0]['rows']) >= 1 and float(d['tables'][0]['rows'][0]['total_price']) == 504.0"

check "11. Texas departures with no infant" \
    "$(report tx_no_infant "$ADMIN" '')" \
    "d['ok'] and len(d['tables'][0]['rows']) == 1"

check "12. California arrivals is a count" \
    "$(report ca_arrivals_count "$ADMIN" '')" \
    "d['ok'] and d['summary']['value'] >= 2 and d['summary']['value'] == len(d['tables'][0]['rows'])"

echo
echo "=================================================="
echo " Access control"
echo "=================================================="
for query in tx_departures tx_hotels expensive_hotels flights_with_infant \
             infant_and_children expensive_flights tx_no_infant ca_arrivals_count; do
    check "$query is admin only" \
        "$(report "$query" '{"phone":"214-555-9999"}' '')" \
        "not d['ok'] and 'admin' in d['error'].lower()"
done

check "reports need a login" \
    "$(report september_2024 '{"logout":true}' '')" \
    "not d['ok'] and 'log in' in d['error'].lower()"

check "an unknown report name is rejected" \
    "$(report nonsense "$ADMIN" '')" \
    "not d['ok']"

echo
echo "=================================================="
printf " %d passed, %d failed\n" "$PASS" "$FAIL"
echo "=================================================="

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
