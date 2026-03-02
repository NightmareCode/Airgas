
# Google Sheet Contact Form Backend Setup

This guide explains how to set up the free Google Apps Script backend to receive contact form submissions and save them to a Google Sheet.

## 1. Create the Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it `Airgas Contact Submissions` (or similar).
3. In the first row (headers), add these columns:
   - **A1**: Timestamp
   - **B1**: Name
   - **C1**: Email
   - **D1**: Message
   - **E1**: Page URL

## 2. Add the Script
1. In the Google Sheet, click **Extensions** > **Apps Script**.
2. Delete any default code in `Code.gs` and paste the following script:

```javascript
function doPost(e) {
  try {
    // 1. Parse the incoming JSON data
    // Note: The website sends data as JSON string in the post body
    var data = JSON.parse(e.postData.contents);
    var name = data.name || "";
    var email = data.email || "";
    var message = data.message || "";
    var pageUrl = data.pageUrl || "";
    
    // 2. Append to the Google Sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var timestamp = new Date();
    sheet.appendRow([timestamp, name, email, message, pageUrl]);
    
    // 3. (Optional) Send Email Notification to yourself
    // Replace "your-email@gmail.com" with your actual email if you want notifications
    // MailApp.sendEmail({
    //   to: "your-email@gmail.com",
    //   subject: "New Contact Form Submission: " + name,
    //   body: "Name: " + name + "\nEmail: " + email + "\nMessage:\n" + message
    // });
    
    // 4. Return success response
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. (Optional) Uncomment the email section (lines 17-21) and put your real email address if you want to be notified.
4. Click the **Save** icon (disk).

## 3. Deploy as Web App (Crucial Step)
1. Click the blue **Deploy** button > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure these settings EXACTLY:
   - **Description**: Contact Backend
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone** (this is important so your website visitors can submit)
4. Click **Deploy**.
5. Authorize the script (click "Review permissions", choose your account, click "Advanced" > "Go to ... (unsafe)" > "Allow").
6. Copy the **Web App URL** (it ends with `/exec`).

## 4. Connect to Your Website
1. Open the file `html/contact.html` in your GitHub repository.
2. Find this line near the top:
   ```html
   <meta name="contact-endpoint" content="https://script.google.com/macros/s/REPLACE_WITH_YOUR_WEB_APP_URL/exec">
   ```
3. Replace `REPLACE_WITH_YOUR_WEB_APP_URL` with the long ID from your Web App URL.
   - Example: if your URL is `https://script.google.com/macros/s/AKfycbx.../exec`, paste that entire URL into the content attribute.
4. Commit and push the change to GitHub.

## 5. Test It
1. Wait for GitHub Pages to update.
2. Go to your contact page and submit the form.
3. Check your Google Sheet—the new row should appear instantly!
