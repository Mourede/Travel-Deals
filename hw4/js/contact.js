// ======================================================
// contact.js - the contact page (section 4)
// ======================================================

var MIN_COMMENT_LENGTH = 10;


function updateCharCount() {
    var length = $("#comment").val().trim().length;
    var text = length + " character" + (length === 1 ? "" : "s") + ". ";

    if (length < MIN_COMMENT_LENGTH) {
        text += "At least " + MIN_COMMENT_LENGTH + " needed.";
    } else {
        text += "Long enough to submit.";
    }

    $("#charCount").text(text);
}


function submitComment() {
    clearBox("contactRecord");
    $("#contactMessage").html('<p class="spinner">Saving...</p>');

    postJson("api/submit_contact.php", $("#contactForm").serialize())
        .done(function (res) {
            showOk("contactMessage", res.message);
            renderRecord(res.record, res.total);

            $("#comment").val("");
            updateCharCount();
        })
        .fail(function (message) {
            showError("contactMessage", message);
        });
}


// Shows what went into contacts.xml, so it is clear the record was stored.
function renderRecord(record, total) {
    var html = '<div class="result confirmation"><h3>Saved to contacts.xml</h3>';

    html += "<p><strong>Contact id:</strong> " + esc(record.contactId) + "</p>";
    html += "<p><strong>Phone number:</strong> " + esc(record.phone) + "</p>";
    html += "<p><strong>First name:</strong> " + esc(record.firstName) + "</p>";
    html += "<p><strong>Last name:</strong> " + esc(record.lastName) + "</p>";
    html += "<p><strong>Date of birth:</strong> " + esc(record.dateOfBirth) + "</p>";
    html += "<p><strong>Email:</strong> " + esc(record.email) + "</p>";
    html += "<p><strong>Gender:</strong> " +
        (record.gender ? esc(record.gender) : "not given") + "</p>";
    html += "<p><strong>Comment:</strong> " + esc(record.comment) + "</p>";

    html += '<p class="saved-note">contacts.xml now holds ' + esc(total) +
        " comment" + (total === 1 ? "" : "s") + ".</p>";

    html += "</div>";

    $("#contactRecord").html(html);
}


$(function () {
    updateCharCount();
});
