# 🎯 TECH-PRO AI - Quick Setup Guide

## ✅ Backend Server is Now Running!

The backend server has been started and is running on **port 8080**.

---

## 📌 What You Need to Know

### 1. **Backend Server Status**
- ✅ Currently Running on Port 8080
- 🔄 Will stop when you close the terminal or restart your computer
- 📊 Serves 35+ HTML pages with dynamic data

### 2. **Easy Access Files Created**

I've created several files to help you manage the backend:

#### **start-backend.bat** 
- Double-click to start the server with visible console
- Shows server logs and errors
- Press Ctrl+C to stop
- **Best for:** Development and debugging

#### **start-backend-hidden.vbs**
- Double-click to start the server silently
- Runs in background without console window
- Shows brief popup notification
- **Best for:** Daily use

#### **start-backend.ps1**
- PowerShell script with advanced error checking
- Checks if port is already in use
- Validates Node.js installation
- **Best for:** Advanced users

#### **Backend-Control.html**
- Open in browser to check server status
- Visual control panel with status indicator
- Quick links to all pages requiring backend
- **Best for:** Monitoring and testing

#### **README-BACKEND.md**
- Complete documentation
- Troubleshooting guide
- API endpoint reference
- **Best for:** Learning and reference

---

## 🚀 How to Use

### Starting the Backend (Choose One Method):

**Method 1: Quick Start (Recommended)**
1. Double-click `start-backend-hidden.vbs`
2. Wait for popup confirmation
3. Start using your pages!

**Method 2: With Console (For Debugging)**
1. Double-click `start-backend.bat`
2. Keep the window open
3. Watch server logs in real-time

**Method 3: Manual (For Developers)**
```bash
cd backend
node server.js
```

### Checking if Backend is Running:

**Option A: Use Control Panel**
1. Open `Backend-Control.html` in browser
2. Check the status indicator
3. Green = Running, Red = Stopped

**Option B: Test URL**
- Visit: http://localhost:8080/api/students
- If you see JSON data → Server is running ✓
- If you see error → Server is not running ✗

---

## 📋 Pages That Need Backend Running

These pages **require** the backend to be running:

### Authentication & User Management
- `A2Signup.html` - User registration
- `A3Login.html` - User login
- `A9Admin.html` - Admin panel

### Student Management
- `Studentform.html` - Student enrollment form
- `StudentsAdmission.html` - Admission management
- `Admission.html` - Admission portal

### Course Management
- `Online.html` - Online batch schedule
- `Offline.html` - Offline batch schedule
- `Hybrid.html` - Hybrid batch schedule
- `AIlearning.html` - AI learning courses

### Faculty Management
- `FacultyOnline.html` - Online faculty management
- `FacultyOffline.html` - Offline faculty management
- `FacultyHybrid.html` - Hybrid faculty management

### Admin Dashboards
- `OnlineAdmin.html` - Online courses admin
- `OfflineAdmin.html` - Offline courses admin
- `HybridAdmin.html` - Hybrid courses admin
- `AILearningAdmin.html` - AI learning admin
- `PaymentAdmin.html` - Payment configuration

### Payment Pages
- `Pay.html` - Payment page 1
- `Pay1.html` - Payment page 2
- `Pay2.html` - Payment page 3
- `Pricingsub.html` - Subscription pricing

### Lead Management
- `LeadDashboard.html` - Lead dashboard
- `LeadDash.html` - Lead management
- `Lead-analytics.html` - Lead analytics

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to server"
**Solution:**
1. Check if backend is running (use Backend-Control.html)
2. If not running, start it using one of the methods above
3. Refresh your page

### Problem: "Port 8080 already in use"
**Solution:**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Find "Node.js: Server-side JavaScript" or "node.exe"
3. End the task
4. Start the backend again

### Problem: "Module not found" error
**Solution:**
1. Open Command Prompt or PowerShell
2. Navigate to backend folder: `cd backend`
3. Run: `npm install`
4. Try starting the server again

### Problem: Pages show old data
**Solution:**
1. The backend stores data in JSON files
2. Check `backend/*.json` files
3. You can edit them manually if needed
4. Restart the backend after editing

---

## 💡 Pro Tips

### Tip 1: Auto-Start on Windows Boot
1. Press `Win + R`
2. Type: `shell:startup`
3. Create shortcut to `start-backend-hidden.vbs`
4. Backend will start automatically on boot!

### Tip 2: Keep Backend Running
- Use `start-backend-hidden.vbs` for silent operation
- Server runs in background
- No console window to accidentally close

### Tip 3: Monitor Server Health
- Keep `Backend-Control.html` bookmarked
- Check status indicator regularly
- Green = Good, Red = Need to restart

### Tip 4: View Server Logs
- Use `start-backend.bat` when debugging
- Console shows all API requests
- Helpful for troubleshooting errors

---

## 📊 Backend Features

### Data Storage
All data is stored in JSON files:
- `users.json` - User accounts (signup/login)
- `students.json` - Student records
- `batch-requests.json` - Custom batch requests
- `config-*.json` - Various configurations

### API Endpoints
The server provides 40+ API endpoints for:
- User authentication
- Student management
- Course configuration
- Payment settings
- Batch scheduling
- Lead tracking

### Email Integration
- Sends welcome emails on signup
- Sends batch approval/rejection emails
- Configurable via `email-config.js`

---

## 🔐 Security Notes

⚠️ **Important Security Information:**

This backend is designed for **local development and testing only**:
- Passwords are stored in plain text (not hashed)
- No JWT tokens or session management
- CORS is open to all origins
- No rate limiting or input sanitization
- Only accessible from localhost (127.0.0.1)

**Do NOT use this in production!**

For production deployment, you would need:
- Password hashing (bcrypt)
- JWT authentication
- HTTPS/SSL certificates
- Database (MongoDB, PostgreSQL, etc.)
- Input validation and sanitization
- Rate limiting and security headers

---

## 📞 Next Steps

1. ✅ Backend is running (already done!)
2. 🌐 Open `Backend-Control.html` to verify
3. 🎨 Start using your pages
4. 📖 Bookmark `README-BACKEND.md` for reference
5. 🔄 Use `start-backend-hidden.vbs` for future sessions

---

## 🎉 You're All Set!

The backend server is now running and ready to serve all your pages. 

**Quick Access:**
- Control Panel: [Backend-Control.html](./Backend-Control.html)
- Documentation: [README-BACKEND.md](./README-BACKEND.md)
- Server URL: http://localhost:8080

Happy coding! 🚀
