/* 
   BACKEND GUIDE:
   1. Go to https://script.google.com/
   2. Create a new project.
   3. Paste this code into Code.gs.
   4. Run the 'setup' function once to create the sheet headers.
   5. Deploy -> New Deployment -> Type: Web App.
   6. Execute as: Me (your email).
   7. Who has access: Anyone.
   8. Copy the 'Web App URL' and paste it into assets/js/main.js
*/

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow() + 1;
    var newRow = [];
    var timestamp = new Date();

    // Map incoming parameters to headers
    for (var i = 0; i < headers.length; i++) {
        if (headers[i] === 'Timestamp') {
            newRow.push(timestamp);
        } else {
            newRow.push(e.parameter[headers[i]] || '');
        }
    }

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
    
    // Email Notification
    var email = e.parameter.email;
    var subject = "Application Received: " + (e.parameter.package || "Contact Form");
    var body = "Thank you for contacting Stephen Gyan Bimpong.\n\nWe have received your submission:\n" + 
               "Name: " + e.parameter.name + "\n" +
               "Item: " + (e.parameter.package || e.parameter.subject) + "\n\n" +
               "We will review your details and get back to you shortly.";
               
    if (email) {
      GmailApp.sendEmail(email, subject, body);
    }
    
    // Admin Notification
    GmailApp.sendEmail(Session.getActiveUser().getEmail(), "New Website Submission", JSON.stringify(e.parameter));

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function setup() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Standard headers combining both forms
  sheet.appendRow(['Timestamp', 'name', 'email', 'phone', 'package', 'goals', 'subject', 'message']);
}
