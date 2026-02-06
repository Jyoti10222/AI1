const nodemailer = require('nodemailer');
const emailConfig = require('./email-config.js');

console.log('🧪 Testing Email Configuration...\n');

const transporter = nodemailer.createTransport({
    service: emailConfig.email.service,
    auth: emailConfig.email.auth
});

// Verify connection
transporter.verify(function (error, success) {
    if (error) {
        console.log('❌ SMTP Connection Failed:');
        console.log(error);
        console.log('\n📋 Troubleshooting:');
        console.log('1. Check if email and app password are correct in email-config.js');
        console.log('2. Ensure 2FA is enabled on the Gmail account');
        console.log('3. Generate a new app password at: https://myaccount.google.com/apppasswords');
    } else {
        console.log('✅ SMTP Connection Successful!');
        console.log('📧 Sending test email...\n');

        // Send test email
        transporter.sendMail({
            from: `"${emailConfig.email.from.name}" <${emailConfig.email.from.address}>`,
            to: emailConfig.email.auth.user, // Send to same email for testing
            subject: '🧪 Test Email from TECH-PRO AI Backend',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f0f9ff; border-radius: 8px;">
                    <h1 style="color: #10b981;">✅ Email Test Successful!</h1>
                    <p>If you're reading this, your email configuration is working correctly.</p>
                    <p><strong>From:</strong> ${emailConfig.email.from.address}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">This is a test email from TECH-PRO AI backend server.</p>
                </div>
            `
        }, (error, info) => {
            if (error) {
                console.log('❌ Failed to send test email:');
                console.log(error);
            } else {
                console.log('✅ Test email sent successfully!');
                console.log('📬 Message ID:', info.messageId);
                console.log('📧 Check your inbox at:', emailConfig.email.auth.user);
                console.log('\n💡 If you don\'t see the email:');
                console.log('   - Check spam/junk folder');
                console.log('   - Check promotions tab (Gmail)');
                console.log('   - Wait a few minutes for delivery');
            }
        });
    }
});
