const fetch = require('node-fetch');

// Simulate a user signup
const testUser = {
    firstName: 'Jyoti',
    lastName: 'Mulimani',
    email: 'jyotimulimani2104@gmail.com',
    password: 'TestPass123!'
};

console.log('🧪 Testing Full Signup Flow...\n');
console.log('User Details:');
console.log(`  Name: ${testUser.firstName} ${testUser.lastName}`);
console.log(`  Email: ${testUser.email}\n`);

fetch('http://localhost:8080/api/users/signup', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(testUser)
})
    .then(res => res.text())
    .then(response => {
        console.log('Backend Response:', response);

        if (response === 'SIGNUP_SUCCESS_EMAIL_SENT') {
            console.log('\n✅ SUCCESS!');
            console.log('📧 Welcome email has been sent to:', testUser.email);
            console.log('\n💡 Check your inbox:');
            console.log('   - Subject: 🎓 Welcome to TECH-PRO AI - Verify Your Email');
            console.log('   - Personalized greeting: "Welcome, Jyoti! 👋"');
            console.log('   - Includes login button and next steps');
            console.log('   - May be in Promotions tab or Spam folder');
        } else if (response === 'ALREADY_REGISTERED') {
            console.log('\n⚠️  User already registered');
            console.log('This is expected if you already signed up with this email');
            console.log('The welcome email was sent during the first signup');
        } else {
            console.log('\n❌ Unexpected response:', response);
        }
    })
    .catch(error => {
        console.error('\n❌ Error:', error.message);
        console.log('Make sure the backend server is running on port 8080');
    });
