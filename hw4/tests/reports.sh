#!/bin/bash
# Runs all twelve my-account reports and prints a one-line summary of each,
# so a change to the SQL can be checked against every report at once.
#
#   ./tests/reports.sh
cd "$(dirname "$0")/.."

ADMIN='{"phone":"222-222-2222","firstName":"Site","lastName":"Admin"}'
USER='{"phone":"214-555-1234","firstName":"Jane","lastName":"Doe"}'

summarize() {
    python3 -c "
import json, sys

raw = sys.stdin.read()

try:
    d = json.loads(raw)
except ValueError:
    print('  NOT JSON:', raw[:300]); sys.exit()

if not d.get('ok'):
    print('  ERROR:', d.get('error')); sys.exit()

if 'summary' in d:
    print('  count =', d['summary']['value'])

for t in d.get('tables', []):
    print('  %-58s %d row(s)' % (t['title'][:58], len(t['rows'])))
"
}

run() {
    local label="$1" session="$2" body="$3"
    echo "$label"
    php tests/call.php api/account_query.php "$session" "$body" | summarize
}

echo "=============== USER LOOKUPS ==============="
run "1. booking lookup by both ids" "$USER" '{"query":"booking_lookup","flightBookingId":"1001","hotelBookingId":"2001"}'
run "2. passengers on a booking"    "$USER" '{"query":"booking_passengers","flightBookingId":"1001"}'
run "3. everything in Sep 2024"     "$USER" '{"query":"september_2024"}'
run "4. flights by SSN"             "$USER" '{"query":"flights_by_ssn","ssn":"111-22-3333"}'

echo
echo "=============== ADMIN REPORTS ==============="
run "5. Texas departures Sep-Oct"   "$ADMIN" '{"query":"tx_departures"}'
run "6. Texas hotels Sep-Oct"       "$ADMIN" '{"query":"tx_hotels"}'
run "7. most expensive hotels"      "$ADMIN" '{"query":"expensive_hotels"}'
run "8. flights with an infant"     "$ADMIN" '{"query":"flights_with_infant"}'
run "9. infant + 5 children"        "$ADMIN" '{"query":"infant_and_children"}'
run "10. most expensive flights"    "$ADMIN" '{"query":"expensive_flights"}'
run "11. Texas departures, no infant" "$ADMIN" '{"query":"tx_no_infant"}'
run "12. California arrivals count" "$ADMIN" '{"query":"ca_arrivals_count"}'

echo
echo "=============== ACCESS CONTROL ==============="
run "admin report as a normal user" "$USER" '{"query":"tx_departures"}'
run "user lookup while logged out"  '{"logout":true}' '{"query":"september_2024"}'
run "unknown report name"           "$ADMIN" '{"query":"nonsense"}'
