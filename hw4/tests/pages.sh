#!/bin/bash
# Checks that every page renders, that PHP prints no notices into the
# markup, that the nav bar links all 7 pages, and that a page that needs
# login says so when nobody is logged in.
#
#   ./tests/pages.sh [base-url]
cd "$(dirname "$0")/.."

BASE="${1:-http://localhost:8080}"

printf "%-16s %6s %8s %7s %7s %8s\n" PAGE HTTP PHP_ERRS NAV PROMPT BYTES

# All 7 pages. register.php and login.php are the only two that do not need a
# login, so PROMPT is expected to be 0 on those and 1 on the rest.
for page in index.php flights.php stays.php cart.php contact.php \
            my-account.php register.php login.php; do
    body=$(curl -s "$BASE/$page")
    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/$page")

    errs=$(printf '%s' "$body" | grep -c -i -E "Fatal error|Parse error|Warning:|Deprecated:|Notice:")
    nav=$(printf '%s' "$body" \
        | grep -o -E 'href="(flights|stays|contact|cart|my-account|register|login)\.php"' \
        | sort -u | wc -l | tr -d ' ')
    prompt=$(printf '%s' "$body" | grep -c 'login.php">log in')

    printf "%-16s %6s %8s %7s %7s %8s\n" \
        "$page" "$code" "$errs" "$nav" "$prompt" "${#body}"
done

echo
echo "PHP_ERRS should be 0 everywhere, NAV should be 7 everywhere."
echo "PROMPT is 1 on the pages that need a login, 0 on register and login."

echo
echo "=== php -l on every file ==="
problems=0

while IFS= read -r file; do
    if ! output=$(php -l "$file" 2>&1); then
        echo "$output"
        problems=$((problems + 1))
    fi
done < <(find . -name "*.php")

if [ "$problems" -eq 0 ]; then
    echo "all files parse"
else
    echo "$problems file(s) failed to parse"
fi
