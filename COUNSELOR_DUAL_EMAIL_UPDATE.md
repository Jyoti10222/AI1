# Updated Counselor System - Implementation Summary

## ✅ Changes Made

### 1. **CounsellorAdmin.html** - Updated
- ✅ Replaced counselor dropdown with manual input fields:
  - Counselor Name (text input)
  - Counselor Email (email input)
- ✅ Updated JavaScript to send `counselorName` and `counselorEmail` to backend
- ✅ Updated success message to indicate both parties receive emails

### 2. **Backend Updates Required**

The backend route `/api/counsellor-bookings/assign` needs to be updated to:
1. Accept `counselorName` and `counselorEmail` instead of `counselor`
2. Send email to BOTH student AND counselor
3. Include Google Meet link in both emails

### 📝 Manual Backend Update Steps

**Location**: `backend/server.js` around line 501

**Find this line:**
```javascript
const { bookingId, counselor, meetingLink, locationAddress, notes } = req.body;
```

**Replace with:**
```javascript
const { bookingId, counselorName, counselorEmail, meetingLink, locationAddress, notes } = req.body;
```

**Find this line (around line 515):**
```javascript
bookingsData.bookings[bookingIndex].assignedCounselor = counselor;
```

**Replace with:**
```javascript
bookingsData.bookings[bookingIndex].assignedCounselor = counselorName;
bookingsData.bookings[bookingIndex].counselorEmail = counselorEmail;
```

**Find the email sending section (around line 530-650) and ADD counselor email after student email:**

After the student email is sent (around line 650), add this code:

```javascript
// Email to COUNSELOR
const counselorMailOptions = {
    from: emailConfig.email.auth.user,
    to: counselorEmail,
    subject: 'New Counseling Session Assigned - AI-TECH PRO',
    html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
                .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .info-card { background: #F0FDF4; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10B981; }
                .info-row { display: flex; margin-bottom: 12px; }
                .info-label { font-weight: 600; color: #6B7280; min-width: 140px; }
                .info-value { color: #111827; }
                .button { display: inline-block; padding: 14px 32px; background: #10B981; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 13px; }
                .alert { background: #DBEAFE; border: 1px solid #93C5FD; padding: 16px; border-radius: 8px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 New Session Assigned!</h1>
                </div>
                <div class="content">
                    <p style="font-size: 16px; margin-bottom: 20px;">Dear ${counselorName},</p>
                    <p>You have been assigned to a new counseling session. Please review the details below:</p>
                    
                    <div class="info-card">
                        <h3 style="margin-top: 0; color: #10B981; font-size: 18px;">Student Information</h3>
                        <div class="info-row">
                            <div class="info-label">👤 Student Name:</div>
                            <div class="info-value">${booking.name}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">📧 Email:</div>
                            <div class="info-value">${booking.email}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">📱 Phone:</div>
                            <div class="info-value">${booking.phone}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">📚 Course Interest:</div>
                            <div class="info-value">${booking.course}</div>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h3 style="margin-top: 0; color: #10B981; font-size: 18px;">Session Details</h3>
                        <div class="info-row">
                            <div class="info-label">📅 Date:</div>
                            <div class="info-value">${dateStr}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">⏰ Time:</div>
                            <div class="info-value">${booking.selectedTime}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">🎯 Mode:</div>
                            <div class="info-value">${booking.mode === 'online' ? 'Online (Video Call)' : 'Face-to-Face (Institute Visit)'}</div>
                        </div>
                    </div>
                    
                    ${booking.notes ? `
                        <div class="alert">
                            <p style="margin: 0; font-weight: 600; color: #1E40AF;">💬 Student's Query/Notes:</p>
                            <p style="margin: 10px 0 0 0;">${booking.notes}</p>
                        </div>
                    ` : ''}
                    
                    ${booking.mode === 'online' && meetingLink ? `
                        <div class="alert">
                            <p style="margin: 0; font-weight: 600; color: #1E40AF;">🎥 Google Meet Link:</p>
                            <p style="margin: 10px 0 0 0;">Use this link for the session:</p>
                        </div>
                        <center>
                            <a href="${meetingLink}" class="button">Join Video Call</a>
                        </center>
                        <p style="font-size: 13px; color: #6B7280; text-align: center;">Meeting Link: ${meetingLink}</p>
                    ` : `
                        <div class="alert">
                            <p style="margin: 0; font-weight: 600; color: #1E40AF;">📍 Meeting Location:</p>
                            <p style="margin: 10px 0 0 0;">${locationAddress}</p>
                        </div>
                    `}
                    
                    ${notes ? `
                        <div class="info-card">
                            <h4 style="margin-top: 0; color: #10B981;">📝 Admin Notes</h4>
                            <p style="margin: 0;">${notes}</p>
                        </div>
                    ` : ''}
                    
                    <p style="margin-top: 30px;">Please ensure you're prepared for the session. If you need to reschedule, contact the admin team immediately.</p>
                    
                    <p style="margin-top: 20px;">Best regards,<br>
                    <strong>AI-TECH PRO Admin Team</strong></p>
                </div>
                <div class="footer">
                    <p>© 2024 AI-TECH PRO LMS. All rights reserved.</p>
                    <p>This is an automated notification. For support, contact admin@aitech.pro</p>
                </div>
            </div>
        </body>
        </html>
    `
};

await transporter.sendMail(counselorMailOptions);
console.log(`✅ Assignment notification sent to counselor: ${counselorEmail}`);
```

### 🔄 After Making Changes

1. Save the `server.js` file
2. Restart the backend server:
   ```bash
   cd backend
   taskkill /F /IM node.exe
   node server.js
   ```

### ✅ What This Achieves

1. **Admin enters counselor details manually** - Name and email
2. **Student receives confirmation email** with:
   - Session details
   - Counselor name
   - Google Meet link (for online sessions)
   - Location (for face-to-face sessions)
   
3. **Counselor receives assignment notification** with:
   - Student information (name, email, phone, course)
   - Session details (date, time, mode)
   - Student's query/notes
   - Google Meet link (for online sessions)
   - Location (for face-to-face sessions)
   - Admin notes

### 📧 Email Flow

```
Admin assigns counselor
        ↓
Backend processes
        ↓
    ┌───────┴───────┐
    ↓               ↓
Student Email   Counselor Email
(Confirmation)  (Assignment)
```

Both emails include the Google Meet link so both parties can join the session!

### 🎯 Test It

1. Open `CounsellorAdmin.html`
2. Click "Assign" on a pending booking
3. Enter:
   - Counselor Name: "Sarah Jenkins"
   - Counselor Email: "sarah@aitech.pro"
   - Meeting Link: "https://meet.google.com/abc-defg-hij"
4. Click "Assign & Send Email"
5. Check both email inboxes - student and counselor should both receive emails!

---

**Note**: The frontend (CounsellorAdmin.html) is already updated and ready. Only the backend needs the manual updates described above.
