<?php
/**
 * Rules shared by the flights and stays pages: passenger counts, ticket
 * pricing, and how many hotel rooms a group needs.
 *
 * Search and booking both have to agree on all of this — if the search
 * priced a trip one way and the booking priced it another, the total the
 * user agreed to would not be the total they were charged.
 */

require_once __DIR__ . '/cities.php';

const PASSENGER_CATEGORIES = ['adult', 'child', 'infant'];

// Section 7 and 8: no category may exceed 4.
const MAX_PER_CATEGORY = 4;

// Section 7: a child's ticket is 70% of the adult fare, an infant's is 10%.
const CATEGORY_RATES = [
    'adult'  => 1.00,
    'child'  => 0.70,
    'infant' => 0.10,
];

const CATEGORY_LABELS = [
    'adult'  => 'Adults',
    'child'  => 'Children',
    'infant' => 'Infants',
];

// "children" is not "childs", so the singular forms are spelled out rather
// than derived by stripping an s.
const CATEGORY_LABELS_SINGULAR = [
    'adult'  => 'adult',
    'child'  => 'child',
    'infant' => 'infant',
];

/**
 * Reads adults / children / infants out of a request and checks them
 * against section 7's limits. Errors are appended to $errors so the caller
 * can report every problem at once rather than one at a time.
 */
function read_passenger_counts(array $source, array &$errors): array
{
    $counts = [];

    foreach (PASSENGER_CATEGORIES as $category) {
        $raw = $source[$category] ?? '0';

        if ($raw === '' || $raw === null) {
            $raw = '0';
        }

        if (!preg_match('/^\d+$/', (string) $raw)) {
            $errors[] = 'Number of ' . strtolower(CATEGORY_LABELS[$category])
                . ' must be a whole number.';
            $counts[$category] = 0;
            continue;
        }

        $value = (int) $raw;

        if ($value > MAX_PER_CATEGORY) {
            $errors[] = 'Number of ' . strtolower(CATEGORY_LABELS[$category])
                . ' cannot be more than ' . MAX_PER_CATEGORY . '.';
        }

        $counts[$category] = $value;
    }

    if (array_sum($counts) === 0) {
        $errors[] = 'Enter at least one passenger.';
    } elseif ($counts['adult'] === 0) {
        $errors[] = 'At least one adult must travel with children or infants.';
    }

    return $counts;
}

function total_passengers(array $counts): int
{
    return array_sum($counts);
}

/**
 * A readable "2 adults, 1 child" for echoing the search back to the user.
 */
function describe_passengers(array $counts): string
{
    $parts = [];

    foreach ($counts as $category => $count) {
        if ($count > 0) {
            $label = $count === 1
                ? CATEGORY_LABELS_SINGULAR[$category]
                : strtolower(CATEGORY_LABELS[$category]);

            $parts[] = $count . ' ' . $label;
        }
    }

    return $parts ? implode(', ', $parts) : 'no passengers';
}

/**
 * The fare for one passenger on one leg, at the category's rate.
 */
function ticket_price(float $adultFare, string $category): float
{
    return round($adultFare * CATEGORY_RATES[$category], 2);
}

/**
 * What one leg costs for the whole group.
 */
function leg_total(float $adultFare, array $counts): float
{
    $total = 0.0;

    foreach ($counts as $category => $count) {
        $total += ticket_price($adultFare, $category) * $count;
    }

    return round($total, 2);
}

/**
 * Section 8: two guests to a room, except infants, who stay with an adult
 * and so do not count towards the limit.
 */
function rooms_needed(array $counts): int
{
    $countsTowardsRooms = $counts['adult'] + $counts['child'];

    if ($countsTowardsRooms === 0) {
        return 0;
    }

    return (int) ceil($countsTowardsRooms / 2);
}

function nights_between(string $checkIn, string $checkOut): int
{
    $in  = new DateTimeImmutable($checkIn);
    $out = new DateTimeImmutable($checkOut);

    return (int) $in->diff($out)->days;
}

/**
 * Validates one traveller's details, used for both flight passengers and
 * hotel guests. Returns the cleaned row, and pushes any problem onto
 * $errors with the traveller's position so the user knows which form to fix.
 */
function read_traveller(array $source, int $index, string $category, array &$errors): array
{
    $position = 'Traveller ' . ($index + 1);

    $firstName = trim($source['firstName'][$index] ?? '');
    $lastName  = trim($source['lastName'][$index] ?? '');
    $dob       = trim($source['dob'][$index] ?? '');
    $ssn       = trim($source['ssn'][$index] ?? '');

    if ($firstName === '') {
        $errors[] = $position . ': enter a first name.';
    }

    if ($lastName === '') {
        $errors[] = $position . ': enter a last name.';
    }

    if (!is_valid_date($dob)) {
        $errors[] = $position . ': enter a date of birth as yyyy-mm-dd.';
    }

    // ddd-dd-dddd, the usual SSN shape, so the unique key stays consistent.
    if (!preg_match('/^\d{3}-\d{2}-\d{4}$/', $ssn)) {
        $errors[] = $position . ': enter an SSN formatted ddd-dd-dddd.';
    }

    return [
        'firstName' => $firstName,
        'lastName'  => $lastName,
        'dob'       => $dob,
        'ssn'       => $ssn,
        'category'  => $category,
    ];
}

/**
 * Reads the whole traveller form and checks it against the category counts
 * the search was run with, so the number of forms filled in has to match
 * the number of people being booked.
 */
function read_travellers(array $source, array $counts, array &$errors): array
{
    $expected = [];

    foreach ($counts as $category => $count) {
        for ($i = 0; $i < $count; $i++) {
            $expected[] = $category;
        }
    }

    $submitted = count($source['ssn'] ?? []);

    if ($submitted !== count($expected)) {
        $errors[] = 'Enter details for all ' . count($expected)
            . ' travellers before booking.';
        return [];
    }

    $travellers = [];

    foreach ($expected as $index => $category) {
        $travellers[] = read_traveller($source, $index, $category, $errors);
    }

    $ssns = array_column($travellers, 'ssn');

    if (count(array_unique($ssns)) !== count($ssns)) {
        $errors[] = 'Each traveller needs their own SSN.';
    }

    return $travellers;
}
