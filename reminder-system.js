// ===================================
// COUNSELLOR REMINDER NOTIFICATION SYSTEM
// ===================================
// Add this to server.js after the counsellor bookings routes

// Function to check and send reminder notifications
function checkAndSendReminders() {
    try {
        const data = fs.readFileSync(counsellorBookingsPath, 'utf8');
        const bookingsData = JSON.parse(data);

        const now = new Date();

        bookingsData.bookings.forEach(async (booking) => {
            // Only send reminders for assigned bookings
            if (booking.status !== 'assigned') return;

            // Skip if reminder already sent
            if (booking.reminderSent) return;

            // Parse booking date and time
            const bookingDate = new Date(booking.selectedDate);
            const [time, period] = booking.selectedTime.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            // Convert to 24-hour format
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            bookingDate.setHours(hours, minutes, 0, 0);

            // Calculate time difference in minutes
            const timeDiff = (bookingDate - now) / (1000 * 60);

            // Send reminder if session is 30 minutes away (between 29-31 minutes to account for check interval)
            if (timeDiff > 29 && timeDiff <= 31) {
                console.log(`⏰ Sending 30-minute reminder for booking ${booking.id}`);

                if (transporter) {
                    const dateStr = bookingDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    // Reminder email to STUDENT
                    const studentReminderOptions = {
                        from: emailConfig.email.auth.user,
                        to: booking.email,
                        subject: '⏰ Reminder: Counseling Session in 30 Minutes - AI-TECH PRO',
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                    .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
                                    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
                                    .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                                    .reminder-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
                                    .info-card { background: #F9FAFB; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #F59E0B; }
                                    .info-row { display: flex; margin-bottom: 12px; }
                                    .info-label { font-weight: 600; color: #6B7280; min-width: 120px; }
                                    .info-value { color: #111827; }
                                    .button { display: inline-block; padding: 14px 32px; background: #F59E0B; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                                    .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 13px; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>⏰ Session Starting Soon!</h1>
                                    </div>
                                    <div class="content">
                                        <div class="reminder-box">
                                            <h2 style="margin: 0; color: #D97706; font-size: 24px;">Your session starts in 30 minutes!</h2>
                                        </div>
                                        
                                        <p style="font-size: 16px; margin-bottom: 20px;">Dear ${booking.name},</p>
                                        <p>This is a friendly reminder that your counseling session is starting soon.</p>
                                        
                                        <div class="info-card">
                                            <h3 style="margin-top: 0; color: #F59E0B; font-size: 18px;">Session Details</h3>
                                            <div class="info-row">
                                                <div class="info-label">📅 Date:</div>
                                                <div class="info-value">${dateStr}</div>
                                            </div>
                                            <div class="info-row">
                                                <div class="info-label">⏰ Time:</div>
                                                <div class="info-value">${booking.selectedTime}</div>
                                            </div>
                                            <div class="info-row">
                                                <div class="info-label">👤 Counselor:</div>
                                                <div class="info-value">${booking.assignedCounselor}</div>
                                            </div>
                                        </div>
                                        
                                        ${booking.mode === 'online' && booking.meetingLink ? `
                                            <center>
                                                <a href="${booking.meetingLink}" class="button">Join Video Call Now</a>
                                            </center>
                                            <p style="font-size: 13px; color: #6B7280; text-align: center;">Meeting Link: ${booking.meetingLink}</p>
                                        ` : `
                                            <div class="info-card">
                                                <h4 style="margin-top: 0; color: #F59E0B;">📍 Location</h4>
                                                <p style="margin: 0;">${booking.locationAddress}</p>
                                            </div>
                                        `}
                                        
                                        <p style="margin-top: 30px;">Please be ready to join on time. Looking forward to our session!</p>
                                        
                                        <p style="margin-top: 20px;">Best regards,<br>
                                        <strong>AI-TECH PRO Career Counseling Team</strong></p>
                                    </div>
                                    <div class="footer">
                                        <p>© 2024 AI-TECH PRO LMS. All rights reserved.</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `
                    };

                    // Reminder email to COUNSELOR
                    const counselorReminderOptions = {
                        from: emailConfig.email.auth.user,
                        to: booking.counselorEmail,
                        subject: '⏰ Reminder: Counseling Session in 30 Minutes - AI-TECH PRO',
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                    .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
                                    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
                                    .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                                    .reminder-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
                                    .info-card { background: #FEF2F2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #F59E0B; }
                                    .info-row { display: flex; margin-bottom: 12px; }
                                    .info-label { font-weight: 600; color: #6B7280; min-width: 140px; }
                                    .info-value { color: #111827; }
                                    .button { display: inline-block; padding: 14px 32px; background: #F59E0B; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                                    .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 13px; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>⏰ Session Starting Soon!</h1>
                                    </div>
                                    <div class="content">
                                        <div class="reminder-box">
                                            <h2 style="margin: 0; color: #D97706; font-size: 24px;">Your session starts in 30 minutes!</h2>
                                        </div>
                                        
                                        <p style="font-size: 16px; margin-bottom: 20px;">Dear ${booking.assignedCounselor},</p>
                                        <p>This is a friendly reminder about your upcoming counseling session.</p>
                                        
                                        <div class="info-card">
                                            <h3 style="margin-top: 0; color: #F59E0B; font-size: 18px;">Student Information</h3>
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
                                                <div class="info-label">📚 Course:</div>
                                                <div class="info-value">${booking.course}</div>
                                            </div>
                                        </div>
                                        
                                        <div class="info-card">
                                            <h3 style="margin-top: 0; color: #F59E0B; font-size: 18px;">Session Details</h3>
                                            <div class="info-row">
                                                <div class="info-label">📅 Date:</div>
                                                <div class="info-value">${dateStr}</div>
                                            </div>
                                            <div class="info-row">
                                                <div class="info-label">⏰ Time:</div>
                                                <div class="info-value">${booking.selectedTime}</div>
                                            </div>
                                        </div>
                                        
                                        ${booking.mode === 'online' && booking.meetingLink ? `
                                            <center>
                                                <a href="${booking.meetingLink}" class="button">Join Video Call Now</a>
                                            </center>
                                            <p style="font-size: 13px; color: #6B7280; text-align: center;">Meeting Link: ${booking.meetingLink}</p>
                                        ` : `
                                            <div class="info-card">
                                                <h4 style="margin-top: 0; color: #F59E0B;">📍 Location</h4>
                                                <p style="margin: 0;">${booking.locationAddress}</p>
                                            </div>
                                        `}
                                        
                                        <p style="margin-top: 30px;">Please be ready to start the session on time. Thank you!</p>
                                        
                                        <p style="margin-top: 20px;">Best regards,<br>
                                        <strong>AI-TECH PRO Admin Team</strong></p>
                                    </div>
                                    <div class="footer">
                                        <p>© 2024 AI-TECH PRO LMS. All rights reserved.</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `
                    };

                    try {
                        // Send both reminder emails
                        await transporter.sendMail(studentReminderOptions);
                        console.log(`✅ Reminder sent to student: ${booking.email}`);

                        await transporter.sendMail(counselorReminderOptions);
                        console.log(`✅ Reminder sent to counselor: ${booking.counselorEmail}`);

                        // Mark reminder as sent
                        booking.reminderSent = true;
                        fs.writeFileSync(counsellorBookingsPath, JSON.stringify(bookingsData, null, 2));

                    } catch (emailError) {
                        console.error('❌ Failed to send reminder emails:', emailError);
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
}

// Run reminder check every minute
setInterval(checkAndSendReminders, 60000);

// Run immediately on server start
checkAndSendReminders();

console.log('⏰ Reminder notification system activated - checking every minute');
