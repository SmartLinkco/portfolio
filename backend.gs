/**
 * Backend Handler for Stephen Gyan Bimpong's Portfolio
 * Handles: Form Submissions, Paystack Verification, and Email Notifications
 */

const CONFIG = {
  SPREADSHEET_ID: '1VjAEn55aYmWr0U-i1JM1tjTts50D6m1Qyrhwrqd-uoY', 
  ADMIN_EMAIL: 'mrgyan@veritrack.cloud',
  PAYSTACK_SECRET_KEY: 'sk_test_386ab2f9ed7d0b53f45666721aa4f208e483c28c'
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = e.parameter || {};

    // Verify Payment if needed
    data.paymentAmount = 0;
    if (data.reference) {
        var paymentInfo = verifyPaystack(data.reference);
        if (!paymentInfo.verified) {
            throw new Error("Payment verification failed.");
        }
        data.paymentStatus = 'Paid';
        data.paymentAmount = paymentInfo.amount;
    } else {
        data.paymentStatus = 'Pending/None';
    }

    // Save and Send
    saveToSheet(data);
    sendUserEmail(data);
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
        return {
            verified: (json.status && json.data.status === 'success'),
            amount: json.data.amount / 100
        };
    } catch (e) {
        return { verified: false };
    }
}

function saveToSheet(data) {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheet;
    var timestamp = new Date();

    if (data.formType === 'engagement') {
        // Engagement Sheet
        sheet = ss.getSheetByName('Engagements');
        if (!sheet) {
            sheet = ss.insertSheet('Engagements');
            sheet.appendRow(['Timestamp', 'Name', 'Email', 'Engagement Type', 'Budget', 'Timeline', 'Scope']);
        }
        sheet.appendRow([
            timestamp,
            data.name,
            data.email,
            data.projectType,
            data.budget,
            data.timeline,
            data.description
        ]);
    } else {
        // Default Contact/Registration Sheet
        sheet = ss.getSheetByName('Submissions') || ss.getSheets()[0]; // Default to first sheet if 'Submissions' missing
        // Verify headers if new sheet (optional, skipping for simplicity to just append)
        sheet.appendRow([
            timestamp,
            data.name,
            data.email,
            data.phone || '',
            data.package || data.subject || '', 
            data.goals || data.message || '',
            data.paymentStatus,
            data.paymentAmount || 0,
            data.reference || ''
        ]);
    }
}

function sendUserEmail(data) {
    if (!data.email) return;
    
    var isEngagement = (data.formType === 'engagement');
    var subject = isEngagement 
        ? "Project Initiation Received: Executive Engagement" 
        : "Registration Confirmed: " + (data.package || "Inquiry Received");

    // Dynamic Content based on type
    var contentHtml = '';
    
    if (isEngagement) {
        contentHtml = `
            <h2 style="color:#0f0f11; font-size:22px; margin-top:0;">Hello ${data.name},</h2>
            <p style="color:#475569; font-size:16px; line-height:1.6;">
                I have received your project brief regarding <strong>${data.projectType}</strong>. 
                Thank you for considering me as your technical partner.
            </p>
            <p style="color:#475569; font-size:16px; line-height:1.6;">
                I am currently reviewing your requirements (Budget: ${data.budget}, Timeline: ${data.timeline}). 
                If the scope aligns with my current capacity and expertise, I will reach out within 48 hours to schedule a preliminary strategy session.
            </p>
        `;
    } else {
        contentHtml = `
            <h2 style="color:#0f0f11; font-size:22px; margin-top:0;">Hello ${data.name},</h2>
            <p style="color:#475569; font-size:16px; line-height:1.6;">
                Thank you for your registration. This email confirms that we have received your submission for <strong>${data.package || 'Contact Inquiry'}</strong>.
            </p>
            ${data.reference ? `
            <div style="background-color:#eff6ff; border-left:4px solid #3b82f6; padding:15px; margin:25px 0;">
                <p style="margin:0; color:#1e40af; font-weight:bold;">PAYMENT VERIFIED</p>
                <p style="margin:5px 0 0; color:#3b82f6;">Amount: GHS ${data.paymentAmount}</p>
                <p style="margin:0; color:#64748b; font-size:12px;">Ref: ${data.reference}</p>
            </div>` : ''}
            <p style="color:#475569; font-size:16px; line-height:1.6;">
                 I review every application personally. You will receive a follow-up email shortly.
            </p>
        `;
    }

    var htmlBody = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Helvetica, Arial, sans-serif;">
        <div style="max-width:600px; margin:0 auto; background-color:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <div style="background-color:#0f0f11; padding:30px 40px; text-align:center; border-bottom: 3px solid #3b82f6;">
                <h1 style="color:#ffffff; margin:0; font-size:20px; letter-spacing:1px;">STEPHEN GYAN BIMPONG</h1>
                <p style="color:#94a3b8; margin:5px 0 0; font-size:12px; letter-spacing:2px; text-transform:uppercase;">Systems Architect</p>
            </div>
            <div style="padding:40px;">
                ${contentHtml}
                <p style="color:#475569; font-size:16px; margin-top:30px;">
                    Best regards,<br><strong>Stephen Gyan Bimpong</strong>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    GmailApp.sendEmail(data.email, subject, "Thank you for your submission.", {
        htmlBody: htmlBody,
        name: "Stephen Gyan Bimpong"
    });
}

function sendAdminEmail(data) {
    var isEngagement = (data.formType === 'engagement');
    var subject = isEngagement 
        ? "🚨 NEW LEAD: " + data.projectType + " (" + data.budget + ")"
        : "New Submission: " + (data.package || data.subject || "Contact Form");
    
    var tableRows = '';
    
    if (isEngagement) {
        tableRows = `
            <tr><td><strong>Name</strong></td><td>${data.name}</td></tr>
            <tr><td><strong>Email</strong></td><td>${data.email}</td></tr>
            <tr><td><strong>Type</strong></td><td>${data.projectType}</td></tr>
            <tr><td><strong>Budget</strong></td><td>${data.budget}</td></tr>
            <tr><td><strong>Timeline</strong></td><td>${data.timeline}</td></tr>
            <tr><td><strong>Scope</strong></td><td>${data.description}</td></tr>
        `;
    } else {
        tableRows = `
            <tr><td><strong>Name</strong></td><td>${data.name}</td></tr>
            <tr><td><strong>Email</strong></td><td>${data.email}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${data.phone || 'N/A'}</td></tr>
            <tr><td><strong>Item</strong></td><td>${data.package || data.subject}</td></tr>
            <tr><td><strong>Message</strong></td><td>${data.goals || data.message}</td></tr>
            <tr><td><strong>Payment</strong></td><td>${data.paymentStatus} (${data.paymentAmount})</td></tr>
        `;
    }

    var htmlBody = `
    <h2>New Submission</h2>
    <table border="1" cellpadding="10" style="border-collapse:collapse; width:100%;">
        ${tableRows}
    </table>
    `;
    
    GmailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, "New submission received.", {
        htmlBody: htmlBody
    });
}
