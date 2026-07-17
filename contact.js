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

  saveContactAsJSON(contactEntry);

  var result = "<div class='result'>";
  result += "<h3>Message Received</h3>";
  result += "<p><strong>Name:</strong> " + firstName + " " + lastName + "</p>";
  result += "<p><strong>Phone:</strong> " + phone + "</p>";
  result += "<p><strong>Gender:</strong> " + genderChecked.value + "</p>";
  result += "<p><strong>Email:</strong> " + email + "</p>";
  result += "<p><strong>Comment:</strong> " + comment + "</p>";
  result += "<p class='saved-note'>Saved to contact-submissions.json</p>";
  result += "</div>";

  message.innerHTML = result;
}


// there's no server here, so "store them in a JSON file" is done two ways:
//  1) keep a running list in localStorage so it survives a page refresh
//  2) actually download a real .json file with all the submissions in it
function saveContactAsJSON(newEntry) {

  var existing = localStorage.getItem("contactSubmissions");
  var submissions;

  if (existing) {
    submissions = JSON.parse(existing);
  } else {
    submissions = [];
  }

  submissions.push(newEntry);
  localStorage.setItem("contactSubmissions", JSON.stringify(submissions));

  var jsonText = JSON.stringify(submissions, null, 2);
  var blob = new Blob([jsonText], { type: "application/json" });
  var url = URL.createObjectURL(blob);

  var downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "contact-submissions.json";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  URL.revokeObjectURL(url);
}