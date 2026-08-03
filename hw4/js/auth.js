// ======================================================
// auth.js - register and login (section 1)
//
// Reference implementation, see AUTH-CONTRACT.md.
//
// The real validation is in api/register.php. What is here is quick
// feedback while typing, plus posting the form and reloading on success so
// the header picks up the newly signed-in name.
// ======================================================

function submitRegistration() {
    var password = $("#password").val();
    var confirm = $("#confirmPassword").val();

    // Checked here as well because it needs no round trip and it is the
    // mistake people make most often.
    if (password !== confirm) {
        showError("authMessage", "The two passwords do not match.");
        return;
    }

    $("#authMessage").html('<p class="spinner">Registering...</p>');

    postJson("api/register.php", $("#registerForm").serialize())
        .done(function (res) {
            showOk("authMessage", res.message);
            goHome();
        })
        .fail(function (message) {
            showError("authMessage", message);
        });
}


function submitLogin() {
    $("#authMessage").html('<p class="spinner">Logging in...</p>');

    postJson("api/login.php", $("#loginForm").serialize())
        .done(function (res) {
            showOk("authMessage", res.message);
            goHome(res.isAdmin);
        })
        .fail(function (message) {
            showError("authMessage", message);
        });
}


// A moment on the success message, then move on. The header only shows the
// signed-in name after a page load, so this has to navigate rather than
// leave them on the form.
function goHome(isAdmin) {
    var target = isAdmin ? "my-account.php" : "index.php";

    $("#authMessage").append(
        '<p class="saved-note">Taking you to the site. ' +
        '<a href="' + target + '">Go now</a>.</p>'
    );

    window.setTimeout(function () {
        window.location.href = target;
    }, 1200);
}
