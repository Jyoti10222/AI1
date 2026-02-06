// INTEGRATION INSTRUCTIONS FOR server.js
// ========================================

// STEP 1: Add this line after line 59 (after counsellorQueriesPath)
const counsellorBookingsPath = path.join(__dirname, 'counsellor-bookings.json');

// STEP 2: Copy all routes from counsellor-routes.js and paste them after the hybrid config routes (around line 400)
// The routes are already in backend/counsellor-routes.js file

// STEP 3: Restart your server
// cd backend
// node server.js

// That's it! Your counseling booking system is ready to use.
