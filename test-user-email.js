const nodemailer = require('nodemailer');
const emailConfig = require('./email-config.js');

// Get email address from command line argument
const testEmail = process.argv[2];

if (!testEmail) {
    console.log('❌ Please provide an email address to test');
    console.log('Usage: node test-user-email.js your.email@gmail.com');
    process.exit(1);
}

console.log(`🧪 Testing email delivery to: ${testEmail}\n`);

const transporter = nodemailer.createTransport({
    service: emailConfig.email.service,
    auth: emailConfig.email.auth
});

// Send test email to user's address
transporter.sendMail({
    from: `"${emailConfig.email.from.name}" <${emailConfig.email.from.address}>`,
    to: testEmail,  // User's email address
    subject: '🎓 Welcome to TECH-PRO AI - Test Email',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900;">
                                🚀 TECH-PRO AI
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 28px; font-weight: 700;">
                                Test Email Successful! 👋
                            </h2>
                            <p style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.6;">
                                This is a test email to verify that emails are being delivered to <strong>${testEmail}</strong>.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%); border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="margin: 0 0 10px; color: #1e40af; font-weight: 700; font-size: 14px;">
                                    ✅ Email Delivery Confirmed
                                </p>
                                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                    <strong>To:</strong> ${testEmail}<br>
                                    <strong>From:</strong> ${emailConfig.email.from.address}<br>
                                    <strong>Time:</strong> ${new Date().toLocaleString()}
                                </p>
                            </div>
                            
                            <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                If you received this email, the email system is working correctly!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                © ${new Date().getFullYear()} TECH-PRO AI Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
}, (error, info) => {
    if (error) {
        console.log('❌ Failed to send email:');
        console.log(error);
    } else {
        console.log('✅ Email sent successfully!');
        console.log('📬 Message ID:', info.messageId);
        console.log(`📧 Email sent to: ${testEmail}`);
        console.log('\n💡 Check your inbox:');
        console.log(`   - Look for email from: ${emailConfig.email.from.address}`);
        console.log('   - Subject: 🎓 Welcome to TECH-PRO AI - Test Email');
        console.log('   - Check spam/junk folder if not in inbox');
        console.log('   - May take 1-2 minutes to arrive');
    }
});
