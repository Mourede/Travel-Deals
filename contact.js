// regex patterns for the contact form
var nameRegex = /^[A-Z][a-zA-Z]*$/;
var phoneRegex = /^\(\d{3}\)\d{3}-\d{4}$/;
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function submitContact() {

  var message = document.getElementById("message");
  message.innerHTML = "";

  var firstName = document.getElementById("firstName").value.trim();
  var lastName = document.getElementById("lastName").value.trim();
  var phone = document.getElementById("phone").value.trim();
  var email = document.getElementById("email").value.trim();
  var comment = document.getElementById("comment").value.trim();
  var genderChecked = document.querySelector('input[name="gender"]:checked');


  if (firstName == "" || lastName == "" || phone == "" || email == "" || comment == "") {
    message.innerHTML = "<p class='error'>Please fill out all fields.</p>";
    return;
  }

  if (!nameRegex.test(firstName)) {
    message.innerHTML =
      "<p class='error'>First name must be alphabetic and start with a capital letter.</p>";
    return;
  }

  if (!nameRegex.test(lastName)) {
    message.innerHTML =
      "<p class='error'>Last name must be alphabetic and start with a capital letter.</p>";
    return;
  }

  if (firstName.toLowerCase() == lastName.toLowerCase()) {
    message.innerHTML = "<p class='error'>First name and last name cannot be the same.</p>";
    return;
  }

  if (!phoneRegex.test(phone)) {
    message.innerHTML =
      "<p class='error'>Phone number must be formatted as (ddd)ddd-dddd, example: (214)555-1234.</p>";
    return;
  }

  if (!genderChecked) {
    message.innerHTML = "<p class='error'>Please select a gender.</p>";
    return;
  }

  if (!emailRegex.test(email)) {
    message.innerHTML = "<p class='error'>Email must contain @ and a valid domain.</p>";
    return;
  }

  if (comment.length < 10) {
    message.innerHTML = "<p class='error'>Comment must be at least 10 characters long.</p>";
    return;
  }

  // everything passed, so build the object we're going to save
  var contactEntry = {
    firstName: firstName,
    lastName: lastName,
    phone: phone,
    gender: genderChecked.value,
    email: email,
    comment: comment,
    submittedAt: new Date().toISOString()
  };

  var total = saveContactAsJSON(contactEntry);

  var result = "<div class='result'>";
  result += "<h3>Message Received</h3>";
  result += "<p><strong>Name:</strong> " + firstName + " " + lastName + "</p>";
  result += "<p><strong>Phone:</strong> " + phone + "</p>";
  result += "<p><strong>Gender:</strong> " + genderChecked.value + "</p>";
  result += "<p><strong>Email:</strong> " + email + "</p>";
  result += "<p><strong>Comment:</strong> " + comment + "</p>";
  result += "<p class='saved-note'>Stored in contact-submissions.json (" +
            total + " submission(s) saved so far).</p>";
  result += "</div>";

  message.innerHTML = result;

  var downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.className = "btn-select";
  downloadBtn.appendChild(document.createTextNode("Download contact-submissions.json"));
  downloadBtn.onclick = downloadContactSubmissions;

  message.appendChild(downloadBtn);
}


// there's no server here, so the submissions are kept in localStorage
// (which survives a refresh) and written out as a real .json file when
// the download button is clicked
function saveContactAsJSON(newEntry) {

  var submissions = readContactSubmissions();

  submissions.push(newEntry);
  localStorage.setItem("contactSubmissions", JSON.stringify(submissions));

  return submissions.length;
}

function readContactSubmissions() {

  var existing = localStorage.getItem("contactSubmissions");

  if (!existing) {
    return [];
  }

  try {
    return JSON.parse(existing);
  } catch (e) {
    return [];
  }
}

function downloadContactSubmissions() {

  var jsonText = JSON.stringify(readContactSubmissions(), null, 2);

  TravelData.downloadJson("contact-submissions.json", jsonText);
}