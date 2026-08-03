<?php
/**
 * The Texas and California city lists.
 *
 * Sections 7 and 8 restrict origin, destination and hotel city to these
 * two states, and five of the my-account admin reports filter on state,
 * so the lists live here and every page and report reads them.
 */

const TEXAS_CITIES = [
    'Dallas',
    'Houston',
    'Austin',
    'San Antonio',
    'Fort Worth',
    'El Paso',
    'Lubbock',
    'Corpus Christi',
    'Amarillo',
    'Midland',
];

const CALIFORNIA_CITIES = [
    'Los Angeles',
    'San Francisco',
    'San Diego',
    'Sacramento',
    'San Jose',
    'Oakland',
    'Fresno',
    'Long Beach',
    'Burbank',
    'Ontario',
];

function all_cities(): array
{
    return array_merge(TEXAS_CITIES, CALIFORNIA_CITIES);
}

/**
 * Matches a typed city against the allowed list without caring about
 * case or stray spaces, and returns it in its canonical spelling so
 * everything stored in the database looks the same.
 */
function canonical_city(string $input): ?string
{
    $needle = strtolower(trim(preg_replace('/\s+/', ' ', $input)));

    foreach (all_cities() as $city) {
        if (strtolower($city) === $needle) {
            return $city;
        }
    }

    return null;
}

function is_texas_city(string $city): bool
{
    return in_array($city, TEXAS_CITIES, true);
}

/**
 * Builds the "IN (?, ?, ...)" placeholder list for a state filter.
 * Used by the admin reports that select on Texas or California.
 */
function city_placeholders(array $cities): string
{
    return implode(', ', array_fill(0, count($cities), '?'));
}

// The booking window every date on the site has to fall inside (sections 7, 8).
const DATE_MIN = '2024-09-01';
const DATE_MAX = '2024-12-01';

function date_in_range(string $date): bool
{
    return $date !== '' && $date >= DATE_MIN && $date <= DATE_MAX;
}

/**
 * True only for a real calendar date written as yyyy-mm-dd, which also
 * enforces the 2-digit month / 2-digit day / 4-digit year rule.
 */
function is_valid_date(string $date): bool
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $m)) {
        return false;
    }

    return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}
