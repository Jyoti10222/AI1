# TECH-PRO AI Backend Server Guide

## 🚀 Quick Start

The backend server **MUST** be running for the following pages to work properly:

### Pages Requiring Backend (Port 8080):
- **Authentication**: `A2Signup.html`, `A3Login.html`
- **Admin Panel**: `A9Admin.html`
- **AI Learning**: `AIlearning.html`, `AILearningAdmin.html`
- **Admissions**: `Admission.html`, `StudentsAdmission.html`, `Studentform.html`
- **Faculty Pages**: `FacultyOnline.html`, `FacultyOffline.html`, `FacultyHybrid.html`
- **Batch Management**: `Online.html`, `Offline.html`, `Hybrid.html`
- **Admin Dashboards**: `OnlineAdmin.html`, `OfflineAdmin.html`, `HybridAdmin.html`
- **Payment Pages**: `Pay.html`, `Pay1.html`, `Pay2.html`, `PaymentAdmin.html`
- **Pricing**: `Pricingsub.html`
- **Lead Management**: `LeadDashboard.html`, `LeadDash.html`, `Lead-analytics.html`

---

## 📋 Three Ways to Start the Backend

### Option 1: Double-Click Start (Recommended for Development)
1. Double-click `start-backend.bat`
2. A console window will open showing server logs
3. Keep this window open while working
4. Press `Ctrl+C` in the window to stop the server

### Option 2: Silent Background Mode (Recommended for Daily Use)
1. Double-click `start-backend-hidden.vbs`
2. Server runs silently in the background
3. A brief popup confirms it started
4. To stop: Open Task Manager → Find "node.exe" → End Task

### Option 3: Manual Start (For Developers)
```bash
cd backend
npm install  # Only needed first time
node server.js
```

---

## ✅ How to Check if Backend is Running

1. Open your browser
2. Go to: `http://localhost:8080/api/students`
3. If you see JSON data, the server is running ✓
4. If you see "Cannot connect", the server is not running ✗

---

## 🔧 Backend API Endpoints

The server provides these APIs:

### User Management
- `POST /api/users/signup` - User registration
- `POST /api/users/login` - User login
- `GET /api/users` - Get all users

### Student Management
- `GET /api/students` - Get all students
- `POST /api/students` - Add new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Payment Configuration
- `GET /api/payment-config/:pageId` - Get payment config (pay, pay1, pay2, online)
- `PUT /api/payment-config/:pageId` - Update payment config

### AI Learning
- `GET /api/ailearning-config` - Get AI learning config
- `PUT /api/ailearning-config/subscription` - Update subscription
- `PUT /api/ailearning-config/course/:courseId` - Update course

### Online Courses
- `GET /api/online-config` - Get online courses config
- `PUT /api/online-config/batches` - Update batches
- `PUT /api/online-config/course/:courseId` - Update course

### Offline Courses
- `GET /api/offline-config` - Get offline courses config
- `PUT /api/offline-config/batches` - Update batches
- `PUT /api/offline-config/course/:courseId` - Update course

### Hybrid Courses
- `GET /api/hybrid-config` - Get hybrid courses config
- `PUT /api/hybrid-config/batches` - Update batches
- `PUT /api/hybrid-config/course/:courseId` - Update course

### Batch Requests
- `GET /api/batch-requests` - Get all batch requests
- `POST /api/batch-requests` - Create new batch request
- `PUT /api/batch-requests/:id/approve` - Approve request
- `PUT /api/batch-requests/:id/reject` - Reject request

---

## 🛠️ Troubleshooting

### Problem: "Port 8080 is already in use"
**Solution**: Another instance is already running
1. Open Task Manager (Ctrl+Shift+Esc)
2. Find "node.exe" process
3. End the task
4. Try starting again

### Problem: "Cannot find module 'express'"
**Solution**: Dependencies not installed
1. Open Command Prompt
2. Navigate to backend folder: `cd backend`
3. Run: `npm install`
4. Try starting again

### Problem: Pages show "Failed to fetch" errors
**Solution**: Backend is not running
1. Start the backend using one of the methods above
2. Refresh the page

### Problem: CORS errors in browser console
**Solution**: Already handled by the server
- The server has CORS enabled for all origins
- If you still see errors, restart the backend

---

## 🔄 Auto-Start on Windows Startup (Optional)

To make the backend start automatically when Windows boots:

1. Press `Win + R`
2. Type: `shell:startup` and press Enter
3. Create a shortcut to `start-backend-hidden.vbs` in this folder
4. The backend will now start automatically on boot

---

## 📊 Server Port

- **Port**: 8080
- **Base URL**: `http://localhost:8080`
- **Protocol**: HTTP (not HTTPS)

---

## 💾 Data Storage

All data is stored in JSON files in the `backend` folder:
- `users.json` - User accounts
- `students.json` - Student records
- `batch-requests.json` - Custom batch requests
- `config-*.json` - Various configuration files

---

## 🔐 Security Note

⚠️ **Important**: This backend is for development/local use only!
- Passwords are stored in plain text (not hashed)
- No authentication tokens
- Not suitable for production deployment
- Only accessible from localhost

---

## 📞 Need Help?

If the backend is not working:
1. Check if Node.js is installed: `node --version`
2. Check if npm is installed: `npm --version`
3. Review the console output for error messages
4. Ensure port 8080 is not blocked by firewall
