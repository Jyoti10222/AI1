// ================================
// ALL-IN-ONE AUTH SERVER
// ================================

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(cors());

// ================================
// FILE DATABASE
// ================================

const USERS_FILE = "./users.json";
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// ================================
// EMAIL SETUP (GMAIL SMTP)
// ================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "techproai.noreply@gmail.com",
    pass: "YOUR_GMAIL_APP_PASSWORD" // <-- App password
  }
});

// ================================
// EMAIL TEMPLATES
// ================================

function sendWelcomeEmail(email, name) {
  return transporter.sendMail({
    from: '"AI-TECH PRO" <techproai.noreply@gmail.com>',
    to: email,
    subject: "Welcome to AI-TECH PRO 🎉",
    html: `
      <h2>Hello ${name} 👋</h2>
      <p>Your account has been successfully created.</p>
      <a href="http://localhost:5500/A3Login.html"
        style="padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;">
        Login to Your Account
      </a>
    `
  });
}

function sendLoginEmail(email) {
  return transporter.sendMail({
    from: '"AI-TECH PRO" <techproai.noreply@gmail.com>',
    to: email,
    subject: "Login Successful 🔐",
    html: `<p>You logged in successfully.</p>`
  });
}

// ================================
// SIGNUP API
// ================================

app.post("/api/users/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email.includes("@")) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const users = JSON.parse(fs.readFileSync(USERS_FILE));

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    firstName,
    lastName,
    email,
    password: hashedPassword,
    createdAt: new Date()
  };

  users.push(user);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  await sendWelcomeEmail(email, firstName);

  res.json({ message: "Account created! Check your email." });
});

// ================================
// LOGIN API
// ================================

app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE));

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  await sendLoginEmail(email);

  res.json({ message: "Login successful" });
});

// ================================
// SERVER START
// ================================

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
