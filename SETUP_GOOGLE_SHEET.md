# Google Sheet Contact Form Backend Setup

This guide explains how to set up the free Google Apps Script backend to receive contact form submissions and save them to a Google Sheet.

## 1. Create the Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it `UserMessages` (or whatever you prefer).
3. In the first row (headers), ensure you have these columns:
   - **A1**: Time
   - **B1**: Name
   - **C1**: Email
   - **D1**: Messages

## 2. Add the Script
1. In the Google Sheet, click **Extensions** > **Apps Script**.
2. Delete any default code in `Code.gs` and paste the following script:

```javascript
var SHEET_ID = "1dT2cuX3kt3TEsff1krC4QHdVa-nDI_tib4rQDOlIhUI";
var RECIPIENT_EMAIL = "airgas.safetyservice@gmail.com";

function getTargetSheet_(ss) {
  var sheet = ss.getSheetByName("Sheet1");
  if (sheet) return sheet;
  var sheets = ss.getSheets();
  return sheets && sheets.length ? sheets[0] : null;
}

function getLogSheet_(ss) {
  var sheet = ss.getSheetByName("Logs");
  if (sheet) return sheet;
  sheet = ss.insertSheet("Logs");
  sheet.appendRow(["Time", "Type", "Message"]);
  return sheet;
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ result: "ok", time: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      var data = JSON.parse(e.postData.contents);
      var name = data.name || "No Name";
      var email = data.email || "No Email";
      var message = data.message || "No Message";
      
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var sheet = getTargetSheet_(ss);
      var logs = getLogSheet_(ss);
      var timestamp = new Date();
      
      sheet.getRange(2, 1, 1, 4).setValues([[timestamp, name, email, message]]);

      var lastRow = sheet.getLastRow();
      if (lastRow > 2) {
        sheet.deleteRows(3, lastRow - 2);
      }
      
      var recipient = RECIPIENT_EMAIL; 
      var subject = "New Contact Form Submission: " + name;
      var plainBody = "Name: " + name + "\nEmail: " + email + "\nMessage:\n" + message;
      
      var htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0056b3; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0;">New Message Received</h2>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #333;">You have received a new inquiry from your website.</p>
            <div style="margin-bottom: 15px;">
              <strong style="display: block; font-size: 14px; color: #555; margin-bottom: 5px;">Name:</strong>
              <div style="background-color: #f9f9f9; padding: 10px; border-radius: 4px; border-left: 4px solid #0056b3;">${name}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <strong style="display: block; font-size: 14px; color: #555; margin-bottom: 5px;">Email:</strong>
              <div style="background-color: #f9f9f9; padding: 10px; border-radius: 4px; border-left: 4px solid #0056b3;">
                <a href="mailto:${email}" style="color: #0056b3; text-decoration: none;">${email}</a>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <strong style="display: block; font-size: 14px; color: #555; margin-bottom: 5px;">Message:</strong>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; border-left: 4px solid #0056b3; white-space: pre-wrap;">${message}</div>
            </div>
            <p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">Sent from Airgas Technology Website</p>
          </div>
        </div>
      `;
      
      try {
        GmailApp.sendEmail(recipient, subject, plainBody, { htmlBody: htmlBody });
      } catch (emailError) {
        logs.appendRow([new Date(), "Email Failed", emailError.toString()]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
        .setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
      try {
        var ss2 = SpreadsheetApp.openById(SHEET_ID);
        var logs2 = getLogSheet_(ss2);
        logs2.appendRow([new Date(), "CRITICAL ERROR", error.toString()]);
      } catch (_) {}
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    } finally {
      lock.releaseLock();
    }
  } else {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "Busy" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// === RUN THIS FUNCTION TO FORCE PERMISSIONS ===
function testConnection() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  console.log("Success! Connected to: " + ss.getName());
  GmailApp.getInboxThreads(0,1);
  console.log("Success! Gmail permission granted.");
}
```

3. **Important:** Change `your-email@gmail.com` to your real email address.
4. Click the **Save** icon (disk).

## 3. Force Authorization (Fix for "Missing Permissions")
1. In the toolbar, select **testConnection** from the dropdown menu (next to "Debug").
2. Click **Run**.
3. **Now the Authorization Window should appear.**
4. Follow the steps: **Review Permissions** > Choose Account > **Advanced** > **Go to (unsafe)** > **Allow**.
5. Verify that the "Execution Log" at the bottom says "Success! Connected to..."

## 4. Deploy as Web App (Crucial Step)
1. Click the blue **Deploy** button > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure these settings EXACTLY:
   - **Description**: Contact Backend V2
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone** (this is important so your website visitors can submit)
4. Click **Deploy**.
5. Copy the **Web App URL** (it ends with `/exec`).

## 5. Connect to Your Website
1. Open the file `html/contact.html` in your GitHub repository.
2. Find this line near the top:
   ```html
   <meta name="contact-endpoint" content="https://script.google.com/macros/s/REPLACE_WITH_YOUR_WEB_APP_URL/exec">
   ```
3. Replace `REPLACE_WITH_YOUR_WEB_APP_URL` with the long ID from your Web App URL.
   - Example: if your URL is `https://script.google.com/macros/s/AKfycbx.../exec`, paste that entire URL into the content attribute.
4. Commit and push the change to GitHub.
