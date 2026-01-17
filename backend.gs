/**
 * Backend Handler for Stephen Gyan Bimpong's Portfolio
 * Handles: Form Submissions, Paystack Verification, and Email Notifications
 */

const CONFIG = {
  // Replace with the ID of your Google Sheet
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE', 
  ADMIN_EMAIL: 'mrgyan@veritrack.cloud',
  PAYSTACK_SECRET_KEY: 'sk_test_386ab2f9ed7d0b53f45666721aa4f208e483c28c',
  BRAND_COLOR: '#3b82f6', // Executive Blue
  BG_COLOR: '#0f0f11',    // Charcoal
  TEXT_COLOR: '#f8fafc'
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // 1. Parse Data
    var data = {};
    if (e.parameter) {
        data = e.parameter;
    }

    // 2. Verify Payment (if reference exists)
    var paymentInfo = { verified: false, amount: 0, channel: 'N/A' };
    if (data.reference) {
        paymentInfo = verifyPaystack(data.reference);
        if (!paymentInfo.verified) {
            throw new Error("Payment verification failed.");
        }
        data.paymentStatus = 'Paid';
        data.paymentAmount = paymentInfo.amount;
    } else {
        data.paymentStatus = 'Pending/None';
    }

    // 3. Save to Sheet
    saveToSheet(data);

    // 4. Send Confirmation Email (User)
    sendUserEmail(data);

    // 5. Send Notification Email (Admin)
    sendAdminEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function verifyPaystack(ref) {
    try {
        var url = 'https://api.paystack.co/transaction/verify/' + ref;
        var options = {
            method: 'get',
            headers: { 'Authorization': 'Bearer ' + CONFIG.PAYSTACK_SECRET_KEY }
        };
        var response = UrlFetchApp.fetch(url, options);
        var json = JSON.parse(response.getContentText());
        
        if (json.status && json.data.status === 'success') {
            return {
                verified: true,
                amount: json.data.amount / 100, // Convert kobo to currency
                channel: json.data.channel
            };
        }
    } catch (e) {
        Logger.log(e);
    }
    return { verified: false };
}

function saveToSheet(data) {
    // NOTE: You must run setup() once to create headers!
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var timestamp = new Date();
    
    sheet.appendRow([
        timestamp,
        data.name || '',
        data.email || '',
        data.phone || '',
        data.package || data.subject || '', // Item
        data.goals || data.message || '',   // Details
        data.paymentStatus,
        data.reference || ''
    ]);
}

function sendUserEmail(data) {
    if (!data.email) return;
    
    var subject = "Registration Confirmed: " + (data.package || "Inquiry Received");
    var htmlBody = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:4px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color:#0f0f11; padding:30px 40px; text-align:center; border-bottom: 3px solid #3b82f6;">
                <h1 style="color:#ffffff; margin:0; font-size:20px; letter-spacing:1px; font-weight:600;">STEPHEN GYAN BIMPONG</h1>
                <p style="color:#94a3b8; margin:5px 0 0; font-size:12px; text-transform:uppercase; letter-spacing:2px;">Systems Architect & Tech Coach</p>
            </div>
            
            <!-- Content -->
            <div style="padding:40px;">
                <h2 style="color:#0f0f11; font-size:22px; margin-top:0;">Hello ${data.name},</h2>
                <p style="color:#475569; font-size:16px; line-height:1.6;">
                    Thank you for your registration. This email confirms that we have received your submission for <strong>${data.package || 'Contact Inquiry'}</strong>.
                </p>
                
                ${data.reference ? `
                <div style="background-color:#eff6ff; border-left:4px solid #3b82f6; padding:15px; margin:25px 0; border-radius: 2px;">
                    <p style="margin:0; color:#1e40af; font-weight:bold; font-size:14px;">PAYMENT VERIFIED</p>
                    <p style="margin:5px 0 0; color:#3b82f6; font-size:13px;">Ref: ${data.reference}</p>
                </div>
                ` : ''}
                
                <p style="color:#475569; font-size:16px; line-height:1.6;">
                    I review every application personally to ensure we are a good fit. You will receive a follow-up email with the next steps shortly.
                </p>
                
                <p style="color:#475569; font-size:16px; margin-top:30px;">
                    Best regards,<br>
                    <strong>Stephen Gyan Bimpong</strong><br>
                    <span style="font-size:13px; color:#64748b;">CEO, VeriTrack Systems</span>
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color:#1a1a1d; padding:20px; text-align:center; color:#64748b; font-size:12px;">
                <p style="margin:0;">&copy; ${new Date().getFullYear()} Stephen Gyan Bimpong. All rights reserved.</p>
                <div style="margin-top:10px;">
                    <a href="https://linkedin.com/in/stephen-gyan-bimpong" style="color:#94a3b8; text-decoration:none; margin:0 5px;">LinkedIn</a> • 
                    <a href="https://x.com/_Stephen_Gyan" style="color:#94a3b8; text-decoration:none; margin:0 5px;">X (Twitter)</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    
    GmailApp.sendEmail(data.email, subject, "Thank you for your registration.", {
        htmlBody: htmlBody,
        name: "Stephen Gyan Bimpong"
    });
}

function sendAdminEmail(data) {
    var subject = "New Submission: " + (data.package || "Contact Form");
    var htmlBody = `
    <h3>New Website Submission</h3>
    <ul>
        <li><strong>Name:</strong> ${data.name}</li>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>Phone:</strong> ${data.phone}</li>
        <li><strong>Item:</strong> ${data.package || data.subject}</li>
        <li><strong>Details:</strong> ${data.goals || data.message}</li>
        <li><strong>Payment Ref:</strong> ${data.reference || 'N/A'}</li>
    </ul>
    `;
    
    GmailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, "New submission received.", {
        htmlBody: htmlBody
    });
}

function setup() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Item', 'Details', 'Payment Status', 'Reference']);
}
