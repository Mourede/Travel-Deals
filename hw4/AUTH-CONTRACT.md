# Auth contract — `register.php` and `login.php`

This is everything you need to build the two auth pages without waiting on
the rest of the app. The database, the shared layout, and the session
helpers are already in place on the `a4-php-mysql` branch.

**You own:** `hw4/register.php`, `hw4/login.php`, and their two endpoints.
**Nothing else in `hw4/` needs to change.** If you think it does, message me
first — we will collide.

## Read this first: there is already a working version

Since the deadline was close and nothing else could be demoed until login
existed, I built a working `register.php` and `login.php` to this contract so
the app is usable now. **Your version is still the one we ship** — treat mine
as a placeholder and a reference.

Four files, and they are the only ones you need to touch:

```
hw4/register.php        the form
hw4/login.php           the form
hw4/api/register.php    the validation and the INSERT
hw4/api/login.php       password_verify and the session keys
hw4/js/auth.js          posts the two forms
```

Replace them with yours and everything else keeps working, as long as you set
the three session keys below. To compare against mine, the whole of section 1
is covered by:

```bash
./hw4/tests/verify-all.sh
```

That runs 19 checks on registration and login alone — every validation rule,
the duplicate-phone case, the hash check, and the admin check. If your version
passes those, it is a clean swap. **DESTRUCTIVE:** it rebuilds the database, so
do not run it during a demo.

The rest of this document is the contract itself, and it has not changed.

---

## The one thing that matters

Every other page reads the logged-in user through these three session keys.
Set all three on a successful login and on a successful registration:

```php
$_SESSION['phone']     = '214-555-1234';  // exactly as typed, ddd-ddd-dddd
$_SESSION['firstName'] = 'Jane';
$_SESSION['lastName']  = 'Doe';
```

That is the whole contract. `config/session.php` already provides
`currentUser()`, `isLoggedIn()`, `isAdmin()`, `requireLoginJson()` and
`requireAdminJson()`, and they all read those keys. Do not add other keys and
do not rename these — the header, the booking pages, the contact page and all
twelve account reports depend on them.

`isAdmin()` is just `$_SESSION['phone'] === '222-222-2222'`, so you do not need
an admin flag or a role column. Logging in as that phone number is what makes
someone an admin.

---

## The `users` table

Already created by `sql/schema.sql`. Do not alter it.

| Column | Type | Notes |
| --- | --- | --- |
| `phone` | `VARCHAR(12)` | primary key, so uniqueness is enforced by the database |
| `password` | `VARCHAR(255)` | bcrypt hash, wide enough for `password_hash()` |
| `first_name` | `VARCHAR(50)` | required |
| `last_name` | `VARCHAR(50)` | required |
| `date_of_birth` | `DATE` | store as `yyyy-mm-dd` |
| `gender` | `VARCHAR(10)` | **nullable** — the only optional field |
| `email` | `VARCHAR(120)` | required |

The admin row is already seeded: phone `222-222-2222`, password `admin123`.

---

## Validation rules (assignment section 1)

All seven, and all of them need to be checked **server-side**. Client-side
checks on top of that are nice but they are not what gets graded — anyone can
skip them.

| # | Rule | Suggested check |
| --- | --- | --- |
| 1 | Phone, password, first name, last name, date of birth and email are all required. Gender is not. | non-empty after `trim()` |
| 2 | Phone must be unique | let the `INSERT` fail and catch the duplicate, see below |
| 3 | Phone formatted `ddd-ddd-dddd` | `preg_match('/^\d{3}-\d{3}-\d{4}$/', $phone)` |
| 4 | Password entered twice, both the same | `$password === $confirm` |
| 5 | Password at least 8 characters | `strlen($password) >= 8` |
| 6 | Date of birth: 2-digit month, 2-digit day, 4-digit year | `is_valid_date()` in `config/cities.php` does exactly this, including rejecting impossible dates like `2024-02-31` |
| 7 | Email contains `@` and `.com` | `str_contains($email, '@') && str_contains($email, '.com')` |

