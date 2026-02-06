// Email Configuration
// To use Gmail SMTP, you need to:
// 1. Enable 2-factor authentication on your Gmail account
// 2. Generate an "App Password" for this application
// 3. Replace the placeholders below with your credentials

module.exports = {
    email: {
        service: 'gmail',
        auth: {
            user: 'techproai.noreply@gmail.com',
            pass: 'znhtdngpqhvjzgin'  // Gmail App Password (spaces removed)
        },
        from: {
            name: 'TECH-PRO AI',
            address: 'techproai.noreply@gmail.com'
        }
    },

    // Base URL for your application (used in verification links)
    appUrl: 'http://localhost:8080' // Change to your domain in production
};

// HOW TO GET GMAIL APP PASSWORD:
// 1. Go to https://myaccount.google.com/
// 2. Click on "Security" in the left sidebar
// 3. Enable "2-Step Verification" if not already enabled
// 4. After enabling 2-Step Verification, go back to Security
// 5. Click on "App passwords" (you'll need to sign in again)
// 6. Select "Mail" and "Other (Custom name)"
// 7. Enter "TECH-PRO AI Backend" as the name
// 8. Click "Generate"
// 9. Copy the 16-character password and paste it in 'pass' above
// 10. Save this file
