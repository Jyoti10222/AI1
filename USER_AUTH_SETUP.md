# User Authentication Setup

## Overview
The user authentication system has been implemented to store signup credentials in the backend database and validate login credentials against the same backend storage.

## Backend Implementation

### Database
- **File**: `backend/users.json`
- **Structure**: JSON file storing user credentials
- **Fields**: 
  - `id`: Unique user ID (timestamp-based)
  - `firstName`: User's first name
  - `lastName`: User's last name
  - `email`: User's email (unique identifier)
  - `password`: User's password (⚠️ stored as plain text for demo - should be hashed in production)
  - `createdAt`: Account creation timestamp
  - `updatedAt`: Last update timestamp

### API Endpoints

#### 1. POST `/api/users/signup`
**Purpose**: Register a new user

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Responses**:
- `SIGNUP_SUCCESS` (201) - User registered successfully
- `ALREADY_REGISTERED` (400) - Email already exists
- `MISSING_FIELDS` (400) - Required fields missing
- `SERVER_ERROR` (500) - Server error

#### 2. POST `/api/users/login`
**Purpose**: Authenticate existing user

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Responses**:
- `LOGIN_SUCCESS` (200) - Authentication successful
- `INVALID_CREDENTIALS` (401) - Email or password incorrect
- `MISSING_FIELDS` (400) - Required fields missing
- `SERVER_ERROR` (500) - Server error

#### 3. GET `/api/users`
**Purpose**: Retrieve all users (admin endpoint)

**Response**:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "1736915000000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "createdAt": "2026-01-15T04:50:00.000Z",
      "updatedAt": "2026-01-15T04:50:00.000Z"
    }
  ]
}
```
*Note: Passwords are excluded from this response*

## Frontend Integration

### Signup Page (`A2Signup.html`)
- Validates all required fields
- Checks password strength (uppercase, number, special character, 8+ chars)
- Sends credentials to backend `/api/users/signup`
- On success: Stores user profile data (name, email) in localStorage
- Shows appropriate error messages for duplicate registration or server errors

### Login Page (`A3Login.html`)
- Validates email/password fields
- Authenticates against backend `/api/users/login`
- On success: 
  - Sets `isLoggedIn` flag in localStorage
  - Stores user email for profile
  - Redirects to onboarding page
- Shows error for invalid credentials or server unavailability

## How to Start the Server

```bash
cd backend
node server.js
```

The server will start on **port 8080** and display:
```
╔════════════════════════════════════════════════════════╗
║   Tech-Pro AI Backend Server                           ║
║   Port: 8080                                           ║
╠════════════════════════════════════════════════════════╣
║   APIs: users, payment, ailearning, online, offline   ║
╚════════════════════════════════════════════════════════╝
```

## Testing the Flow

### 1. Sign Up
1. Open `A2Signup.html` in browser
2. Fill in all fields:
   - First Name
   - Last Name
   - Email (unique)
   - Password (must meet requirements)
3. Click "Create Account"
4. Check backend console for: `✅ New user registered: email@example.com`
5. User data saved in `backend/users.json`

### 2. Log In
1. Open `A3Login.html` in browser
2. Enter the same email and password used during signup
3. Click "Log In"
4. Check backend console for: `✅ User logged in: email@example.com`
5. Should redirect to onboarding page

### 3. Verification
- Try logging in with wrong password → Should show "Invalid email or password"
- Try signing up with same email → Should show "already registered"
- Check `backend/users.json` to see stored users

## Security Notes

⚠️ **Important**: This is a demo implementation with the following limitations:

1. **Passwords are stored in plain text** - In production, use bcrypt or similar hashing
2. **No JWT/Session tokens** - In production, use proper session management
3. **No HTTPS** - In production, always use HTTPS for credential transmission
4. **No rate limiting** - In production, add rate limiting to prevent brute force attacks
5. **No email verification** - In production, verify email addresses
6. **localStorage for session** - In production, use httpOnly cookies or secure tokens

## File Structure

```
FINAL TECH-PRO AI/
├── A2Signup.html          # Signup page
├── A3Login.html           # Login page
└── backend/
    ├── server.js          # Express server with auth endpoints
    ├── users.json         # User database (auto-created)
    └── package.json       # Dependencies
```

## Troubleshooting

### Server won't start
- **Error**: `EADDRINUSE: address already in use :::8080`
- **Solution**: Kill the process using port 8080:
  ```bash
  # Windows
  netstat -ano | findstr :8080
  taskkill /F /PID <process_id>
  
  # Then restart server
  node server.js
  ```

### Frontend can't connect
- Ensure backend server is running on port 8080
- Check browser console for CORS errors
- Verify the API URL is `http://localhost:8080/api/users/...`

### Signup/Login fails
- Check backend console for errors
- Ensure all required fields are filled
- Verify password meets requirements (for signup)
- Check network tab in browser DevTools