Report **all** the failures at once rather than only the first — collect them
into an array and send the array back. The TA will type bad input on purpose.

### The unique-phone check

Do not `SELECT` first and then `INSERT`. Just insert and catch the duplicate,
which cannot race:

```php
try {
    $stmt = db()->prepare(
        'INSERT INTO users (phone, password, first_name, last_name, date_of_birth, gender, email)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $phone,
        password_hash($password, PASSWORD_DEFAULT),
        $firstName,
        $lastName,
        $dob,
        $gender === '' ? null : $gender,
        $email,
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        json_error('That phone number is already registered.');
    }
    throw $e;
}
```

Store the hash from `password_hash()`, never the plain password, and check it
on login with `password_verify($typed, $row['password'])`.

---

## How to wire the pages up

Copy the shape of any existing page. `contact.php` is the closest match —
a form that posts to an endpoint over Ajax and prints the result.

```php
<?php
$pageTitle  = 'Register';
$activePage = 'register';
$pageScript = 'auth.js';           // optional, goes in hw4/js/
require __DIR__ . '/includes/header.php';
?>

  <h2>Register</h2>
  <div id="formMessage"></div>
  <!-- your form -->

<?php require __DIR__ . '/includes/footer.php'; ?>
```

That gives you the header, the nav bar, the live clock, the sidebar display
controls and the footer for free, and it satisfies sections 2, 3 and 5 on your
two pages without you writing any of it.

Your endpoints go in `hw4/api/` and start like this:

```php
<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/cities.php';   // for is_valid_date()

$errors = [];
// ... validate $_POST ...

if ($errors) {
    json_error(implode(' ', $errors));
}

// ... insert, set the three session keys ...

json_ok(['message' => 'Registered. You are now logged in.']);
```

`json_ok()` and `json_error()` live in `config/db.php`. Every endpoint in the
app replies in the same `{ok: true, ...}` / `{ok: false, error: "..."}` shape,
and `postJson()` in `script.js` is the client half of it:

```js
postJson("api/register.php", $("#registerForm").serialize())
    .done(function (res) { showOk("formMessage", res.message); })
    .fail(function (msg) { showError("formMessage", msg); });
```

`showOk`, `showError` and `esc` are already in `script.js`.

After a successful registration the assignment says to prompt the user, so
show the success message and link to `login.php` — or just set the session
keys and send them to `index.php` already logged in. Either reads fine.

---

## Running it locally

MySQL and PHP, no XAMPP needed:

```bash
./hw4/sql/start-dev-server.sh          # MySQL on 3306, PHP on http://localhost:8080/
```

If the tables are ever in a bad state, `mysql -u root < hw4/sql/schema.sql`
drops and rebuilds the database from scratch, admin row included. That wipes
bookings too, so tell me before you run it if we are mid-demo.

Under XAMPP instead: start Apache and MySQL from the control panel, symlink
`hw4/` into `htdocs/`, and run the same `schema.sql` once. `config/db.php`
finds either MySQL on its own — you should not have to touch it.

---

## Checklist before you push

- [ ] All seven validation rules rejected server-side, with the messages shown on the page
- [ ] Two mismatched passwords rejected
- [ ] A password of 7 characters rejected
- [ ] A second registration with the same phone rejected
- [ ] `2024-13-45` rejected as a date of birth
- [ ] An email with no `.com` rejected
- [ ] Gender left blank still registers
- [ ] Password stored as a bcrypt hash, not plain text
- [ ] Login with the right password sets all three session keys
- [ ] Login with the wrong password does not
- [ ] After logging in, your name shows in the header on `flights.php` (proves the contract works)
- [ ] Logging in as `222-222-2222` / `admin123` shows the admin panel on `my-account.php`

That last one is the real integration test. If the admin panel appears, you
are done and the rest of the app is talking to your login correctly.
