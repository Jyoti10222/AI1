const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const emailConfig = require('./email-config');

// Email Transporter Setup
let transporter = null;
try {
    if (emailConfig && emailConfig.email && emailConfig.email.auth) {
        transporter = nodemailer.createTransport({
            service: emailConfig.email.service,
            auth: {
                user: emailConfig.email.auth.user,
                pass: emailConfig.email.auth.pass
            }
        });
        console.log('📧 Email Service: Configured');
    } else {
        console.warn('⚠️ Email Config: Missing credentials in email-config.js');
    }
} catch (error) {
    console.warn('⚠️ Email Service: Failed to initialize', error.message);
}


const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // Serve frontend files

// Counsellor Routes
const counsellorRoutes = require('./counsellor-routes');
app.use('/api', counsellorRoutes);

// Counseling Routes (AI + In-Person)
const counselingRoutes = require('./counseling-routes');
app.use('/api', counselingRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        serverId: 'TECH_PRO_BACKEND_V5',
        timestamp: new Date().toISOString(),
        message: 'TECH-PRO AI Backend is running'
    });
});

// Students Endpoint for Admin Dashboard - GET
app.get('/api/students', (req, res) => {
    try {
        const studentsPath = path.join(__dirname, 'students.json');
        if (fs.existsSync(studentsPath)) {
            const data = fs.readFileSync(studentsPath, 'utf8');
            res.json({ success: true, data: JSON.parse(data).students });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (error) {
        console.error('Error reading students:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch students' });
    }
});

// Students Endpoint - GET Single Student
app.get('/api/students/:id', (req, res) => {
    try {
        const { id } = req.params;
        const studentsPath = path.join(__dirname, 'students.json');

        if (!fs.existsSync(studentsPath)) {
            return res.status(404).json({ success: false, error: 'Student file not found' });
        }

        const data = fs.readFileSync(studentsPath, 'utf8');
        const students = JSON.parse(data).students;
        const student = students.find(s => s.id === id);

        if (student) {
            res.json({ success: true, data: student });
        } else {
            res.status(404).json({ success: false, error: 'Student not found' });
        }
    } catch (error) {
        console.error(`Error reading student ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Failed to fetch student' });
    }
});

// Students Endpoint - POST (Add Student)
app.post('/api/students', (req, res) => {
    try {
        const studentsPath = path.join(__dirname, 'students.json');
        let studentsData = { students: [] };

        if (fs.existsSync(studentsPath)) {
            studentsData = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
        }

        const newStudent = {
            id: Date.now().toString(), // Simple ID generation
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        studentsData.students.unshift(newStudent); // Add to top
        fs.writeFileSync(studentsPath, JSON.stringify(studentsData, null, 2));

        res.json({ success: true, message: 'Student added successfully', data: newStudent });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ success: false, error: 'Failed to add student' });
    }
});

// Students Endpoint - PUT (Update Student)
app.put('/api/students/:id', (req, res) => {
    try {
        const { id } = req.params;
        const studentsPath = path.join(__dirname, 'students.json');

        if (!fs.existsSync(studentsPath)) {
            return res.status(404).json({ success: false, error: 'Student file not found' });
        }

        let studentsData = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
        const index = studentsData.students.findIndex(s => s.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }

        // Merge existing student with updates
        studentsData.students[index] = {
            ...studentsData.students[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(studentsPath, JSON.stringify(studentsData, null, 2));

        res.json({ success: true, message: 'Student updated successfully', data: studentsData.students[index] });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ success: false, error: 'Failed to update student' });
    }
});

// Students Endpoint - DELETE (Remove Student)
app.delete('/api/students/:id', (req, res) => {
    try {
        const { id } = req.params;
        const studentsPath = path.join(__dirname, 'students.json');

        if (!fs.existsSync(studentsPath)) {
            return res.status(404).json({ success: false, error: 'Student file not found' });
        }

        let studentsData = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
        const initialLength = studentsData.students.length;
        studentsData.students = studentsData.students.filter(s => s.id !== id);

        if (studentsData.students.length === initialLength) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }

        fs.writeFileSync(studentsPath, JSON.stringify(studentsData, null, 2));

        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ success: false, error: 'Failed to delete student' });
    }
});

// Users Endpoint (All Users)
app.get('/api/users', (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'users.json');
        if (fs.existsSync(usersPath)) {
            const data = fs.readFileSync(usersPath, 'utf8');
            res.json({ success: true, data: JSON.parse(data).users });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (error) {
        console.error('Error reading users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// Config file paths for each payment page
const configPaths = {
    'pay': path.join(__dirname, 'config-pay.json'),
    'pay1': path.join(__dirname, 'config-pay1.json'),
    'pay2': path.join(__dirname, 'config-pay2.json'),
    'online': path.join(__dirname, 'config-online.json'),
    'offline': path.join(__dirname, 'config-offline.json')
};

// Explicit config paths for specific endpoints
const onlineConfigPath = configPaths.online;
const offlineConfigPath = path.join(__dirname, 'config-offline.json');
const hybridConfigPath = path.join(__dirname, 'config-hybrid.json');
const batchRequestsPath = path.join(__dirname, 'batch-requests.json');
const counsellorQueriesPath = path.join(__dirname, 'counsellor-queries.json');
const counsellorBookingsPath = path.join(__dirname, 'counsellor-bookings.json');

// AI Learning config path
const aiLearningConfigPath = path.join(__dirname, 'config-ailearning.json');
const notificationsPath = path.join(__dirname, 'notifications.json');

// Helper function to read config
const readConfig = (pageId) => {
    try {
        const configPath = configPaths[pageId];
        if (!configPath) return null;
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading config for ${pageId}:`, error);
        return null;
    }
};

// Helper function to write config
const writeConfig = (pageId, config) => {
    try {
        const configPath = configPaths[pageId];
        if (!configPath) return false;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing config for ${pageId}:`, error);
        return false;
    }
};

// =====================
// PAYMENT CONFIG ROUTES
// =====================

// GET - Retrieve payment config for a specific page
app.get('/api/payment-config/:pageId', (req, res) => {
    const { pageId } = req.params;

    if (!configPaths[pageId]) {
        return res.status(400).json({
            success: false,
            message: `Invalid page ID. Use: pay, pay1, pay2, or online`
        });
    }

    const config = readConfig(pageId);
    if (config) {
        res.json({
            success: true,
            pageId,
            data: config
        });
    } else {
        res.status(500).json({
            success: false,
            message: `Failed to read payment configuration for ${pageId}`
        });
    }
});

// GET - Retrieve all payment configs
app.get('/api/payment-config', (req, res) => {
    const allConfigs = {};
    for (const pageId of Object.keys(configPaths)) {
        allConfigs[pageId] = readConfig(pageId);
    }
    res.json({
        success: true,
        data: allConfigs
    });
});

// PUT - Update payment config for a specific page
app.put('/api/payment-config/:pageId', (req, res) => {
    const { pageId } = req.params;

    if (!configPaths[pageId]) {
        return res.status(400).json({
            success: false,
            message: `Invalid page ID. Use: pay, pay1, pay2, or online`
        });
    }

    // Handle both one-time payment and subscription models
    const { originalPrice, discount, totalAmount, discountLabel, courseName, courseDuration, price, period, description, title } = req.body;

    const currentConfig = readConfig(pageId);
    if (!currentConfig) {
        return res.status(500).json({
            success: false,
            message: `Failed to read current configuration for ${pageId}`
        });
    }

    let updatedConfig;
    if (pageId === 'online') {
        // Subscription model for Online.html
        updatedConfig = {
            ...currentConfig,
            ...(price !== undefined && { price }),
            ...(period !== undefined && { period }),
            ...(description !== undefined && { description }),
            ...(title !== undefined && { title })
        };
    } else {
        // One-time payment model for Pay, Pay1, Pay2
        updatedConfig = {
            ...currentConfig,
            ...(originalPrice !== undefined && { originalPrice }),
            ...(discount !== undefined && { discount }),
            ...(totalAmount !== undefined && { totalAmount }),
            ...(discountLabel !== undefined && { discountLabel }),
            ...(courseName !== undefined && { courseName }),
            ...(courseDuration !== undefined && { courseDuration })
        };
    }

    if (writeConfig(pageId, updatedConfig)) {
        res.json({
            success: true,
            message: `Payment configuration for ${pageId} updated successfully`,
            data: updatedConfig
        });
    } else {
        res.status(500).json({
            success: false,
            message: `Failed to update payment configuration for ${pageId}`
        });
    }
});

// ========================
// AI LEARNING CONFIG ROUTES
// ========================

// GET - Retrieve AI Learning config
app.get('/api/ailearning-config', (req, res) => {
    try {
        const data = fs.readFileSync(aiLearningConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error reading AI learning config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read AI learning configuration'
        });
    }
});

// PUT - Update subscription
app.put('/api/ailearning-config/subscription', (req, res) => {
    try {
        const data = fs.readFileSync(aiLearningConfigPath, 'utf8');
        const config = JSON.parse(data);

        const { price, period } = req.body;
        if (price !== undefined) config.subscription.price = price;
        if (period !== undefined) config.subscription.period = period;

        fs.writeFileSync(aiLearningConfigPath, JSON.stringify(config, null, 2));
        res.json({
            success: true,
            message: 'Subscription updated successfully',
            data: config.subscription
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ success: false, message: 'Failed to update subscription' });
    }
});

// PUT - Update a specific course
app.put('/api/ailearning-config/course/:courseId', (req, res) => {
    try {
        const data = fs.readFileSync(aiLearningConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { courseId } = req.params;

        const courseIndex = config.courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) {
            return res.status(404).json({ success: false, message: `Course '${courseId}' not found` });
        }

        const { name, category, description, price, duration, link } = req.body;
        if (name !== undefined) config.courses[courseIndex].name = name;
        if (category !== undefined) config.courses[courseIndex].category = category;
        if (description !== undefined) config.courses[courseIndex].description = description;
        if (price !== undefined) config.courses[courseIndex].price = price;
        if (duration !== undefined) config.courses[courseIndex].duration = duration;
        if (link !== undefined) config.courses[courseIndex].link = link;

        fs.writeFileSync(aiLearningConfigPath, JSON.stringify(config, null, 2));
        res.json({
            success: true,
            message: `Course '${courseId}' updated successfully`,
            data: config.courses[courseIndex]
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});



// GET - Retrieve specific AI Learning Path section
// Example: /api/ai-learning/tech/career -> returns tech.career object
const aiLearningDetailedConfigPath = path.join(__dirname, 'ai-learning-config.json');

app.get('/api/ai-learning/:domain/:type', (req, res) => {
    try {
        const { domain, type } = req.params;

        // Validate domain and type
        if (!['tech', 'nontech', 'non-tech'].includes(domain)) {
            return res.status(400).json({ success: false, message: 'Invalid domain' });
        }

        // Normalize non-tech to nontech key matching the JSON
        const domainKey = domain === 'non-tech' ? 'nontech' : domain;

        if (!fs.existsSync(aiLearningDetailedConfigPath)) {
            return res.status(404).json({ success: false, message: 'Config file not found' });
        }

        const data = fs.readFileSync(aiLearningDetailedConfigPath, 'utf8');
        const config = JSON.parse(data);

        if (!config[domainKey] || !config[domainKey][type]) {
            return res.status(404).json({ success: false, message: `Section ${domain}/${type} not found` });
        }

        res.json({
            success: true,
            data: config[domainKey][type]
        });

    } catch (error) {
        console.error(`Error reading AI learning path ${req.params.domain}/${req.params.type}:`, error);
        res.status(500).json({ success: false, message: 'Failed to read configuration' });
    }
});

// GET - Retrieve Full AI Learning Config
app.get('/api/ai-learning/config', (req, res) => {
    try {
        if (!fs.existsSync(aiLearningDetailedConfigPath)) {
            return res.status(404).json({ success: false, message: 'Config file not found' });
        }
        const data = fs.readFileSync(aiLearningDetailedConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error reading full AI learning config:', error);
        res.status(500).json({ success: false, message: 'Failed to read configuration' });
    }
});



// PUT - Update specific AI Learning Path section
app.put('/api/ai-learning/:domain/:type', (req, res) => {
    try {
        const { domain, type } = req.params;

        // Validate domain and type
        if (!['tech', 'nontech', 'non-tech'].includes(domain)) {
            return res.status(400).json({ success: false, message: 'Invalid domain' });
        }

        // Normalize non-tech to nontech
        const domainKey = domain === 'non-tech' ? 'nontech' : domain;

        if (!fs.existsSync(aiLearningDetailedConfigPath)) {
            return res.status(404).json({ success: false, message: 'Config file not found' });
        }

        const data = fs.readFileSync(aiLearningDetailedConfigPath, 'utf8');
        const config = JSON.parse(data);

        if (!config[domainKey]) {
            return res.status(404).json({ success: false, message: `Domain ${domain} not found` });
        }

        // If the type doesn't exist yet, initialize it (optional, but good for robustness)
        if (!config[domainKey][type]) {
            config[domainKey][type] = {};
        }

        // Merge existing data with updates
        // This ensures titles/descriptions are preserved if only programs/courses are sent
        config[domainKey][type] = {
            ...config[domainKey][type],
            ...req.body
        };

        fs.writeFileSync(aiLearningDetailedConfigPath, JSON.stringify(config, null, 2));

        res.json({
            success: true,
            message: `Updated ${domain}/${type} successfully`,
            data: config[domainKey][type]
        });

    } catch (error) {
        console.error(`Error updating AI learning path ${req.params.domain}/${req.params.type}:`, error);
        res.status(500).json({ success: false, message: 'Failed to update configuration' });
    }
});

// ========================
// ONLINE COURSES CONFIG ROUTES
// ========================
// Config path defined globally

// GET - Retrieve Online courses config
app.get('/api/online-config', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error reading online config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read online configuration'
        });
    }
});

// PUT - Update entire online config
app.put('/api/online-config', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);

        // Update with new data
        const updatedConfig = {
            ...config,
            ...req.body
        };

        fs.writeFileSync(onlineConfigPath, JSON.stringify(updatedConfig, null, 2));
        res.json({ success: true, message: 'Online config updated', data: updatedConfig });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update online config' });
    }
});


// PUT - Update Batch List (for Faculty Grid)
app.put('/api/online-config/batches', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { batches } = req.body;

        if (!Array.isArray(batches)) {
            return res.status(400).json({ success: false, message: 'Batches must be an array' });
        }

        config.batches = batches;
        fs.writeFileSync(onlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Batches updated successfully', data: config.batches });
    } catch (error) {
        console.error('Error updating batches:', error);
        res.status(500).json({ success: false, message: 'Failed to update batches' });
    }
});

// PUT - Update access fee
app.put('/api/online-config/accessfee', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);

        const { price, period, description } = req.body;
        if (price !== undefined) config.accessFee.price = price;
        if (period !== undefined) config.accessFee.period = period;
        if (description !== undefined) config.accessFee.description = description;

        fs.writeFileSync(onlineConfigPath, JSON.stringify(config, null, 2));
        res.json({
            success: true,
            message: 'Access fee updated successfully',
            data: config.accessFee
        });
    } catch (error) {
        console.error('Error updating access fee:', error);
        res.status(500).json({ success: false, message: 'Failed to update access fee' });
    }
});

// =======================
// OFFLINE CONFIG ROUTES
// =======================

// GET - Retrieve Offline config
app.get('/api/offline-config', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error reading offline config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read offline configuration'
        });
    }
});

// PUT - Update Offline config
app.put('/api/offline-config', (req, res) => {
    try {
        const currentData = fs.readFileSync(offlineConfigPath, 'utf8');
        const currentConfig = JSON.parse(currentData);

        // Merge the request body into the current config
        const updatedConfig = { ...currentConfig, ...req.body };

        fs.writeFileSync(offlineConfigPath, JSON.stringify(updatedConfig, null, 2));

        res.json({
            success: true,
            message: 'Offline configuration updated successfully',
            data: updatedConfig
        });
    } catch (error) {
        console.error('Error updating offline config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update offline configuration'
        });
    }
});

// ====================
// HYBRID CONFIG ROUTES
// ====================

// GET - Retrieve Hybrid config
app.get('/api/hybrid-config', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error reading hybrid config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read hybrid configuration'
        });
    }
});

// PUT - Update Hybrid config
app.put('/api/hybrid-config', (req, res) => {
    try {
        const currentData = fs.readFileSync(hybridConfigPath, 'utf8');
        const currentConfig = JSON.parse(currentData);

        // Merge the request body into the current config
        const updatedConfig = { ...currentConfig, ...req.body };

        fs.writeFileSync(hybridConfigPath, JSON.stringify(updatedConfig, null, 2));

        res.json({
            success: true,
            message: 'Hybrid configuration updated successfully',
            data: updatedConfig
        });
    } catch (error) {
        console.error('Error updating hybrid config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update hybrid configuration'
        });
    }
});

// PUT - Update a specific online course
app.put('/api/online-config/course/:courseId', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { courseId } = req.params;

        const courseIndex = config.courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) {
            return res.status(404).json({ success: false, message: `Course '${courseId}' not found` });
        }

        const { name, price, duration, batchCount, icon, color } = req.body;
        if (name !== undefined) config.courses[courseIndex].name = name;
        if (price !== undefined) config.courses[courseIndex].price = price;
        if (duration !== undefined) config.courses[courseIndex].duration = duration;
        if (batchCount !== undefined) config.courses[courseIndex].batchCount = batchCount;
        if (icon !== undefined) config.courses[courseIndex].icon = icon;
        if (color !== undefined) config.courses[courseIndex].color = color;

        fs.writeFileSync(onlineConfigPath, JSON.stringify(config, null, 2));
        res.json({
            success: true,
            message: `Course '${courseId}' updated successfully`,
            data: config.courses[courseIndex]
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});

// ===========================
// COUNSELLOR MANAGEMENT ROUTES
// ===========================

const counselorsPath = path.join(__dirname, 'counselors.json');



// POST - Add a new counselor
app.post('/api/counselors', (req, res) => {
    try {
        const { name, email, phone, mode, specialization, timings, image, description } = req.body;

        if (!fs.existsSync(counselorsPath)) {
            const defaultData = { counselors: [] };
            fs.writeFileSync(counselorsPath, JSON.stringify(defaultData, null, 2));
        }

        const data = fs.readFileSync(counselorsPath, 'utf8');
        const counselorsData = JSON.parse(data);

        const newCounselor = {
            id: crypto.randomBytes(8).toString('hex'),
            name,
            email,
            phone,
            mode, // 'online' or 'offline'
            specialization,
            timings,
            image: image || 'https://via.placeholder.com/150',
            description,
            addedAt: new Date().toISOString()
        };

        counselorsData.counselors.push(newCounselor);
        fs.writeFileSync(counselorsPath, JSON.stringify(counselorsData, null, 2));

        res.json({
            success: true,
            message: 'Counselor added successfully',
            data: newCounselor
        });
    } catch (error) {
        console.error('Error adding counselor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add counselor'
        });
    }
});

// DELETE - Remove a counselor
app.delete('/api/counselors/:id', (req, res) => {
    try {
        const { id } = req.params;

        const data = fs.readFileSync(counselorsPath, 'utf8');
        const counselorsData = JSON.parse(data);

        const initialLength = counselorsData.counselors.length;
        counselorsData.counselors = counselorsData.counselors.filter(c => c.id !== id);

        if (counselorsData.counselors.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Counselor not found' });
        }

        fs.writeFileSync(counselorsPath, JSON.stringify(counselorsData, null, 2));

        res.json({
            success: true,
            message: 'Counselor removed successfully'
        });
    } catch (error) {
        console.error('Error removing counselor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove counselor'
        });
    }
});


// POST - Mark booking as completed
app.post('/api/counsellor-bookings/complete', (req, res) => {
    try {
        const { bookingId } = req.body;

        const data = fs.readFileSync(counsellorBookingsPath, 'utf8');
        const bookingsData = JSON.parse(data);

        const bookingIndex = bookingsData.bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        bookingsData.bookings[bookingIndex].status = 'completed';
        bookingsData.bookings[bookingIndex].completedAt = new Date().toISOString();

        fs.writeFileSync(counsellorBookingsPath, JSON.stringify(bookingsData, null, 2));

        res.json({
            success: true,
            message: 'Booking marked as completed',
            data: bookingsData.bookings[bookingIndex]
        });
    } catch (error) {
        console.error('Error completing booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete booking'
        });
    }
});

// ===================================
// COUNSELLOR REMINDER NOTIFICATION SYSTEM
// ===================================

// Function to check and send reminder notifications
function checkAndSendReminders() {
    try {
        const data = fs.readFileSync(counsellorBookingsPath, 'utf8');
        const bookingsData = JSON.parse(data);

        const now = new Date();

        bookingsData.bookings.forEach(async (booking) => {
            if (booking.status !== 'assigned') return;
            if (booking.reminderSent) return;

            const bookingDate = new Date(booking.selectedDate);
            const [time, period] = booking.selectedTime.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            bookingDate.setHours(hours, minutes, 0, 0);
            const timeDiff = (bookingDate - now) / (1000 * 60);

            if (timeDiff > 29 && timeDiff <= 31) {
                console.log(`⏰ Sending 30-minute reminder for booking ${booking.id}`);

                if (transporter) {
                    const dateStr = bookingDate.toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });

                    const studentReminderOptions = {
                        from: emailConfig.email.auth.user,
                        to: booking.email,
                        subject: '⏰ Reminder: Counseling Session in 30 Minutes - AI-TECH PRO',
                        html: `<!DOCTYPE html><html><head><style>body{font-family:'Inter',Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);color:white;padding:40px 30px;text-align:center;border-radius:12px 12px 0 0}.header h1{margin:0;font-size:28px;font-weight:700}.content{background:#fff;padding:40px 30px;border-radius:0 0 12px 12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)}.reminder-box{background:#FEF3C7;border:2px solid #F59E0B;padding:20px;border-radius:10px;margin:20px 0;text-align:center}.info-card{background:#F9FAFB;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #F59E0B}.info-row{display:flex;margin-bottom:12px}.info-label{font-weight:600;color:#6B7280;min-width:120px}.info-value{color:#111827}.button{display:inline-block;padding:14px 32px;background:#F59E0B;color:white;text-decoration:none;border-radius:8px;margin:20px 0;font-weight:600}.footer{text-align:center;margin-top:30px;color:#6B7280;font-size:13px}</style></head><body><div class="container"><div class="header"><h1>⏰ Session Starting Soon!</h1></div><div class="content"><div class="reminder-box"><h2 style="margin:0;color:#D97706;font-size:24px">Your session starts in 30 minutes!</h2></div><p style="font-size:16px;margin-bottom:20px">Dear ${booking.name},</p><p>This is a friendly reminder that your counseling session is starting soon.</p><div class="info-card"><h3 style="margin-top:0;color:#F59E0B;font-size:18px">Session Details</h3><div class="info-row"><div class="info-label">📅 Date:</div><div class="info-value">${dateStr}</div></div><div class="info-row"><div class="info-label">⏰ Time:</div><div class="info-value">${booking.selectedTime}</div></div><div class="info-row"><div class="info-label">👤 Counselor:</div><div class="info-value">${booking.assignedCounselor}</div></div></div>${booking.mode === 'online' && booking.meetingLink ? `<center><a href="${booking.meetingLink}" class="button">Join Video Call Now</a></center><p style="font-size:13px;color:#6B7280;text-align:center">Meeting Link: ${booking.meetingLink}</p>` : `<div class="info-card"><h4 style="margin-top:0;color:#F59E0B">📍 Location</h4><p style="margin:0">${booking.locationAddress}</p></div>`}<p style="margin-top:30px">Please be ready to join on time. Looking forward to our session!</p><p style="margin-top:20px">Best regards,<br><strong>AI-TECH PRO Career Counseling Team</strong></p></div><div class="footer"><p>© 2024 AI-TECH PRO LMS. All rights reserved.</p></div></div></body></html>`
                    };

                    const counselorReminderOptions = {
                        from: emailConfig.email.auth.user,
                        to: booking.counselorEmail,
                        subject: '⏰ Reminder: Counseling Session in 30 Minutes - AI-TECH PRO',
                        html: `<!DOCTYPE html><html><head><style>body{font-family:'Inter',Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);color:white;padding:40px 30px;text-align:center;border-radius:12px 12px 0 0}.header h1{margin:0;font-size:28px;font-weight:700}.content{background:#fff;padding:40px 30px;border-radius:0 0 12px 12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)}.reminder-box{background:#FEF3C7;border:2px solid #F59E0B;padding:20px;border-radius:10px;margin:20px 0;text-align:center}.info-card{background:#FEF2F2;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #F59E0B}.info-row{display:flex;margin-bottom:12px}.info-label{font-weight:600;color:#6B7280;min-width:140px}.info-value{color:#111827}.button{display:inline-block;padding:14px 32px;background:#F59E0B;color:white;text-decoration:none;border-radius:8px;margin:20px 0;font-weight:600}.footer{text-align:center;margin-top:30px;color:#6B7280;font-size:13px}</style></head><body><div class="container"><div class="header"><h1>⏰ Session Starting Soon!</h1></div><div class="content"><div class="reminder-box"><h2 style="margin:0;color:#D97706;font-size:24px">Your session starts in 30 minutes!</h2></div><p style="font-size:16px;margin-bottom:20px">Dear ${booking.assignedCounselor},</p><p>This is a friendly reminder about your upcoming counseling session.</p><div class="info-card"><h3 style="margin-top:0;color:#F59E0B;font-size:18px">Student Information</h3><div class="info-row"><div class="info-label">👤 Student Name:</div><div class="info-value">${booking.name}</div></div><div class="info-row"><div class="info-label">📧 Email:</div><div class="info-value">${booking.email}</div></div><div class="info-row"><div class="info-label">📱 Phone:</div><div class="info-value">${booking.phone}</div></div><div class="info-row"><div class="info-label">📚 Course:</div><div class="info-value">${booking.course}</div></div></div><div class="info-card"><h3 style="margin-top:0;color:#F59E0B;font-size:18px">Session Details</h3><div class="info-row"><div class="info-label">📅 Date:</div><div class="info-value">${dateStr}</div></div><div class="info-row"><div class="info-label">⏰ Time:</div><div class="info-value">${booking.selectedTime}</div></div></div>${booking.mode === 'online' && booking.meetingLink ? `<center><a href="${booking.meetingLink}" class="button">Join Video Call Now</a></center><p style="font-size:13px;color:#6B7280;text-align:center">Meeting Link: ${booking.meetingLink}</p>` : `<div class="info-card"><h4 style="margin-top:0;color:#F59E0B">📍 Location</h4><p style="margin:0">${booking.locationAddress}</p></div>`}<p style="margin-top:30px">Please be ready to start the session on time. Thank you!</p><p style="margin-top:20px">Best regards,<br><strong>AI-TECH PRO Admin Team</strong></p></div><div class="footer"><p>© 2024 AI-TECH PRO LMS. All rights reserved.</p></div></div></body></html>`
                    };

                    try {
                        await transporter.sendMail(studentReminderOptions);
                        console.log(`✅ Reminder sent to student: ${booking.email}`);

                        await transporter.sendMail(counselorReminderOptions);
                        console.log(`✅ Reminder sent to counselor: ${booking.counselorEmail}`);

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

setInterval(checkAndSendReminders, 60000);
checkAndSendReminders();
console.log('⏰ Reminder notification system activated - checking every minute');

// ========================
// OFFLINE BATCH CONFIG ROUTES
// ========================
// Config path defined globally

// GET - Retrieve Offline batch config
app.get('/api/offline-config', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error reading offline config:', error);
        res.status(500).json({ success: false, message: 'Failed to read offline configuration' });
    }
});

// PUT - Update batch fee
app.put('/api/offline-config/batchfee', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { price, currency } = req.body;
        if (price !== undefined) config.batchFee.price = price;
        if (currency !== undefined) config.batchFee.currency = currency;
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Batch fee updated', data: config.batchFee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update batch fee' });
    }
});

// PUT - Update stats
app.put('/api/offline-config/stats', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { available, fastFilling } = req.body;
        if (available !== undefined) config.stats.available = available;
        if (fastFilling !== undefined) config.stats.fastFilling = fastFilling;
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Stats updated', data: config.stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update stats' });
    }
});

// PUT - Update a specific offline course
app.put('/api/offline-config/course/:courseId', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { courseId } = req.params;
        const courseIndex = config.courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) {
            return res.status(404).json({ success: false, message: `Course '${courseId}' not found` });
        }
        const { name, category, room, price, totalSeats, enrolledSeats, duration, instructor } = req.body;
        if (name !== undefined) config.courses[courseIndex].name = name;
        if (category !== undefined) config.courses[courseIndex].category = category;
        if (room !== undefined) config.courses[courseIndex].room = room;
        if (price !== undefined) config.courses[courseIndex].price = price;
        if (totalSeats !== undefined) config.courses[courseIndex].totalSeats = totalSeats;
        if (enrolledSeats !== undefined) config.courses[courseIndex].enrolledSeats = enrolledSeats;
        if (duration !== undefined) config.courses[courseIndex].duration = duration;
        if (instructor !== undefined) config.courses[courseIndex].instructor = instructor;
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: `Course updated`, data: config.courses[courseIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});

// ========================
// HYBRID BATCH CONFIG ROUTES
// ========================
// Config path defined globally

// GET - Retrieve Hybrid batch config
app.get('/api/hybrid-config', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error reading hybrid config:', error);
        res.status(500).json({ success: false, message: 'Failed to read hybrid configuration' });
    }
});

// PUT - Update entire hybrid config
app.put('/api/hybrid-config', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);

        // Update with new data
        const updatedConfig = {
            ...config,
            ...req.body
        };

        fs.writeFileSync(hybridConfigPath, JSON.stringify(updatedConfig, null, 2));
        res.json({ success: true, message: 'Hybrid config updated', data: updatedConfig });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update hybrid config' });
    }
});

// PUT - Update page info
app.put('/api/hybrid-config/pageinfo', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { title, subtitle } = req.body;
        if (title) config.pageInfo.title = title;
        if (subtitle) config.pageInfo.subtitle = subtitle;
        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Page info updated', data: config.pageInfo });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update page info' });
    }
});

// PUT - Update access fee
app.put('/api/hybrid-config/accessfee', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { price, period, description } = req.body;
        if (!config.accessFee) config.accessFee = {};
        if (price !== undefined) config.accessFee.price = price;
        if (period !== undefined) config.accessFee.period = period;
        if (description !== undefined) config.accessFee.description = description;
        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Access fee updated', data: config.accessFee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update access fee' });
    }
});

// PUT - Update a specific hybrid course
app.put('/api/hybrid-config/course/:courseId', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { courseId } = req.params;
        const courseIndex = config.courses.findIndex(c => c.id === courseId);

        if (courseIndex === -1) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Update course fields
        const updates = req.body;
        Object.keys(updates).forEach(key => {
            if (key !== 'id') {
                config.courses[courseIndex][key] = updates[key];
            }
        });

        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: `Course updated`, data: config.courses[courseIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});

// POST - Add new online course
app.post('/api/online-config/course', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { name, price, duration, batchCount, icon, color } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Course name is required' });
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const newCourse = {
            id,
            name,
            icon: icon || 'school',
            color: color || 'blue',
            price: price || 0,
            duration: duration || '3 Months',
            batchCount: batchCount || 1
        };

        config.courses.push(newCourse);
        fs.writeFileSync(onlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Course added', data: newCourse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add course' });
    }
});

// POST - Add new offline course
app.post('/api/offline-config/course', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { name, category, room, price, totalSeats, duration, instructor } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Course name is required' });
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const newCourse = {
            id,
            name,
            category: category || 'General',
            room: room || 'TBD',
            price: price || 0,
            totalSeats: totalSeats || 30,
            enrolledSeats: 0,
            duration: duration || '3 Months',
            instructor: instructor || 'TBD'
        };

        config.courses.push(newCourse);
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Course added', data: newCourse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add course' });
    }
});

// POST - Add new hybrid course
app.post('/api/hybrid-config/course', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { name, instructor, level, fee, onlinePercent, offlinePercent, startDate } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Course name is required' });
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const newCourse = {
            id,
            name,
            instructor: instructor || 'TBD',
            level: level || 'Beginner',
            levelColor: level === 'Advanced' ? 'purple' : 'green',
            startDate: startDate || 'TBD',
            onlinePercent: onlinePercent || 50,
            offlinePercent: offlinePercent || 50,
            fee: fee || 999,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLm39_AyR6rQo5vyxLxJv45wqd9ZwS9l5_Lb3wE4NI-S5Gipje6WYgyAG4fQXMHF3YjsnBk2gGWV_26wyJtwATnwcme11hNMVOQ-nQcx2nGfDGVwu9KNuecm09YEfczzZjIxf9AoAXGIkKCy9TJYE_lD2l8jw55EEdhQcQko_I2CJ7l4vcreo37RXUVdlVpBZGvEi9Fi0yIFxq6E41_My7B-JSbbh4OQJHln_GT-2bYbXMlF2K3jgWNCLlGjMz2OL5ajDIQuYyvCw',
            onlineSchedule: {
                days: 'TBD',
                time: 'TBD',
                description: 'Online Sessions',
                platform: 'Zoom',
                platformNote: 'Recordings available'
            },
            offlineSchedule: {
                days: 'TBD',
                time: 'TBD',
                description: 'Lab Sessions',
                location: 'TBD',
                locationNote: 'Main Campus'
            }
        };

        config.courses.push(newCourse);
        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Course added', data: newCourse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add course' });
    }
});

// PUT - Update Offline Batch List (for Faculty Grid)
app.put('/api/offline-config/batches', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { batches } = req.body;

        if (!Array.isArray(batches)) {
            return res.status(400).json({ success: false, message: 'Batches must be an array' });
        }

        config.batches = batches;
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Batches updated successfully', data: config.batches });
    } catch (error) {
        console.error('Error updating offline batches:', error);
        res.status(500).json({ success: false, message: 'Failed to update batches' });
    }
});

// PUT - Update Hybrid Batch List
app.put('/api/hybrid-config/batches', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { batches } = req.body;

        if (!Array.isArray(batches)) {
            return res.status(400).json({ success: false, message: 'Batches must be an array' });
        }

        config.batches = batches;
        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Batches updated successfully', data: config.batches });
    } catch (error) {
        console.error('Error updating hybrid batches:', error);
        res.status(500).json({ success: false, message: 'Failed to update batches' });
    }
});

// ========================
// STUDENT MANAGEMENT API
// ========================
const studentsDbPath = path.join(__dirname, 'students.json');

// Helper: Read students from JSON file
function readStudents() {
    try {
        if (!fs.existsSync(studentsDbPath)) {
            fs.writeFileSync(studentsDbPath, JSON.stringify({ students: [], lastUpdated: null }, null, 2));
        }
        const data = fs.readFileSync(studentsDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading students:', error);
        return { students: [], lastUpdated: null };
    }
}

// Helper: Write students to JSON file
function writeStudents(studentsData) {
    try {
        studentsData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(studentsDbPath, JSON.stringify(studentsData, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing students:', error);
        return false;
    }
}

// GET - Retrieve all students
app.get('/api/students', (req, res) => {
    try {
        const data = readStudents();
        res.json({
            success: true,
            count: data.students.length,
            data: data.students
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve students' });
    }
});

// GET - Retrieve specific student by ID
app.get('/api/students/:id', (req, res) => {
    try {
        const data = readStudents();
        const student = data.students.find(s => s.id === req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve student' });
    }
});

// POST - Create new student
app.post('/api/students', (req, res) => {
    try {
        const data = readStudents();

        // Generate smart ID: YYMM#### format
        const now = new Date();
        const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Month with leading zero
        const yearMonth = year + month; // e.g., "2601" for January 2026

        // Find the highest sequence number for this year-month
        const studentsThisMonth = data.students.filter(s => s.id && s.id.startsWith(yearMonth));
        let maxSequence = 0;

        studentsThisMonth.forEach(student => {
            const sequencePart = student.id.slice(4); // Get last 4 digits
            const sequence = parseInt(sequencePart, 10);
            if (!isNaN(sequence) && sequence > maxSequence) {
                maxSequence = sequence;
            }
        });

        // Increment sequence for new student
        const newSequence = maxSequence + 1;
        const sequenceStr = String(newSequence).padStart(4, '0'); // 4 digits with leading zeros
        const studentId = yearMonth + sequenceStr; // e.g., "26010001"

        const newStudent = {
            id: studentId,
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.students.unshift(newStudent); // Add to beginning
        if (writeStudents(data)) {
            res.status(201).json({ success: true, message: 'Student created successfully', data: newStudent });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save student' });
        }
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ success: false, message: 'Failed to create student' });
    }
});

// POST - Migrate students from localStorage to backend
app.post('/api/students/migrate', (req, res) => {
    try {
        const data = readStudents();
        const { students: incomingStudents } = req.body;

        if (!Array.isArray(incomingStudents)) {
            return res.status(400).json({ success: false, message: 'Students must be an array' });
        }

        let migratedCount = 0;

        incomingStudents.forEach(student => {
            // Check if student already exists (by email)
            const exists = data.students.find(s => s.email === student.email);
            if (!exists) {
                // Generate ID based on student's timestamp or current date
                const studentDate = student.timestamp ? new Date(student.timestamp) : new Date();
                const year = String(studentDate.getFullYear()).slice(-2);
                const month = String(studentDate.getMonth() + 1).padStart(2, '0');
                const yearMonth = year + month;

                // Find sequence for this student's month
                const studentsThisMonth = data.students.filter(s => s.id && s.id.startsWith(yearMonth));
                let maxSequence = 0;
                studentsThisMonth.forEach(s => {
                    const seq = parseInt(s.id.slice(4), 10);
                    if (!isNaN(seq) && seq > maxSequence) maxSequence = seq;
                });

                const newSequence = maxSequence + 1;
                const studentId = yearMonth + String(newSequence).padStart(4, '0');

                data.students.push({
                    id: studentId,
                    ...student,
                    createdAt: student.timestamp || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                migratedCount++;
            }
        });

        if (writeStudents(data)) {
            res.json({
                success: true,
                message: `Migrated ${migratedCount} students successfully`,
                migratedCount,
                totalStudents: data.students.length
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save migrated students' });
        }
    } catch (error) {
        console.error('Error migrating students:', error);
        res.status(500).json({ success: false, message: 'Failed to migrate students' });
    }
});

// PUT - Update student
app.put('/api/students/:id', (req, res) => {
    try {
        const data = readStudents();
        const index = data.students.findIndex(s => s.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        data.students[index] = {
            ...data.students[index],
            ...req.body,
            id: req.params.id, // Preserve ID
            updatedAt: new Date().toISOString()
        };
        if (writeStudents(data)) {
            res.json({ success: true, message: 'Student updated successfully', data: data.students[index] });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update student' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update student' });
    }
});

// DELETE - Remove student
app.delete('/api/students/:id', (req, res) => {
    try {
        const data = readStudents();
        const index = data.students.findIndex(s => s.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        const deleted = data.students.splice(index, 1)[0];
        if (writeStudents(data)) {
            res.json({ success: true, message: 'Student deleted successfully', data: deleted });
        } else {
            res.status(500).json({ success: false, message: 'Failed to delete student' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete student' });
    }
});

// GET - Dashboard statistics
app.get('/api/students/stats/dashboard', (req, res) => {
    try {
        const data = readStudents();
        const students = data.students;

        // Calculate statistics
        const totalStudents = students.length;
        const uniqueCourses = new Set(students.map(s => s.desiredCourse).filter(c => c));
        const activeCourses = uniqueCourses.size;

        // Calculate average completion (mock based on enrollment)
        const baseCompletion = 68;
        const variance = totalStudents > 0 ? Math.min(Math.floor(totalStudents / 20), 7) : 0;
        const avgCompletion = Math.min(baseCompletion + variance, 85);

        // Calculate course rating
        const baseRating = 4.6;
        const ratingBoost = totalStudents > 0 ? Math.min(totalStudents / 1000, 0.3) : 0;
        const courseRating = Math.min(baseRating + ratingBoost, 5.0);

        // Reviews count
        const reviewCount = Math.floor(totalStudents * 0.27);

        res.json({
            success: true,
            data: {
                totalStudents,
                activeCourses,
                avgCompletion,
                courseRating: parseFloat(courseRating.toFixed(1)),
                reviewCount,
                trendPercent: totalStudents > 0 ? Math.min(Math.round((totalStudents / 100) * 12), 25) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to calculate statistics' });
    }
});

// ========================
// ADMIN & SUPER ADMIN MANAGEMENT API
// ========================
const adminsDbPath = path.join(__dirname, 'admins.json');

function readAdmins() {
    try {
        if (!fs.existsSync(adminsDbPath)) {
            const defaultData = {
                admins: [{ id: "ADM-1", name: "Admin", email: "jyotiprithvisambha2116@gmail.com", password: "2116", role: "Admin", status: "Active" }],
                superAdmins: [{ id: "SAD-1", name: "Super Admin", email: "superadmin@techproai.com", password: "admin", role: "SuperAdmin", status: "Active" }],
                lastUpdated: null
            };
            fs.writeFileSync(adminsDbPath, JSON.stringify(defaultData, null, 2));
        }
        return JSON.parse(fs.readFileSync(adminsDbPath, 'utf8'));
    } catch (error) {
        console.error('Error reading admins:', error);
        return { admins: [], superAdmins: [], lastUpdated: null };
    }
}

function writeAdmins(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(adminsDbPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing admins:', error);
        return false;
    }
}

// POST - Admin Login
app.post('/api/admins/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const data = readAdmins();
        const admin = data.admins.find(a => a.email === email && a.status === 'Active');

        if (!admin || admin.password !== password) {
            return res.status(401).json({ success: false, message: 'INVALID_CREDENTIALS' });
        }

        sendLoginSuccessEmail(admin.email, admin.name, "Admin", "/A9Admin.html");

        res.json({ success: true, message: 'LOGIN_SUCCESS', admin: { id: admin.id, name: admin.name, email: admin.email } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
});

// POST - Super Admin Login
app.post('/api/super-admins/login', (req, res) => {
    try {
        const { identifier, password } = req.body;
        const data = readAdmins();
        // identifier can be email or name/id
        const superAdmin = data.superAdmins.find(s => (s.email === identifier || s.id === identifier) && s.status === 'Active');

        if (!superAdmin || superAdmin.password !== password) {
            return res.status(401).json({ success: false, message: 'INVALID_CREDENTIALS' });
        }

        sendLoginSuccessEmail(superAdmin.email, superAdmin.name, "Super Admin", "/A15Dashboard.html");

        res.json({ success: true, message: 'LOGIN_SUCCESS', superAdmin: { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
});

// ========================
// TRAINER MANAGEMENT API
// ========================
const trainersDbPath = path.join(__dirname, 'trainers.json');

// Helper: Read trainers from JSON file
function readTrainers() {
    try {
        if (!fs.existsSync(trainersDbPath)) {
            fs.writeFileSync(trainersDbPath, JSON.stringify({ trainers: [], lastUpdated: null }, null, 2));
        }
        const data = fs.readFileSync(trainersDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading trainers:', error);
        return { trainers: [], lastUpdated: null };
    }
}

// Helper: Write trainers to JSON file
function writeTrainers(trainersData) {
    try {
        trainersData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(trainersDbPath, JSON.stringify(trainersData, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing trainers:', error);
        return false;
    }
}

// GET - Retrieve all trainers
app.get('/api/trainers', (req, res) => {
    try {
        const data = readTrainers();
        res.json({
            success: true,
            count: data.trainers.length,
            data: data.trainers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve trainers' });
    }
});

// POST - Create or Update trainer (Update if ID exists)
app.post('/api/trainers', (req, res) => {
    try {
        const data = readTrainers();
        const { id, name, email, password, specialization, experience, status } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (id) {
            // Update existing trainer
            const index = data.trainers.findIndex(t => t.id === id);
            if (index !== -1) {
                data.trainers[index] = {
                    ...data.trainers[index],
                    name,
                    email,
                    password,
                    specialization: specialization || 'General',
                    experience: experience || '0',
                    status: status || 'Active',
                    updatedAt: new Date().toISOString()
                };
                if (writeTrainers(data)) {
                    return res.json({ success: true, message: 'Trainer updated successfully', data: data.trainers[index] });
                }
            } else {
                return res.status(404).json({ success: false, message: 'Trainer with specified ID not found' });
            }
        } else {
            // Check if email already used (for new trainers)
            if (data.trainers.find(t => t.email === email)) {
                return res.status(400).json({ success: false, message: 'Trainer with this email already exists' });
            }

            // Create new trainer
            const newId = `TRN-${Date.now()}`;
            const newTrainer = {
                id: newId,
                name,
                email,
                password,
                specialization: specialization || 'General',
                experience: experience || '0',
                status: status || 'Active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            data.trainers.unshift(newTrainer);
            if (writeTrainers(data)) {
                res.status(201).json({ success: true, message: 'Trainer added successfully', data: newTrainer });
            } else {
                res.status(500).json({ success: false, message: 'Failed to save trainer' });
            }
        }
    } catch (error) {
        console.error('Error managing trainer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/trainers/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const data = readTrainers();
        // Accept both 'Active' and 'approved' status (admin sets 'approved')
        const trainer = data.trainers.find(t => t.email === email && (t.status === 'Active' || t.status === 'approved'));

        if (!trainer || trainer.password !== password) {
            return res.status(401).json({ success: false, message: 'INVALID_CREDENTIALS' });
        }

        // Login successful
        sendLoginSuccessEmail(trainer.email, trainer.name, "Trainer", "/Faculty.html");

        res.json({
            success: true,
            message: 'LOGIN_SUCCESS',
            trainer: { id: trainer.id, name: trainer.name, email: trainer.email }
        });
    } catch (error) {
        console.error('Trainer login error:', error);
        res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
});

// DELETE - Remove trainer
app.delete('/api/trainers/:id', (req, res) => {
    try {
        const data = readTrainers();
        const index = data.trainers.findIndex(t => t.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Trainer not found' });
        }

        const deleted = data.trainers.splice(index, 1)[0];
        if (writeTrainers(data)) {
            res.json({ success: true, message: 'Trainer removed successfully', data: deleted });
        } else {
            res.status(500).json({ success: false, message: 'Failed to delete trainer' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ========================
// USER AUTHENTICATION API WITH EMAIL VERIFICATION
// ========================

const usersDbPath = path.join(__dirname, 'users.json');

// Helper: Read users from JSON file
function readUsers() {
    try {
        if (!fs.existsSync(usersDbPath)) {
            fs.writeFileSync(usersDbPath, JSON.stringify({ users: [], lastUpdated: null }, null, 2));
        }
        const data = fs.readFileSync(usersDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users:', error);
        return { users: [], lastUpdated: null };
    }
}

// Helper: Write users to JSON file
function writeUsers(usersData) {
    try {
        usersData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(usersDbPath, JSON.stringify(usersData, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users:', error);
        return false;
    }
}



// Helper: Generate verification token
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Helper: Send verification email
async function sendVerificationEmail(email, firstName, verificationToken) {
    if (!transporter) {
        console.warn('⚠️  Email service not configured. Skipping email send.');
        return false;
    }

    const verificationLink = `${emailConfig.appUrl}/A3Login.html?verified=true&email=${encodeURIComponent(email)}`;

    const mailOptions = {
        from: `"${emailConfig.email.from.name}" <${emailConfig.email.from.address}>`,
        to: email,
        subject: '🎓 Welcome to TECH-PRO AI - Verify Your Email',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <!-- Header with gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
                            <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -0.5px;">
                                    🚀 TECH-PRO AI
                                </h1>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 28px; font-weight: 700;">
                                Welcome, ${firstName}! 👋
                            </h2>
                            <p style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.6;">
                                Thank you for joining <strong>TECH-PRO AI</strong>, your gateway to cutting-edge technology education powered by artificial intelligence.
                            </p>
                            <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.6;">
                                Your account has been successfully created! You can now log in and start your learning journey.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${verificationLink}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); transition: all 0.3s;">
                                            ✨ Login to Your Account
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%); border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="margin: 0 0 10px; color: #1e40af; font-weight: 700; font-size: 14px;">
                                    📧 Your Account Details
                                </p>
                                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                    <strong>Email:</strong> ${email}<br>
                                    <strong>Registration Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            
                            <!-- What's Next -->
                            <div style="margin: 30px 0;">
                                <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 20px; font-weight: 700;">
                                    🎯 What's Next?
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                                    <li>Complete your profile to personalize your experience</li>
                                    <li>Take our AI-powered skill assessment (5 minutes)</li>
                                    <li>Get a customized learning path based on your goals</li>
                                    <li>Start learning with our expert instructors</li>
                                </ul>
                            </div>
                            
                            <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                If you didn't create this account, please ignore this email or contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 15px; color: #64748b; font-size: 13px; text-align: center;">
                                Need help? Contact us at <a href="mailto:support@techproai.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">support@techproai.com</a>
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                © ${new Date().getFullYear()} TECH-PRO AI Inc. All rights reserved.<br>
                                Empowering the next generation of tech professionals.
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
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send verification email:', error.message);
        return false;
    }
}

// Helper: Send login success email
async function sendLoginSuccessEmail(email, firstName, role = "Student", dashboardUrl = "/A5Dashboard.html") {
    if (!transporter) {
        console.warn('⚠️  Email service not configured. Skipping email send.');
        return false;
    }

    const loginTime = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
    });

    const mailOptions = {
        from: `"${emailConfig.email.from.name}" <${emailConfig.email.from.address}>`,
        to: email,
        subject: `✅ Successful Login to TECH-PRO AI (${role} Portal)`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <!-- Header Section -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
                            <div style="font-size: 48px; margin-bottom: 20px;">🛡️</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">
                                ${role} Login Successful
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content Section -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #ffffff;">
                            <p style="margin: 0 0 20px; color: #1e293b; font-size: 18px; font-weight: 600;">
                                Hello ${firstName},
                            </p>
                            <p style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.6;">
                                This is to confirm that you have successfully accessed the <strong>${role} Portal</strong> on TECH-PRO AI.
                            </p>
                            
                            <!-- Login Details Box -->
                            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 12px; margin: 30px 0;">
                                <p style="margin: 0 0 15px; color: #065f46; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                                    🔐 Login Details
                                </p>
                                <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                                    <strong>Role:</strong> ${role}<br>
                                    <strong>Email:</strong> ${email}<br>
                                    <strong>Login Time:</strong> ${loginTime}<br>
                                    <strong>Status:</strong> <span style="color: #10b981; font-weight: 700;">✓ Verified Access</span>
                                </p>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="margin: 0 0 10px; color: #92400e; font-weight: 700; font-size: 14px;">
                                    🔒 Security Notice
                                </p>
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    If you did not perform this login, please contact the system administrator immediately.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${emailConfig.appUrl}${dashboardUrl}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                            🖥️ Go to Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                Welcome back to the TECH-PRO AI management suite.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 15px; color: #64748b; font-size: 13px; text-align: center;">
                                Need help? Contact us at <a href="mailto:support@techproai.com" style="color: #10b981; text-decoration: none; font-weight: 600;">support@techproai.com</a>
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                © ${new Date().getFullYear()} TECH-PRO AI Inc. All rights reserved.<br>
                                This is an automated security notification. Please do not reply to this email.
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
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Login success email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send login success email:', error.message);
        return false;
    }
}

// Helper: Send password reset email
async function sendPasswordResetEmail(email, firstName, resetToken) {
    const appUrl = (emailConfig && emailConfig.appUrl) ? emailConfig.appUrl : 'http://localhost:8080';
    const resetLink = `${appUrl}/ResetPassword.html?token=${resetToken}`;

    // DEV LOGGING (Vital for testing without SMTP)
    console.log(`\n🔗 [DEV PREVIEW] Password Reset Link for ${email}:\n${resetLink}\n`);

    if (!transporter) {
        console.warn('⚠️  Email service not configured. Skipping email send (Use Dev Link above).');
        return true; // Return TRUE so frontend flow continues
    }

    const mailOptions = {
        from: `"${emailConfig.email.from.name}" <${emailConfig.email.from.address}>`,
        to: email,
        subject: '🔒 Reset Your TECH-PRO AI Password',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 20px;">🔑</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                                Password Reset Request
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #1e293b; font-size: 18px; font-weight: 600;">
                                Hello ${firstName},
                            </p>
                            <p style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.6;">
                                We received a request to reset the password for your TECH-PRO AI account.
                            </p>
                            <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.6;">
                                To reset your password, click the button below. This link acts as a secure key and will expire in 1 hour.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetLink}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
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
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send reset email:', error.message);
        return false;
    }
}

// POST - User Signup with Email Verification
app.post('/api/users/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).send('MISSING_FIELDS');
        }

        // Detect if input is email or phone number
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;

        let identifierType = '';
        let normalizedIdentifier = email.trim();

        if (emailRegex.test(normalizedIdentifier)) {
            identifierType = 'email';
        } else if (phoneRegex.test(normalizedIdentifier.replace(/\s+/g, ''))) {
            identifierType = 'phone';
            // Normalize phone number (remove spaces, ensure +91 prefix)
            normalizedIdentifier = normalizedIdentifier.replace(/\s+/g, '');
            if (!normalizedIdentifier.startsWith('+')) {
                if (normalizedIdentifier.startsWith('91')) {
                    normalizedIdentifier = '+' + normalizedIdentifier;
                } else {
                    normalizedIdentifier = '+91' + normalizedIdentifier;
                }
            }
        } else {
            return res.status(400).text('INVALID_EMAIL');
        }

        const data = readUsers();

        // Check if user already exists
        const existingUser = data.users.find(u => u.email === normalizedIdentifier);
        if (existingUser) {
            return res.status(400).send('ALREADY_REGISTERED');
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            firstName,
            lastName,
            email: normalizedIdentifier,
            identifierType, // 'email' or 'phone'
            password, // In production, this should be hashed!
            verificationToken,
            isVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.users.push(newUser);

        if (writeUsers(data)) {
            console.log(`✅ New user registered: ${normalizedIdentifier} (${identifierType})`);

            // Send verification email ONLY if identifier is email
            if (identifierType === 'email') {
                const emailSent = await sendVerificationEmail(normalizedIdentifier, firstName, verificationToken);

                if (emailSent) {
                    res.status(201).send('SIGNUP_SUCCESS_EMAIL_SENT');
                } else {
                    res.status(201).send('SIGNUP_SUCCESS');
                }
            } else {
                // Phone number registration - no email sent
                console.log(`📱 Phone registration - no email sent`);
                res.status(201).send('SIGNUP_SUCCESS');
            }
        } else {
            res.status(500).send('SERVER_ERROR');
        }
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).send('SERVER_ERROR');
    }
});

// GET - Verify Email (optional endpoint if you want to verify via link click)
app.get('/api/users/verify/:token', (req, res) => {
    try {
        const { token } = req.params;
        const data = readUsers();

        const user = data.users.find(u => u.verificationToken === token);

        if (!user) {
            return res.status(404).send('Invalid verification token');
        }

        if (user.isVerified) {
            return res.send('Email already verified. You can now log in.');
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationToken = null;
        user.verifiedAt = new Date().toISOString();

        if (writeUsers(data)) {
            console.log(`✅ User verified: ${user.email}`);
            // Redirect to login page
            res.redirect('/A3Login.html?verified=true');
        } else {
            res.status(500).send('Failed to verify email');
        }
    } catch (error) {
        console.error('Error in email verification:', error);
        res.status(500).send('Server error');
    }
});

// POST - User Login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).send('MISSING_FIELDS');
        }

        // Detect if input is email or phone number and normalize
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;

        let normalizedIdentifier = email.trim();
        let isEmail = false;

        if (emailRegex.test(normalizedIdentifier)) {
            isEmail = true;
        } else if (phoneRegex.test(normalizedIdentifier.replace(/\s+/g, ''))) {
            // Normalize phone number
            normalizedIdentifier = normalizedIdentifier.replace(/\s+/g, '');
            if (!normalizedIdentifier.startsWith('+')) {
                if (normalizedIdentifier.startsWith('91')) {
                    normalizedIdentifier = '+' + normalizedIdentifier;
                } else {
                    normalizedIdentifier = '+91' + normalizedIdentifier;
                }
            }
        } else {
            return res.status(400).send('INVALID_EMAIL');
        }

        const data = readUsers();

        // Find user by normalized identifier
        const user = data.users.find(u => u.email === normalizedIdentifier);

        if (!user) {
            return res.status(401).send('INVALID_CREDENTIALS');
        }

        // Check password
        if (user.password !== password) {
            return res.status(401).send('INVALID_CREDENTIALS');
        }

        // Login successful
        console.log(`✅ User logged in: ${normalizedIdentifier} (${user.identifierType || 'email'})`);

        // Send login success email ONLY if user registered with email
        if (user.identifierType === 'email' || !user.identifierType) {
            // Send email (don't wait for it to complete)
            sendLoginSuccessEmail(normalizedIdentifier, user.firstName).catch(err => {
                console.error('Error sending login email:', err);
            });
        } else {
            console.log(`📱 Phone login - no email sent`);
        }

        // Return user data (exclude password)
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: 'LOGIN_SUCCESS',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).send('SERVER_ERROR');
    }
});

// POST - Forgot Password
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const data = readUsers();
        const user = data.users.find(u => u.email === email);

        if (!user) {
            // Security: Don't reveal if user exists or not, but for this demo request we will return success even if not found, or maybe just generic message. 
            // However, the user request specifically asked "sent to the specific email".
            // Let's return success but log it.
            return res.status(404).json({ success: false, message: 'User with this email does not exist.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;

        if (writeUsers(data)) {
            const resetLink = `${emailConfig.appUrl}/ResetPassword.html?token=${resetToken}`;

            const mailOptions = {
                from: emailConfig.email.from,
                to: email,
                subject: '🔒 Reset Your Password - TECH-PRO AI',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4f46e5;">Password Reset Request</h2>
                        <p>Hello ${user.firstName},</p>
                        <p>You requested a password reset for your TECH-PRO AI account.</p>
                        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="color: #6b7280; font-size: 14px;">${resetLink}</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 12px;">If you didn't ask to reset your password, you can ignore this email.</p>
                    </div>
                `
            };

            if (transporter) {
                transporter.sendMail(mailOptions);
                console.log(`✅ Reset password email sent to: ${email}`);
                res.json({ success: true, message: 'Password reset link sent to your email.' });
            } else {
                console.warn('⚠️ Email service not configured. Returning mock success.');
                // For development without email, maybe log the link?
                console.log(`[DEV] Reset Link: ${resetLink}`);
                res.json({ success: true, message: 'Email service not configured (Check console for link).' });
            }
        } else {
            res.status(500).json({ success: false, message: 'Failed to save reset token.' });
        }
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST - Reset Password
app.post('/api/reset-password', (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        const data = readUsers();
        const user = data.users.find(u =>
            u.resetPasswordToken === token &&
            u.resetPasswordExpires > Date.now()
        );

        if (!user) {
            return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
        }

        // Update password
        user.password = newPassword; // In production this should be hashed
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.updatedAt = new Date().toISOString();

        if (writeUsers(data)) {
            console.log(`✅ Password reset for user: ${user.email}`);
            res.json({ success: true, message: 'Password has been reset successfully.' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update password.' });
        }

    } catch (error) {
        console.error('Error in reset password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET - Retrieve all users (for admin purposes)
app.get('/api/users', (req, res) => {
    try {
        const data = readUsers();
        // Don't send passwords in response
        const usersWithoutPasswords = data.users.map(({ password, ...user }) => user);
        res.json({
            success: true,
            count: data.users.length,
            data: usersWithoutPasswords
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve users' });
    }
});

// ========================
// BATCH REQUEST MANAGEMENT API
// ========================
// Config path defined globally

// Helper: Read batch requests
function readBatchRequests() {
    try {
        if (!fs.existsSync(batchRequestsPath)) {
            fs.writeFileSync(batchRequestsPath, JSON.stringify({ requests: [], lastUpdated: null }, null, 2));
        }
        const data = fs.readFileSync(batchRequestsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading batch requests:', error);
        return { requests: [], lastUpdated: null };
    }
}

// Helper: Write batch requests
function writeBatchRequests(requestsData) {
    try {
        requestsData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(batchRequestsPath, JSON.stringify(requestsData, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing batch requests:', error);
        return false;
    }
}

// POST - Create new batch request
app.post('/api/batch-requests', (req, res) => {
    try {
        const data = readBatchRequests();
        const { studentName, email, phone, courseTrack, preferredTime, batchSize, additionalNotes } = req.body;

        if (!studentName || !email || !courseTrack) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const requestId = `req-${Date.now()}`;
        const newRequest = {
            id: requestId,
            studentName,
            email,
            phone,
            courseTrack,
            preferredTime,
            batchSize,
            additionalNotes,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.requests.unshift(newRequest);

        if (writeBatchRequests(data)) {
            res.status(201).json({
                success: true,
                message: 'Batch request submitted successfully',
                data: newRequest
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save request' });
        }
    } catch (error) {
        console.error('Error creating batch request:', error);
        res.status(500).json({ success: false, message: 'Failed to create batch request' });
    }
});

// GET - Retrieve all batch requests
app.get('/api/batch-requests', (req, res) => {
    try {
        const data = readBatchRequests();
        res.json({
            success: true,
            count: data.requests.length,
            data: data.requests
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve batch requests' });
    }
});

// GET - Retrieve specific batch request
app.get('/api/batch-requests/:id', (req, res) => {
    try {
        const data = readBatchRequests();
        const request = data.requests.find(r => r.id === req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve request' });
    }
});

// PUT - Approve batch request
app.put('/api/batch-requests/:id/approve', async (req, res) => {
    try {
        const data = readBatchRequests();
        const index = data.requests.findIndex(r => r.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const request = data.requests[index];
        request.status = 'approved';
        request.updatedAt = new Date().toISOString();
        request.approvedAt = new Date().toISOString();

        if (writeBatchRequests(data)) {
            // Send approval email
            if (transporter && request.email) {
                try {
                    await transporter.sendMail({
                        from: emailConfig.email,
                        to: request.email,
                        subject: '✅ Your Custom Batch Request Has Been Approved!',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #137fec;">Batch Request Approved!</h2>
                                <p>Dear ${request.studentName},</p>
                                <p>Great news! Your custom batch request has been approved.</p>
                                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <h3 style="margin-top: 0;">Request Details:</h3>
                                    <p><strong>Course:</strong> ${request.courseTrack}</p>
                                    <p><strong>Preferred Time:</strong> ${request.preferredTime}</p>
                                    <p><strong>Batch Size:</strong> ${request.batchSize}</p>
                                    ${request.additionalNotes ? `<p><strong>Notes:</strong> ${request.additionalNotes}</p>` : ''}
                                </div>
                                <p>Our team will contact you shortly at <strong>${request.phone}</strong> to finalize the batch schedule and enrollment details.</p>
                                <p>Thank you for choosing AI-TECH PRO!</p>
                                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 12px;">This is an automated email from AI-TECH PRO. Please do not reply to this email.</p>
                            </div>
                        `
                    });
                    console.log(`✅ Approval email sent to ${request.email}`);
                } catch (emailError) {
                    console.error('Error sending approval email:', emailError);
                }
            }

            res.json({
                success: true,
                message: 'Request approved and email sent',
                data: request
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update request' });
        }
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ success: false, message: 'Failed to approve request' });
    }
});

// ========================
// ENROLLMENT ROUTES
// ========================
const enrollmentsPath = path.join(__dirname, 'enrollments.json');

// Helper: Read enrollments
function readEnrollments() {
    try {
        if (!fs.existsSync(enrollmentsPath)) {
            // Create default file if not exists
            const defaultData = { enrollments: [] };
            fs.writeFileSync(enrollmentsPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = fs.readFileSync(enrollmentsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading enrollments:', error);
        return { enrollments: [] };
    }
}

// Helper: Write enrollments
function writeEnrollments(data) {
    try {
        fs.writeFileSync(enrollmentsPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing enrollments:', error);
        return false;
    }
}

// GET - Retrieve all enrollments
app.get('/api/enrollments', (req, res) => {
    try {
        const data = readEnrollments();
        res.json({ success: true, count: data.enrollments.length, data: data.enrollments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
    }
});

// GET - Retrieve enrollments by type
app.get('/api/enrollments/:type', (req, res) => {
    try {
        const { type } = req.params;
        const data = readEnrollments();
        const filtered = data.enrollments.filter(e => e.type === type);
        res.json({ success: true, count: filtered.length, enrollments: filtered });
    } catch (error) {
        console.error('Error fetching enrollments by type:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
    }
});

// POST - Create new enrollment
app.post('/api/enrollments', (req, res) => {
    try {
        const { type, studentName, email, phone, course, batchDetails } = req.body;

        if (!studentName || !email || !course) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const data = readEnrollments();

        const newEnrollment = {
            id: `ENR-${Date.now()}`,
            type: type || 'online',
            studentName,
            email,
            phone: phone || '',
            course,
            batchDetails: batchDetails || {},
            status: 'Pending',
            enrolledAt: new Date().toISOString()
        };

        if (!data.enrollments) data.enrollments = [];
        data.enrollments.unshift(newEnrollment);

        if (writeEnrollments(data)) {
            // Send confirmation email
            if (transporter) {
                transporter.sendMail({
                    from: emailConfig.email,
                    to: email,
                    subject: '🎉 Enrollment Received - AI-TECH PRO',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #137fec;">Enrollment Confirmation</h2>
                            <p>Hi ${studentName},</p>
                            <p>We have received your enrollment request for <strong>${course}</strong>.</p>
                            <p>Our team will review your details and contact you shortly.</p>
                            <p>Status: <strong>Pending Approval</strong></p>
                        </div>
                    `
                }).catch(err => console.error('Email error:', err));
            }

            res.status(201).json({ success: true, message: 'Enrollment submitted successfully', data: newEnrollment });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save enrollment' });
        }
    } catch (error) {
        console.error('Error creating enrollment:', error);
        res.status(500).json({ success: false, message: 'Enrollment creation failed' });
    }
});

// PUT - Approve enrollment
app.put('/api/enrollments/:id/approve', (req, res) => {
    try {
        const { id } = req.params;
        const data = readEnrollments();
        const enrollment = data.enrollments.find(e => e.id === id);

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        enrollment.status = 'Approved';
        enrollment.approvedAt = new Date().toISOString();

        if (writeEnrollments(data)) {
            res.json({ success: true, message: 'Enrollment approved', data: enrollment });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save approval' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Approval failed' });
    }
});

// PUT - Reject enrollment
app.put('/api/enrollments/:id/reject', (req, res) => {
    try {
        const { id } = req.params;
        const data = readEnrollments();
        const enrollment = data.enrollments.find(e => e.id === id);

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        enrollment.status = 'Rejected';
        enrollment.rejectedAt = new Date().toISOString();

        if (writeEnrollments(data)) {
            res.json({ success: true, message: 'Enrollment rejected', data: enrollment });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save rejection' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Rejection failed' });
    }
});


// PUT - Reject batch request
app.put('/api/batch-requests/:id/reject', async (req, res) => {
    try {
        const data = readBatchRequests();
        const index = data.requests.findIndex(r => r.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const request = data.requests[index];
        const { reason } = req.body;

        request.status = 'rejected';
        request.updatedAt = new Date().toISOString();
        request.rejectedAt = new Date().toISOString();
        request.rejectionReason = reason || 'Not specified';

        if (writeBatchRequests(data)) {
            // Send rejection email
            if (transporter && request.email) {
                try {
                    await transporter.sendMail({
                        from: emailConfig.email,
                        to: request.email,
                        subject: 'Update on Your Custom Batch Request',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #ef4444;">Batch Request Update</h2>
                                <p>Dear ${request.studentName},</p>
                                <p>Thank you for your interest in AI-TECH PRO. Unfortunately, we are unable to accommodate your custom batch request at this time.</p>
                                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <h3 style="margin-top: 0;">Request Details:</h3>
                                    <p><strong>Course:</strong> ${request.courseTrack}</p>
                                    <p><strong>Preferred Time:</strong> ${request.preferredTime}</p>
                                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                                </div>
                                <p>However, we have many other batch options available! Please check our regular batch schedule or contact us to explore alternative options.</p>
                                <p>We appreciate your understanding and hope to serve you in the future.</p>
                                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 12px;">This is an automated email from AI-TECH PRO. Please do not reply to this email.</p>
                            </div>
                        `
                    });
                    console.log(`✅ Rejection email sent to ${request.email}`);
                } catch (emailError) {
                    console.error('Error sending rejection email:', emailError);
                }
            }

            res.json({
                success: true,
                message: 'Request rejected and email sent',
                data: request
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update request' });
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ success: false, message: 'Failed to reject request' });
    }
});

// DELETE - Delete batch request
app.delete('/api/batch-requests/:id', (req, res) => {
    try {
        const data = readBatchRequests();
        const index = data.requests.findIndex(r => r.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const deleted = data.requests.splice(index, 1)[0];

        if (writeBatchRequests(data)) {
            res.json({ success: true, message: 'Request deleted successfully', data: deleted });
        } else {
            res.status(500).json({ success: false, message: 'Failed to delete request' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete request' });
    }
});

// ========================
// PRICING PLANS API
// ========================
const pricingPlansPath = path.join(__dirname, 'pricing-plans.json');

// Helper: Read pricing plans
function readPricingPlans() {
    try {
        if (!fs.existsSync(pricingPlansPath)) {
            const defaultPlans = {
                plans: [
                    {
                        planName: "Basic Plan",
                        monthlyPrice: "0.00",
                        durationCycle: "Lifetime",
                        allowUpgrades: true,
                        freeTrial: false,
                        trialDays: 0,
                        autoRenew: false,
                        prioritySupport: false,
                        contactSales: false
                    },
                    {
                        planName: "Pro Plan",
                        monthlyPrice: "29.00",
                        durationCycle: "Monthly",
                        allowUpgrades: false,
                        freeTrial: true,
                        trialDays: 14,
                        autoRenew: true,
                        prioritySupport: false,
                        contactSales: false
                    },
                    {
                        planName: "Enterprise",
                        monthlyPrice: "99.00",
                        durationCycle: "Annual",
                        allowUpgrades: false,
                        freeTrial: false,
                        trialDays: 0,
                        autoRenew: false,
                        prioritySupport: true,
                        contactSales: false
                    }
                ],
                lastUpdated: null
            };
            fs.writeFileSync(pricingPlansPath, JSON.stringify(defaultPlans, null, 2));
        }
        const data = fs.readFileSync(pricingPlansPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading pricing plans:', error);
        return { plans: [], lastUpdated: null };
    }
}

// Helper: Write pricing plans
function writePricingPlans(plansData) {
    try {
        plansData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(pricingPlansPath, JSON.stringify(plansData, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing pricing plans:', error);
        return false;
    }
}

// GET - Retrieve all pricing plans
app.get('/api/pricing', (req, res) => {
    try {
        const data = readPricingPlans();
        res.json(data.plans);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve pricing plans' });
    }
});

// POST - Save/Update pricing plan
app.post('/api/pricing/save', (req, res) => {
    try {
        const data = readPricingPlans();
        const { planName, monthlyPrice, durationCycle, allowUpgrades, freeTrial, trialDays, autoRenew, prioritySupport, contactSales } = req.body;

        if (!planName) {
            return res.status(400).json({ success: false, message: 'Plan name is required' });
        }

        // Find existing plan or create new one
        const planIndex = data.plans.findIndex(p => p.planName === planName);

        const updatedPlan = {
            planName,
            monthlyPrice: monthlyPrice || "0.00",
            durationCycle: durationCycle || "Monthly",
            allowUpgrades: allowUpgrades || false,
            freeTrial: freeTrial || false,
            trialDays: trialDays || 0,
            autoRenew: autoRenew || false,
            prioritySupport: prioritySupport || false,
            contactSales: contactSales || false
        };

        if (planIndex !== -1) {
            // Update existing plan
            data.plans[planIndex] = updatedPlan;
        } else {
            // Add new plan
            data.plans.push(updatedPlan);
        }

        if (writePricingPlans(data)) {
            res.json({ success: true, message: 'Pricing plan saved successfully', data: updatedPlan });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save pricing plan' });
        }
    } catch (error) {
        console.error('Error saving pricing plan:', error);
        res.status(500).json({ success: false, message: 'Failed to save pricing plan' });
    }
});

// ========================
// AICC COURSE MANAGEMENT API
// ========================
const multer = require('multer');
const aiccCoursePath = path.join(__dirname, 'aicc-course.json');
const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|webm|avi|mov|mkv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'));
        }
    }
});

// Helper: Read AiCC course data
function readAiccCourse() {
    try {
        if (!fs.existsSync(aiccCoursePath)) {
            const defaultData = {
                courseInfo: {
                    courseTitle: "Cloud Computing",
                    currentTopic: "Virtualization",
                    tutorName: "Sarah (AI Tutor)",
                    tutorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBm97sI5Wu9X-H9bNTD_7zKgD2N8D3OfhjP9F9sotk29A7R7gC4nu061bPzIv_-u10hRC8XTK0_eSfIRCVEzFXCqHfn7m7GajQzUHH3QAyt4NVTd6mT7OzD58bDwqnkiAp1-Xyhc39SJC025sbZTeziXBRXUPL2UmtqP6wobbcNj745Wg_Maan7CFvuoQOwpdo20Nxipjp7EAnUi9XqrBhvVBVIrdWYj4VVx2nr0i5d2kalhMMQsBo5FOmOW0gtSMdbwHdYXNmzrxKn",
                    aiMessage: "Serverless computing allows you to build and run applications without managing infrastructure.",
                    videoDuration: "12:45",
                    timeRemaining: "14 mins remaining"
                },
                videoInfo: {
                    youtubeId: "s_qQfOitQIs",
                    backgroundImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBfp4ylADa58d_Dh-XYy3TCjyhn0H23sLmDA39CvpCb2xc-aaKN85KmOKKvOcvhiUSCsDSZDFErOT8axsCcuCNe12FXQoIDajzNuhuFdEWcnw2qYT3vrlOFVpT04zlr6bE5mqV_jrZa0NB4es4wbYR9oZYgBwQW2R1mVEBzDhTTw4CD-_aO_7aIJb3Wi6b7aKBzkobJoUqvtiSvRJYE48jkULEOOx0bKy8pITq95RvFGxZVoJLoow0RrJcPs35aOM0-482thXbOqObE",
                    uploadedVideo: null
                },
                modules: [
                    { id: 1, name: "1. Introduction", status: "completed", locked: false },
                    { id: 2, name: "2. Virtualization", status: "active", locked: false },
                    { id: 3, name: "3. Containers & K8s", status: "locked", locked: true },
                    { id: 4, name: "4. Serverless Arch", status: "locked", locked: true },
                    { id: 5, name: "5. Cloud Security", status: "locked", locked: true }
                ],
                lastUpdated: null
            };
            fs.writeFileSync(aiccCoursePath, JSON.stringify(defaultData, null, 2));
        }
        const data = fs.readFileSync(aiccCoursePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading AiCC course data:', error);
        return null;
    }
}

// Helper: Write AiCC course data
function writeAiccCourse(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(aiccCoursePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing AiCC course data:', error);
        return false;
    }
}

// GET - Retrieve course info
app.get('/api/aicc-course/course-info', (req, res) => {
    try {
        const data = readAiccCourse();
        if (data) {
            res.json({ success: true, data: data.courseInfo });
        } else {
            res.status(500).json({ success: false, message: 'Failed to read course info' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST - Update course info
app.post('/api/aicc-course/course-info', (req, res) => {
    try {
        const data = readAiccCourse();
        if (!data) {
            return res.status(500).json({ success: false, message: 'Failed to read course data' });
        }

        data.courseInfo = {
            ...data.courseInfo,
            ...req.body
        };

        if (writeAiccCourse(data)) {
            res.json({ success: true, message: 'Course info updated successfully', data: data.courseInfo });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save course info' });
        }
    } catch (error) {
        console.error('Error updating course info:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST - Upload video file
app.post('/api/aicc-course/upload-video', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No video file uploaded' });
        }

        const data = readAiccCourse();
        if (!data) {
            return res.status(500).json({ success: false, message: 'Failed to read course data' });
        }

        data.videoInfo.uploadedVideo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            uploadedAt: new Date().toISOString()
        };

        if (writeAiccCourse(data)) {
            res.json({
                success: true,
                message: 'Video uploaded successfully',
                data: data.videoInfo.uploadedVideo
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save video info' });
        }
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST - Update YouTube video
app.post('/api/aicc-course/youtube-video', (req, res) => {
    try {
        const data = readAiccCourse();
        if (!data) {
            return res.status(500).json({ success: false, message: 'Failed to read course data' });
        }

        const { youtubeId, backgroundImage } = req.body;

        if (youtubeId) data.videoInfo.youtubeId = youtubeId;
        if (backgroundImage) data.videoInfo.backgroundImage = backgroundImage;

        if (writeAiccCourse(data)) {
            res.json({ success: true, message: 'YouTube video updated successfully', data: data.videoInfo });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save video info' });
        }
    } catch (error) {
        console.error('Error updating YouTube video:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET - Retrieve modules
app.get('/api/aicc-course/modules', (req, res) => {
    try {
        const data = readAiccCourse();
        if (data) {
            res.json({ success: true, data: data.modules });
        } else {
            res.status(500).json({ success: false, message: 'Failed to read modules' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST - Update modules
app.post('/api/aicc-course/modules', (req, res) => {
    try {
        const data = readAiccCourse();
        if (!data) {
            return res.status(500).json({ success: false, message: 'Failed to read course data' });
        }

        const { modules } = req.body;

        if (!Array.isArray(modules)) {
            return res.status(400).json({ success: false, message: 'Modules must be an array' });
        }

        data.modules = modules;

        if (writeAiccCourse(data)) {
            res.json({ success: true, message: 'Modules updated successfully', data: data.modules });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save modules' });
        }
    } catch (error) {
        console.error('Error updating modules:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// ========================
// ASSIGNMENTS CONFIG ROUTES
// ========================
const assignmentsConfigPath = path.join(__dirname, 'config-assignments.json');

// Helper: Read assignments config
function readAssignmentsConfig() {
    try {
        if (!fs.existsSync(assignmentsConfigPath)) {
            const defaultConfig = { assignments: {} };
            fs.writeFileSync(assignmentsConfigPath, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }
        const data = fs.readFileSync(assignmentsConfigPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading assignments config:', error);
        return { assignments: {} };
    }
}

// Helper: Write assignments config
function writeAssignmentsConfig(config) {
    try {
        fs.writeFileSync(assignmentsConfigPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing assignments config:', error);
        return false;
    }
}

// GET - Retrieve all assignments configuration
app.get('/api/assignments-config', (req, res) => {
    try {
        const config = readAssignmentsConfig();
        res.json({ success: true, data: config.assignments });
    } catch (error) {
        console.error('Error retrieving assignments:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve assignments' });
    }
});

// GET - Retrieve specific assignment by ID
app.get('/api/assignments-config/:assignmentId', (req, res) => {
    try {
        const { assignmentId } = req.params;
        const config = readAssignmentsConfig();

        if (!config.assignments[assignmentId]) {
            return res.status(404).json({ success: false, message: `Assignment '${assignmentId}' not found` });
        }

        res.json({ success: true, data: config.assignments[assignmentId] });
    } catch (error) {
        console.error('Error retrieving assignment:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve assignment' });
    }
});

// PUT - Update entire assignment configuration
app.put('/api/assignments-config/:assignmentId', (req, res) => {
    try {
        const { assignmentId } = req.params;
        const config = readAssignmentsConfig();

        if (!config.assignments[assignmentId]) {
            return res.status(404).json({ success: false, message: `Assignment '${assignmentId}' not found` });
        }

        // Update the assignment with new data, preserving the ID
        config.assignments[assignmentId] = {
            ...req.body,
            id: assignmentId
        };

        if (writeAssignmentsConfig(config)) {
            res.json({
                success: true,
                message: `Assignment '${assignmentId}' updated successfully`,
                data: config.assignments[assignmentId]
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save assignment' });
        }
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// ========================
// ENROLLMENT MANAGEMENT API
// ========================
const enrollmentsDbPath = path.join(__dirname, 'enrollments.json');

// Helper: Read enrollments
function readEnrollments() {
    try {
        if (!fs.existsSync(enrollmentsDbPath)) {
            fs.writeFileSync(enrollmentsDbPath, JSON.stringify({ enrollments: [], lastUpdated: null }, null, 2));
        }
        const data = fs.readFileSync(enrollmentsDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading enrollments:', error);
        return { enrollments: [], lastUpdated: null };
    }
}

// Helper: Write enrollments
function writeEnrollments(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(enrollmentsDbPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing enrollments:', error);
        return false;
    }
}

// POST - Create new enrollment
app.post('/api/enrollments', (req, res) => {
    try {
        const { type, studentName, email, phone, course, batchDetails, courseTrack, preferredTime, batchSize, additionalNotes } = req.body;

        // Validate required fields
        if (!type || !studentName || !email) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Validate type
        if (!['online', 'offline', 'hybrid'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid enrollment type' });
        }

        const data = readEnrollments();

        // Create new enrollment
        const enrollment = {
            id: `ENR-${Date.now()}`,
            type,
            studentName,
            email,
            phone: phone || '',
            course: course || courseTrack || '',
            batchDetails: batchDetails || {},
            preferredTime: preferredTime || '',
            batchSize: batchSize || '',
            additionalNotes: additionalNotes || '',
            status: 'Pending',
            enrolledAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null
        };

        data.enrollments.push(enrollment);

        if (writeEnrollments(data)) {
            console.log(`✅ New ${type} enrollment created:`, enrollment.id);
            res.json({ success: true, message: 'Enrollment submitted successfully', enrollment });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save enrollment' });
        }
    } catch (error) {
        console.error('Error creating enrollment:', error);
        res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
});

// GET - Get enrollments by type
app.get('/api/enrollments/:type', (req, res) => {
    try {
        const { type } = req.params;

        if (!['online', 'offline', 'hybrid', 'all'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid type' });
        }

        const data = readEnrollments();

        let enrollments = data.enrollments;
        if (type !== 'all') {
            enrollments = enrollments.filter(e => e.type === type);
        }

        res.json({ success: true, enrollments, total: enrollments.length });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
});

// PUT - Approve enrollment
app.put('/api/enrollments/:id/approve', (req, res) => {
    try {
        const { id } = req.params;
        const { reviewedBy } = req.body;

        const data = readEnrollments();
        const enrollment = data.enrollments.find(e => e.id === id);

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        enrollment.status = 'Approved';
        enrollment.reviewedAt = new Date().toISOString();
        enrollment.reviewedBy = reviewedBy || 'Admin';

        if (writeEnrollments(data)) {
            console.log(`✅ Enrollment approved: ${id}`);
            res.json({ success: true, message: 'Enrollment approved', enrollment });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update enrollment' });
        }
    } catch (error) {
        console.error('Error approving enrollment:', error);
        res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
});

// PUT - Reject enrollment
app.put('/api/enrollments/:id/reject', (req, res) => {
    try {
        const { id } = req.params;
        const { reviewedBy, reason } = req.body;

        const data = readEnrollments();
        const enrollment = data.enrollments.find(e => e.id === id);

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        enrollment.status = 'Rejected';
        enrollment.reviewedAt = new Date().toISOString();
        enrollment.reviewedBy = reviewedBy || 'Admin';
        enrollment.rejectionReason = reason || '';

        if (writeEnrollments(data)) {
            console.log(`❌ Enrollment rejected: ${id}`);
            res.json({ success: true, message: 'Enrollment rejected', enrollment });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update enrollment' });
        }
    } catch (error) {
        console.error('Error rejecting enrollment:', error);
        res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
});

// GET - Get enrollment statistics
app.get('/api/enrollments/stats/:type', (req, res) => {
    try {
        const { type } = req.params;
        const data = readEnrollments();

        let enrollments = data.enrollments;
        if (type !== 'all') {
            enrollments = enrollments.filter(e => e.type === type);
        }

        const stats = {
            total: enrollments.length,
            pending: enrollments.filter(e => e.status === 'Pending').length,
            approved: enrollments.filter(e => e.status === 'Approved').length,
            rejected: enrollments.filter(e => e.status === 'Rejected').length
        };

        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
});



// ========================
// PASSWORD RESET API
// ========================

// POST - Forgot Password Request
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const normalizedEmail = email.trim();

        // 1. Check Trainers
        const trainersData = readTrainers();
        // Check both exact match and lowercase match for robustness
        const trainer = trainersData.trainers.find(t => t.email === normalizedEmail || t.email === normalizedEmail.toLowerCase());

        if (trainer) {
            const token = crypto.randomBytes(32).toString('hex');
            trainer.resetToken = token;
            trainer.resetTokenExpires = Date.now() + 3600000; // 1 hour

            if (writeTrainers(trainersData)) {
                await sendPasswordResetEmail(trainer.email, trainer.name, token);
                return res.json({ success: true, message: 'Password reset link sent to your email.' });
            }
        }

        // 2. Check Users (Students)
        const usersData = readUsers();
        // Users might have identifierType='email'
        const user = usersData.users.find(u => (u.identifierType === 'email' || !u.identifierType) && u.email === normalizedEmail);

        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            user.resetToken = token;
            user.resetTokenExpires = Date.now() + 3600000; // 1 hour

            if (writeUsers(usersData)) {
                await sendPasswordResetEmail(user.email, user.firstName, token);
                return res.json({ success: true, message: 'Password reset link sent to your email.' });
            }
        }

        return res.status(404).json({ success: false, message: 'No account found with this email address.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST - Reset Password
app.post('/api/reset-password', (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and password are required' });

        // 1. Check Trainers
        const trainersData = readTrainers();
        const trainerIndex = trainersData.trainers.findIndex(t => t.resetToken === token && t.resetTokenExpires > Date.now());

        if (trainerIndex !== -1) {
            trainersData.trainers[trainerIndex].password = newPassword;
            trainersData.trainers[trainerIndex].resetToken = null;
            trainersData.trainers[trainerIndex].resetTokenExpires = null;

            if (writeTrainers(trainersData)) {
                return res.json({ success: true, message: 'Password reset successfully. You can now login.' });
            }
        }

        // 2. Check Users
        const usersData = readUsers();
        const userIndex = usersData.users.findIndex(u => u.resetToken === token && u.resetTokenExpires > Date.now());

        if (userIndex !== -1) {
            usersData.users[userIndex].password = newPassword;
            usersData.users[userIndex].resetToken = null;
            usersData.users[userIndex].resetTokenExpires = null;

            if (writeUsers(usersData)) {
                return res.json({ success: true, message: 'Password reset successfully. You can now login.' });
            }
        }

        return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ========================
// NOTIFICATION ROUTES
// ========================

// GET - Retrieve all notifications
app.get('/api/notifications', (req, res) => {
    try {
        if (!fs.existsSync(notificationsPath)) {
            return res.json({ success: true, data: [] });
        }
        const data = fs.readFileSync(notificationsPath, 'utf8');
        const config = JSON.parse(data);
        res.json({
            success: true,
            data: config.notifications || []
        });
    } catch (error) {
        console.error('Error reading notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read notifications'
        });
    }
});

// POST - Send a new notification
app.post('/api/notifications', (req, res) => {
    try {
        const { title, message, type, audience, expiry } = req.body;

        // Load existing
        let nData = { notifications: [] };
        if (fs.existsSync(notificationsPath)) {
            nData = JSON.parse(fs.readFileSync(notificationsPath, 'utf8'));
        }

        const newNotif = {
            id: crypto.randomBytes(8).toString('hex'),
            title,
            message,
            type: type || 'info', // info, warning, success, error
            audience: audience || 'all',
            date: new Date().toISOString(),
            expiry: expiry || null, // Optional expiry date
            readBy: [] // Track who read it if needed (not fully implemented yet)
        };

        nData.notifications.unshift(newNotif); // Add to top
        // Limit to last 50 notifications to prevent bloat
        if (nData.notifications.length > 50) nData.notifications = nData.notifications.slice(0, 50);

        fs.writeFileSync(notificationsPath, JSON.stringify(nData, null, 2));

        res.json({
            success: true,
            message: 'Notification sent successfully',
            data: newNotif
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
});

// ========================
// PERMISSIONS ENDPOINTS
// ========================

// GET /api/permissions - Fetch current permission matrix
app.get('/api/permissions', (req, res) => {
    try {
        const permissionsPath = path.join(__dirname, 'permissions.json');

        if (fs.existsSync(permissionsPath)) {
            const data = fs.readFileSync(permissionsPath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            // Return default permissions if file doesn't exist
            const defaultPermissions = {
                admin: {
                    viewStudents: true,
                    addStudents: true,
                    editStudents: true,
                    deleteStudents: false,
                    exportStudents: true,
                    viewFaculty: true,
                    addFaculty: false,
                    editFaculty: false,
                    deleteFaculty: false,
                    viewCourses: true,
                    createCourses: false,
                    editCourses: true,
                    deleteCourses: false,
                    viewAnalytics: true,
                    exportReports: true,
                    viewGlobalReports: false,
                    manageNotifications: true,
                    manageBatches: true,
                    systemConfiguration: false
                },
                faculty: {
                    viewStudents: true,
                    addStudents: false,
                    editStudents: false,
                    deleteStudents: false,
                    exportStudents: false,
                    viewFaculty: false,
                    addFaculty: false,
                    editFaculty: false,
                    deleteFaculty: false,
                    viewCourses: true,
                    createCourses: false,
                    editCourses: true,
                    deleteCourses: false,
                    viewAnalytics: true,
                    exportReports: false,
                    viewGlobalReports: false,
                    manageNotifications: false,
                    manageBatches: false,
                    systemConfiguration: false
                },
                student: {
                    viewStudents: false,
                    addStudents: false,
                    editStudents: false,
                    deleteStudents: false,
                    exportStudents: false,
                    viewFaculty: false,
                    addFaculty: false,
                    editFaculty: false,
                    deleteFaculty: false,
                    viewCourses: true,
                    createCourses: false,
                    editCourses: false,
                    deleteCourses: false,
                    viewAnalytics: false,
                    exportReports: false,
                    viewGlobalReports: false,
                    manageNotifications: false,
                    manageBatches: false,
                    systemConfiguration: false
                },
                user: {
                    viewStudents: false,
                    addStudents: false,
                    editStudents: false,
                    deleteStudents: false,
                    exportStudents: false,
                    viewFaculty: false,
                    addFaculty: false,
                    editFaculty: false,
                    deleteFaculty: false,
                    viewCourses: true,
                    createCourses: false,
                    editCourses: false,
                    deleteCourses: false,
                    viewAnalytics: false,
                    exportReports: false,
                    viewGlobalReports: false,
                    manageNotifications: false,
                    manageBatches: false,
                    systemConfiguration: false
                }
            };
            res.json(defaultPermissions);
        }
    } catch (error) {
        console.error('Error reading permissions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch permissions' });
    }
});

// POST /api/permissions - Save permission updates
app.post('/api/permissions', (req, res) => {
    try {
        const permissionsPath = path.join(__dirname, 'permissions.json');
        const permissions = req.body;

        // Validate the structure
        const requiredRoles = ['admin', 'faculty', 'student', 'user'];
        for (const role of requiredRoles) {
            if (!permissions[role]) {
                return res.status(400).json({
                    success: false,
                    error: `Missing permissions for role: ${role}`
                });
            }
        }

        fs.writeFileSync(permissionsPath, JSON.stringify(permissions, null, 2));

        res.json({
            success: true,
            message: 'Permissions updated successfully'
        });
    } catch (error) {
        console.error('Error saving permissions:', error);
        res.status(500).json({ success: false, error: 'Failed to save permissions' });
    }
});

// GET /api/permissions/check - Validate user permission for action
app.get('/api/permissions/check', (req, res) => {
    try {
        const { role, action } = req.query;

        if (!role || !action) {
            return res.status(400).json({
                success: false,
                error: 'Missing role or action parameter'
            });
        }

        const permissionsPath = path.join(__dirname, 'permissions.json');

        if (fs.existsSync(permissionsPath)) {
            const permissions = JSON.parse(fs.readFileSync(permissionsPath, 'utf8'));

            const hasPermission = permissions[role] && permissions[role][action] === true;

            res.json({
                success: true,
                hasPermission,
                role,
                action
            });
        } else {
            // If no permissions file, deny by default (except for basic view permissions)
            const defaultAllowed = ['viewCourses'];
            const hasPermission = defaultAllowed.includes(action);

            res.json({
                success: true,
                hasPermission,
                role,
                action,
                note: 'Using default permissions'
            });
        }
    } catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({ success: false, error: 'Failed to check permission' });
    }
});

// ========================
// PERMISSIONS ENDPOINTS
// ========================

// GET /api/permissions - Fetch current permission matrix
app.get('/api/permissions', (req, res) => {
    try {
        const permissionsPath = path.join(__dirname, 'permissions.json');

        if (fs.existsSync(permissionsPath)) {
            const data = fs.readFileSync(permissionsPath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            // Return default permissions if file doesn't exist
            const defaultPermissions = {
                admin: {
                    viewStudents: true,
                    addStudents: true,
                    editStudents: true,
                    deleteStudents: false,
                    exportStudents: true,
                    viewFaculty: true,
                    addFaculty: false,
                    editFaculty: false,
                    deleteFaculty: false,
                    viewCourses: true,
                    createCourses: false,
                    editCourses: true,
                    deleteCourses: false,
                    viewAnalytics: true,
                    exportReports: true,
                    viewGlobalReports: false,
                    manageNotifications: true,
                    manageBatches: true,
                    systemConfiguration: false
                },
                faculty: {
                    viewStudents: true,
                    addStudents: false,
                    editStudents: false,
                    deleteStudents: false,
                    exportStudents: false,
                    viewFaculty: false,
                    addFaculty: false,
                    editFaculty: false,
                    deleteFaculty: false,
                    viewCourses: true,
                    createCourses: false,
                    editCourses: true,
                    deleteCourses: false,
                    viewAnalytics: true,
                    exportReports: false,
                    viewGlobalReports: false,
                    manageNotifications: false,
                    manageBatches: false,
                    systemConfiguration: false
                },
                student: {
                    viewStudents: false,
                    addStudents: false,
                    editStudents: false,
                    deleteStudents: false,
                    exportStudents: false,
                    viewFaculty: false,
                    addFaculty: false,
                    editFaculty: false,
                    deleteFaculty: false,
                    viewCourses: true,
                    createCourses: false,
                    editCourses: false,
                    deleteCourses: false,
                    viewAnalytics: false,
                    exportReports: false,
                    viewGlobalReports: false,
                    manageNotifications: false,
                    manageBatches: false,
                    systemConfiguration: false
                },
                user: {
                    viewStudents: false,
                    addStudents: false,
                    editStudents: false,
                    deleteStudents: false,
                    exportStudents: false,
                    viewFaculty: false,
                    addFaculty: false,
                    editFaculty: false,
                    deleteFaculty: false,
                    viewCourses: true,
                    createCourses: false,
                    editCourses: false,
                    deleteCourses: false,
                    viewAnalytics: false,
                    exportReports: false,
                    viewGlobalReports: false,
                    manageNotifications: false,
                    manageBatches: false,
                    systemConfiguration: false
                }
            };
            res.json(defaultPermissions);
        }
    } catch (error) {
        console.error('Error reading permissions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch permissions' });
    }
});

// POST /api/permissions - Save permission updates
app.post('/api/permissions', (req, res) => {
    try {
        const permissionsPath = path.join(__dirname, 'permissions.json');
        const permissions = req.body;

        // Validate the structure
        const requiredRoles = ['admin', 'faculty', 'student', 'user'];
        for (const role of requiredRoles) {
            if (!permissions[role]) {
                return res.status(400).json({
                    success: false,
                    error: `Missing permissions for role: ${role}`
                });
            }
        }

        fs.writeFileSync(permissionsPath, JSON.stringify(permissions, null, 2));

        console.log('✅ Permissions saved successfully');
        res.json({
            success: true,
            message: 'Permissions updated successfully'
        });
    } catch (error) {
        console.error('Error saving permissions:', error);
        res.status(500).json({ success: false, error: 'Failed to save permissions' });
    }
});

// GET /api/permissions/check - Validate user permission for action
app.get('/api/permissions/check', (req, res) => {
    try {
        const { role, action } = req.query;

        if (!role || !action) {
            return res.status(400).json({
                success: false,
                error: 'Missing role or action parameter'
            });
        }

        const permissionsPath = path.join(__dirname, 'permissions.json');

        if (fs.existsSync(permissionsPath)) {
            const permissions = JSON.parse(fs.readFileSync(permissionsPath, 'utf8'));

            const hasPermission = permissions[role] && permissions[role][action] === true;

            res.json({
                success: true,
                hasPermission,
                role,
                action
            });
        } else {
            // If no permissions file, deny by default (except for basic view permissions)
            const defaultAllowed = ['viewCourses'];
            const hasPermission = defaultAllowed.includes(action);

            res.json({
                success: true,
                hasPermission,
                role,
                action,
                note: 'Using default permissions'
            });
        }
    } catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({ success: false, error: 'Failed to check permission' });
    }
});

// ========================
// GLOBAL ERROR HANDLERS
// ========================

// ========================
// GLOBAL ERROR HANDLERS
// ========================

// ==================================
// STUDY MATERIALS MANAGEMENT ROUTES
// ==================================

const studyMaterialsPath = path.join(__dirname, 'study-materials.json');
const coursesPath = path.join(__dirname, 'courses.json');
const modulesPath = path.join(__dirname, 'modules.json');
const activityLogsPath = path.join(__dirname, 'activity-logs.json');

// Helper function to log activity
function logActivity(userId, userName, userType, action, resource, resourceId, resourceName, courseId, courseName, details) {
    try {
        let logsData = { logs: [] };
        if (fs.existsSync(activityLogsPath)) {
            logsData = JSON.parse(fs.readFileSync(activityLogsPath, 'utf8'));
        }

        const newLog = {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId,
            userName,
            userType,
            action,
            resource,
            resourceId,
            resourceName,
            courseId,
            courseName,
            details
        };

        logsData.logs.unshift(newLog);
        fs.writeFileSync(activityLogsPath, JSON.stringify(logsData, null, 2));
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// GET - Retrieve all study materials (with filters)
app.get('/api/study-materials', (req, res) => {
    try {
        const { courseId, moduleId, type, status, studentId } = req.query;

        const data = fs.readFileSync(studyMaterialsPath, 'utf8');
        let materials = JSON.parse(data).materials;

        // Apply filters
        if (courseId) {
            materials = materials.filter(m => m.courseId === courseId);
        }
        if (moduleId) {
            materials = materials.filter(m => m.moduleId === moduleId);
        }
        if (type) {
            materials = materials.filter(m => m.type === type);
        }
        if (status) {
            materials = materials.filter(m => m.status === status);
        }

        // Filter by student's registered courses
        if (studentId) {
            const studentsPath = path.join(__dirname, 'students.json');
            if (fs.existsSync(studentsPath)) {
                const studentsData = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
                const student = studentsData.students.find(s => s.id === studentId);
                if (student && student.courses) {
                    materials = materials.filter(m =>
                        student.courses.some(course =>
                            course.toLowerCase().includes(m.courseName.toLowerCase()) ||
                            m.courseName.toLowerCase().includes(course.toLowerCase())
                        )
                    );
                }
            }
        }

        res.json({ success: true, materials });
    } catch (error) {
        console.error('Error fetching study materials:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch study materials' });
    }
});

// GET - Retrieve single material by ID
app.get('/api/study-materials/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = fs.readFileSync(studyMaterialsPath, 'utf8');
        const materials = JSON.parse(data).materials;

        const material = materials.find(m => m.id === id);
        if (!material) {
            return res.status(404).json({ success: false, error: 'Material not found' });
        }

        res.json({ success: true, material });
    } catch (error) {
        console.error('Error fetching material:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch material' });
    }
});

// POST - Upload new study material
app.post('/api/study-materials', (req, res) => {
    try {
        const { title, description, courseId, courseName, moduleId, moduleName, type, fileName, fileSize, filePath, duration, uploadedBy } = req.body;

        let materialsData = { materials: [] };
        if (fs.existsSync(studyMaterialsPath)) {
            materialsData = JSON.parse(fs.readFileSync(studyMaterialsPath, 'utf8'));
        }

        const newMaterial = {
            id: `mat_${Date.now()}`,
            title,
            description,
            courseId,
            courseName,
            moduleId,
            moduleName,
            type,
            fileName,
            fileSize,
            filePath,
            ...(duration && { duration }),
            uploadedBy,
            uploadDate: new Date().toISOString(),
            status: 'pending',
            downloads: 0,
            views: 0,
            tags: []
        };

        materialsData.materials.unshift(newMaterial);
        fs.writeFileSync(studyMaterialsPath, JSON.stringify(materialsData, null, 2));

        // Log activity
        logActivity(
            uploadedBy.id,
            uploadedBy.name,
            'trainer',
            'upload',
            'material',
            newMaterial.id,
            title,
            courseId,
            courseName,
            `Uploaded ${type} material to ${moduleName}`
        );

        res.json({ success: true, message: 'Material uploaded successfully', material: newMaterial });
    } catch (error) {
        console.error('Error uploading material:', error);
        res.status(500).json({ success: false, error: 'Failed to upload material' });
    }
});

// PUT - Update material details
app.put('/api/study-materials/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = fs.readFileSync(studyMaterialsPath, 'utf8');
        const materialsData = JSON.parse(data);

        const index = materialsData.materials.findIndex(m => m.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Material not found' });
        }

        materialsData.materials[index] = {
            ...materialsData.materials[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(studyMaterialsPath, JSON.stringify(materialsData, null, 2));

        res.json({ success: true, message: 'Material updated successfully', material: materialsData.materials[index] });
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ success: false, error: 'Failed to update material' });
    }
});

// DELETE - Delete material
app.delete('/api/study-materials/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = fs.readFileSync(studyMaterialsPath, 'utf8');
        const materialsData = JSON.parse(data);

        const material = materialsData.materials.find(m => m.id === id);
        if (!material) {
            return res.status(404).json({ success: false, error: 'Material not found' });
        }

        materialsData.materials = materialsData.materials.filter(m => m.id !== id);
        fs.writeFileSync(studyMaterialsPath, JSON.stringify(materialsData, null, 2));

        // Log activity
        logActivity(
            'admin',
            'Admin',
            'admin',
            'delete',
            'material',
            id,
            material.title,
            material.courseId,
            material.courseName,
            `Deleted ${material.type} material`
        );

        res.json({ success: true, message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ success: false, error: 'Failed to delete material' });
    }
});

// POST - Approve material
app.post('/api/study-materials/:id/approve', (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, adminName } = req.body;

        const data = fs.readFileSync(studyMaterialsPath, 'utf8');
        const materialsData = JSON.parse(data);

        const index = materialsData.materials.findIndex(m => m.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Material not found' });
        }

        materialsData.materials[index].status = 'approved';
        materialsData.materials[index].approvedBy = adminId;
        materialsData.materials[index].approvalDate = new Date().toISOString();

        fs.writeFileSync(studyMaterialsPath, JSON.stringify(materialsData, null, 2));

        // Log activity
        const material = materialsData.materials[index];
        logActivity(
            adminId,
            adminName || 'Admin',
            'admin',
            'approve',
            'material',
            id,
            material.title,
            material.courseId,
            material.courseName,
            `Approved ${material.type} material`
        );

        res.json({ success: true, message: 'Material approved successfully', material: materialsData.materials[index] });
    } catch (error) {
        console.error('Error approving material:', error);
        res.status(500).json({ success: false, error: 'Failed to approve material' });
    }
});

// POST - Reject material
app.post('/api/study-materials/:id/reject', (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, adminName, reason } = req.body;

        const data = fs.readFileSync(studyMaterialsPath, 'utf8');
        const materialsData = JSON.parse(data);

        const index = materialsData.materials.findIndex(m => m.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Material not found' });
        }

        materialsData.materials[index].status = 'rejected';
        materialsData.materials[index].rejectedBy = adminId;
        materialsData.materials[index].rejectionDate = new Date().toISOString();
        materialsData.materials[index].rejectionReason = reason;

        fs.writeFileSync(studyMaterialsPath, JSON.stringify(materialsData, null, 2));

        // Log activity
        const material = materialsData.materials[index];
        logActivity(
            adminId,
            adminName || 'Admin',
            'admin',
            'reject',
            'material',
            id,
            material.title,
            material.courseId,
            material.courseName,
            `Rejected ${material.type} material: ${reason}`
        );

        res.json({ success: true, message: 'Material rejected', material: materialsData.materials[index] });
    } catch (error) {
        console.error('Error rejecting material:', error);
        res.status(500).json({ success: false, error: 'Failed to reject material' });
    }
});

// POST - Track material download
app.post('/api/study-materials/:id/download', (req, res) => {
    try {
        const { id } = req.params;
        const { studentId, studentName } = req.body;

        const data = fs.readFileSync(studyMaterialsPath, 'utf8');
        const materialsData = JSON.parse(data);

        const index = materialsData.materials.findIndex(m => m.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Material not found' });
        }

        materialsData.materials[index].downloads = (materialsData.materials[index].downloads || 0) + 1;
        fs.writeFileSync(studyMaterialsPath, JSON.stringify(materialsData, null, 2));

        // Log activity
        const material = materialsData.materials[index];
        logActivity(
            studentId,
            studentName || 'Student',
            'student',
            'download',
            'material',
            id,
            material.title,
            material.courseId,
            material.courseName,
            `Downloaded ${material.type} material`
        );

        res.json({
            success: true,
            message: 'Download tracked',
            downloadUrl: material.filePath
        });
    } catch (error) {
        console.error('Error tracking download:', error);
        res.status(500).json({ success: false, error: 'Failed to track download' });
    }
});

// ====================
// COURSES ROUTES
// ====================

// GET - Retrieve all courses
app.get('/api/courses', (req, res) => {
    try {
        const { studentId } = req.query;
        const data = fs.readFileSync(coursesPath, 'utf8');
        let courses = JSON.parse(data).courses;

        // Filter by student registration
        if (studentId) {
            const studentsPath = path.join(__dirname, 'students.json');
            if (fs.existsSync(studentsPath)) {
                const studentsData = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
                const student = studentsData.students.find(s => s.id === studentId);
                if (student && student.courses) {
                    courses = courses.filter(course =>
                        student.courses.some(sc =>
                            sc.toLowerCase().includes(course.name.toLowerCase()) ||
                            course.name.toLowerCase().includes(sc.toLowerCase())
                        )
                    );
                }
            }
        }

        res.json({ success: true, courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch courses' });
    }
});

// GET - Retrieve single course
app.get('/api/courses/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = fs.readFileSync(coursesPath, 'utf8');
        const courses = JSON.parse(data).courses;

        const course = courses.find(c => c.id === id);
        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }

        // Get modules for this course
        const modulesData = fs.readFileSync(modulesPath, 'utf8');
        const modules = JSON.parse(modulesData).modules.filter(m => m.courseId === id);

        res.json({ success: true, course: { ...course, modules } });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch course' });
    }
});

// ====================
// MODULES ROUTES
// ====================

// GET - Retrieve all modules
app.get('/api/modules', (req, res) => {
    try {
        const { courseId } = req.query;
        const data = fs.readFileSync(modulesPath, 'utf8');
        let modules = JSON.parse(data).modules;

        if (courseId) {
            modules = modules.filter(m => m.courseId === courseId);
        }

        res.json({ success: true, modules });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch modules' });
    }
});

// ====================
// ACTIVITY LOGS ROUTES
// ====================

// GET - Retrieve activity logs
app.get('/api/activity-logs', (req, res) => {
    try {
        const { userType, action, courseId, startDate, endDate } = req.query;

        let logsData = { logs: [] };
        if (fs.existsSync(activityLogsPath)) {
            logsData = JSON.parse(fs.readFileSync(activityLogsPath, 'utf8'));
        }

        let logs = logsData.logs;

        // Apply filters
        if (userType) {
            logs = logs.filter(l => l.userType === userType);
        }
        if (action) {
            logs = logs.filter(l => l.action === action);
        }
        if (courseId) {
            logs = logs.filter(l => l.courseId === courseId);
        }
        if (startDate) {
            logs = logs.filter(l => new Date(l.timestamp) >= new Date(startDate));
        }
        if (endDate) {
            logs = logs.filter(l => new Date(l.timestamp) <= new Date(endDate));
        }

        res.json({ success: true, logs });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
    }
});

// ====================
// ANALYTICS ROUTES
// ====================

// GET - Dashboard analytics
app.get('/api/analytics/dashboard', (req, res) => {
    try {
        const materialsData = JSON.parse(fs.readFileSync(studyMaterialsPath, 'utf8'));
        const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

        const totalMaterials = materialsData.materials.length;
        const pendingApprovals = materialsData.materials.filter(m => m.status === 'pending').length;
        const totalDownloads = materialsData.materials.reduce((sum, m) => sum + (m.downloads || 0), 0);

        // Materials by course
        const materialsByCourse = {};
        materialsData.materials.forEach(m => {
            if (m.status === 'approved') {
                materialsByCourse[m.courseName] = (materialsByCourse[m.courseName] || 0) + 1;
            }
        });

        res.json({
            success: true,
            stats: {
                totalMaterials,
                pendingApprovals,
                totalDownloads,
                activeTrainers: 3
            },
            charts: {
                materialsByCourse
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
});

// Load Trainer Management API
require('./trainer-api')(app);

// ============================================
// AI LEARNING PATHS API
// ============================================
const aiLearningMainConfigPath = path.join(__dirname, 'ai-learning-config.json');
const aiEnrollmentsPath = path.join(__dirname, 'ai-enrollments.json');

// Helper function to read AI Learning config
function readAILearningConfig() {
    try {
        if (fs.existsSync(aiLearningMainConfigPath)) {
            return JSON.parse(fs.readFileSync(aiLearningMainConfigPath, 'utf8'));
        }
        return null;
    } catch (error) {
        console.error('Error reading AI Learning config:', error);
        return null;
    }
}

// Helper function to write AI Learning config
function writeAILearningConfig(data) {
    try {
        fs.writeFileSync(aiLearningMainConfigPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing AI Learning config:', error);
        return false;
    }
}

// Helper function to read enrollments
function readAIEnrollments() {
    try {
        if (fs.existsSync(aiEnrollmentsPath)) {
            return JSON.parse(fs.readFileSync(aiEnrollmentsPath, 'utf8'));
        }
        return { enrollments: [] };
    } catch (error) {
        console.error('Error reading AI enrollments:', error);
        return { enrollments: [] };
    }
}

// Helper function to write enrollments
function writeAIEnrollments(data) {
    try {
        fs.writeFileSync(aiEnrollmentsPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing AI enrollments:', error);
        return false;
    }
}

// GET - Get all AI Learning configuration
app.get('/api/ai-learning/config', (req, res) => {
    try {
        const config = readAILearningConfig();
        if (config) {
            res.json({ success: true, config });
        } else {
            res.status(404).json({ success: false, error: 'Configuration not found' });
        }
    } catch (error) {
        console.error('Error fetching AI Learning config:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
    }
});

// GET - Get specific content (tech/nontech + overview/career/upskilling/modular)
app.get('/api/ai-learning/:type/:mode', (req, res) => {
    try {
        const { type, mode } = req.params;
        const config = readAILearningConfig();

        if (!config) {
            return res.status(404).json({ success: false, error: 'Configuration not found' });
        }

        if (!config[type]) {
            return res.status(404).json({ success: false, error: `Type '${type}' not found` });
        }

        if (!config[type][mode]) {
            return res.status(404).json({ success: false, error: `Mode '${mode}' not found` });
        }

        res.json({
            success: true,
            data: config[type][mode],
            overview: config[type].overview // Always include overview for context
        });
    } catch (error) {
        console.error('Error fetching AI Learning content:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch content' });
    }
});

// PUT - Update specific content
app.put('/api/ai-learning/:type/:mode', (req, res) => {
    try {
        const { type, mode } = req.params;
        const updateData = req.body;

        const config = readAILearningConfig();
        if (!config) {
            return res.status(404).json({ success: false, error: 'Configuration not found' });
        }

        if (!config[type]) {
            return res.status(404).json({ success: false, error: `Type '${type}' not found` });
        }

        // Update the specific mode data
        config[type][mode] = { ...config[type][mode], ...updateData };

        if (writeAILearningConfig(config)) {
            res.json({ success: true, message: 'Content updated successfully', data: config[type][mode] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save configuration' });
        }
    } catch (error) {
        console.error('Error updating AI Learning content:', error);
        res.status(500).json({ success: false, error: 'Failed to update content' });
    }
});

// POST - Add new program/course/module
app.post('/api/ai-learning/:type/:mode/items', (req, res) => {
    try {
        const { type, mode } = req.params;
        const newItem = req.body;

        const config = readAILearningConfig();
        if (!config) {
            return res.status(404).json({ success: false, error: 'Configuration not found' });
        }

        if (!config[type] || !config[type][mode]) {
            return res.status(404).json({ success: false, error: 'Invalid type or mode' });
        }

        // Generate ID if not provided
        if (!newItem.id) {
            newItem.id = `${type}-${mode}-${Date.now()}`;
        }

        // Add enrollment count if not present
        if (!newItem.enrollmentCount) {
            newItem.enrollmentCount = 0;
        }

        // Determine the array name based on mode
        let arrayName;
        if (mode === 'career') arrayName = 'programs';
        else if (mode === 'upskilling') arrayName = 'courses';
        else if (mode === 'modular') arrayName = 'modules';

        if (!config[type][mode][arrayName]) {
            config[type][mode][arrayName] = [];
        }

        config[type][mode][arrayName].push(newItem);

        if (writeAILearningConfig(config)) {
            res.json({ success: true, message: 'Item added successfully', item: newItem });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save item' });
        }
    } catch (error) {
        console.error('Error adding AI Learning item:', error);
        res.status(500).json({ success: false, error: 'Failed to add item' });
    }
});

// DELETE - Delete program/course/module
app.delete('/api/ai-learning/:type/:mode/items/:id', (req, res) => {
    try {
        const { type, mode, id } = req.params;

        const config = readAILearningConfig();
        if (!config) {
            return res.status(404).json({ success: false, error: 'Configuration not found' });
        }

        if (!config[type] || !config[type][mode]) {
            return res.status(404).json({ success: false, error: 'Invalid type or mode' });
        }

        // Determine the array name
        let arrayName;
        if (mode === 'career') arrayName = 'programs';
        else if (mode === 'upskilling') arrayName = 'courses';
        else if (mode === 'modular') arrayName = 'modules';

        const items = config[type][mode][arrayName];
        const index = items.findIndex(item => item.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        items.splice(index, 1);

        if (writeAILearningConfig(config)) {
            res.json({ success: true, message: 'Item deleted successfully' });
        } else {
            res.status(500).json({ success: false, error: 'Failed to delete item' });
        }
    } catch (error) {
        console.error('Error deleting AI Learning item:', error);
        res.status(500).json({ success: false, error: 'Failed to delete item' });
    }
});

// POST - Enroll in program
app.post('/api/ai-learning/enroll', (req, res) => {
    try {
        const { userId, userName, userEmail, type, mode, itemId, itemTitle, price } = req.body;

        const enrollments = readAIEnrollments();

        const newEnrollment = {
            id: `enroll_${Date.now()}`,
            userId,
            userName,
            userEmail,
            type,
            mode,
            itemId,
            itemTitle,
            price,
            enrollmentDate: new Date().toISOString(),
            status: 'active',
            progress: 0
        };

        enrollments.enrollments.push(newEnrollment);

        if (writeAIEnrollments(enrollments)) {
            // Update enrollment count in config
            const config = readAILearningConfig();
            if (config && config[type] && config[type][mode]) {
                let arrayName;
                if (mode === 'career') arrayName = 'programs';
                else if (mode === 'upskilling') arrayName = 'courses';
                else if (mode === 'modular') arrayName = 'modules';

                const item = config[type][mode][arrayName].find(i => i.id === itemId);
                if (item) {
                    item.enrollmentCount = (item.enrollmentCount || 0) + 1;
                    writeAILearningConfig(config);
                }
            }

            res.json({ success: true, message: 'Enrollment successful', enrollment: newEnrollment });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save enrollment' });
        }
    } catch (error) {
        console.error('Error enrolling:', error);
        res.status(500).json({ success: false, error: 'Failed to enroll' });
    }
});

// GET - Get user enrollments
app.get('/api/ai-learning/enrollments/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const enrollments = readAIEnrollments();

        const userEnrollments = enrollments.enrollments.filter(e => e.userId === userId);

        res.json({ success: true, enrollments: userEnrollments });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch enrollments' });
    }
});

// GET - Get all enrollments (Admin)
app.get('/api/ai-learning/enrollments', (req, res) => {
    try {
        const enrollments = readAIEnrollments();
        res.json({ success: true, enrollments: enrollments.enrollments });
    } catch (error) {
        console.error('Error fetching all enrollments:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch enrollments' });
    }
});

// GET - Analytics (Admin)
app.get('/api/ai-learning/analytics', (req, res) => {
    try {
        const config = readAILearningConfig();
        const enrollments = readAIEnrollments();

        if (!config) {
            return res.status(404).json({ success: false, error: 'Configuration not found' });
        }

        // Calculate analytics
        const totalEnrollments = enrollments.enrollments.length;
        const activeEnrollments = enrollments.enrollments.filter(e => e.status === 'active').length;
        const totalRevenue = enrollments.enrollments.reduce((sum, e) => sum + (e.price || 0), 0);

        // Enrollments by type
        const techEnrollments = enrollments.enrollments.filter(e => e.type === 'tech').length;
        const nontechEnrollments = enrollments.enrollments.filter(e => e.type === 'nontech').length;

        // Enrollments by mode
        const careerEnrollments = enrollments.enrollments.filter(e => e.mode === 'career').length;
        const upskillingEnrollments = enrollments.enrollments.filter(e => e.mode === 'upskilling').length;
        const modularEnrollments = enrollments.enrollments.filter(e => e.mode === 'modular').length;

        // Popular programs
        const programCounts = {};
        enrollments.enrollments.forEach(e => {
            programCounts[e.itemId] = (programCounts[e.itemId] || 0) + 1;
        });

        const popularPrograms = Object.entries(programCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => ({ id, count }));

        res.json({
            success: true,
            analytics: {
                totalEnrollments,
                activeEnrollments,
                totalRevenue,
                byType: {
                    tech: techEnrollments,
                    nontech: nontechEnrollments
                },
                byMode: {
                    career: careerEnrollments,
                    upskilling: upskillingEnrollments,
                    modular: modularEnrollments
                },
                popularPrograms
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
});

// ==================== CYBERSECURITY CONFIG ENDPOINTS ====================

// Helper functions for Cybersecurity config
function readCybersecurityConfig() {
    const configPath = path.join(__dirname, 'cybersecurity-config.json');
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { career: [], upskilling: [], modular: [] };
}

function writeCybersecurityConfig(config) {
    const configPath = path.join(__dirname, 'cybersecurity-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// GET - Fetch Cybersecurity configuration
app.get('/api/cybersecurity-config', (req, res) => {
    try {
        const config = readCybersecurityConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error reading cybersecurity config:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
    }
});

// POST - Update Cybersecurity configuration
app.post('/api/cybersecurity-config', (req, res) => {
    try {
        const { config } = req.body;
        writeCybersecurityConfig(config);
        res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating cybersecurity config:', error);
        res.status(500).json({ success: false, error: 'Failed to update configuration' });
    }
});

// ==================== NETWORKING CONFIG ENDPOINTS ====================

// Helper functions for Networking config
function readNetworkingConfig() {
    const configPath = path.join(__dirname, 'networking-config.json');
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { career: [], upskilling: [], modular: [] };
}

function writeNetworkingConfig(config) {
    const configPath = path.join(__dirname, 'networking-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// GET - Fetch Networking configuration
app.get('/api/networking-config', (req, res) => {
    try {
        const config = readNetworkingConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error reading networking config:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
    }
});

// POST - Update Networking configuration
app.post('/api/networking-config', (req, res) => {
    try {
        const { config } = req.body;
        writeNetworkingConfig(config);
        res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating networking config:', error);
        res.status(500).json({ success: false, error: 'Failed to update configuration' });
    }
});

// ============================================
// Cloud Computing Configuration Routes
// ============================================

function readCloudComputingConfig() {
    const configPath = path.join(__dirname, 'cloud-computing-config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function writeCloudComputingConfig(config) {
    const configPath = path.join(__dirname, 'cloud-computing-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}

app.get('/api/cloud-computing-config', (req, res) => {
    try {
        const config = readCloudComputingConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error reading cloud computing config:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
    }
});

app.post('/api/cloud-computing-config', (req, res) => {
    try {
        const { config } = req.body;
        writeCloudComputingConfig(config);
        res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating cloud computing config:', error);
        res.status(500).json({ success: false, error: 'Failed to update configuration' });
    }
});

// ============================================
// Java Full Stack Configuration Routes
// ============================================

function readJavaFullStackConfig() {
    const configPath = path.join(__dirname, 'java-full-stack-config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function writeJavaFullStackConfig(config) {
    const configPath = path.join(__dirname, 'java-full-stack-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}

app.get('/api/java-full-stack-config', (req, res) => {
    try {
        const config = readJavaFullStackConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error reading java full stack config:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
    }
});

app.post('/api/java-full-stack-config', (req, res) => {
    try {
        const { config } = req.body;
        writeJavaFullStackConfig(config);
        res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating java full stack config:', error);
        res.status(500).json({ success: false, error: 'Failed to update configuration' });
    }
});

// ============================================
// Python Full Stack Configuration Routes
// ============================================

function readPythonFullStackConfig() {
    const configPath = path.join(__dirname, 'python-full-stack-config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function writePythonFullStackConfig(config) {
    const configPath = path.join(__dirname, 'python-full-stack-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}

app.get('/api/python-full-stack-config', (req, res) => {
    try {
        const config = readPythonFullStackConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error reading python full stack config:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
    }
});

app.post('/api/python-full-stack-config', (req, res) => {
    try {
        const { config } = req.body;
        writePythonFullStackConfig(config);
        res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating python full stack config:', error);
        res.status(500).json({ success: false, error: 'Failed to update configuration' });
    }
});

// ========================
// HOMEPAGE CONFIG ROUTES
// ========================

const homepageConfigPath = path.join(__dirname, 'homepage-config.json');

// GET - Retrieve homepage configuration
app.get('/api/homepage-config', (req, res) => {
    try {
        if (!fs.existsSync(homepageConfigPath)) {
            return res.status(404).json({
                success: false,
                message: 'Homepage configuration file not found'
            });
        }

        const data = fs.readFileSync(homepageConfigPath, 'utf8');
        const config = JSON.parse(data);

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error reading homepage config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read homepage configuration'
        });
    }
});

// POST - Save homepage configuration
app.post('/api/homepage-config', (req, res) => {
    try {
        const updatedConfig = req.body;

        // Write to file
        fs.writeFileSync(
            homepageConfigPath,
            JSON.stringify(updatedConfig, null, 2),
            'utf8'
        );

        res.json({
            success: true,
            message: 'Homepage configuration saved successfully'
        });
    } catch (error) {
        console.error('Error saving homepage config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save homepage configuration'
        });
    }
});

// ========================
// ONBOARDING CONFIG ROUTES
// ========================

const onboardingConfigPath = path.join(__dirname, 'onboarding-config.json');

// GET - Retrieve onboarding configuration
app.get('/api/onboarding-config', (req, res) => {
    try {
        if (!fs.existsSync(onboardingConfigPath)) {
            return res.status(404).json({
                success: false,
                message: 'Onboarding configuration file not found'
            });
        }

        const data = fs.readFileSync(onboardingConfigPath, 'utf8');
        const config = JSON.parse(data);

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error reading onboarding config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read onboarding configuration'
        });
    }
});

// POST - Save onboarding configuration
app.post('/api/onboarding-config', (req, res) => {
    try {
        const updatedConfig = req.body;

        // Write to file
        fs.writeFileSync(
            onboardingConfigPath,
            JSON.stringify(updatedConfig, null, 2),
            'utf8'
        );

        res.json({
            success: true,
            message: 'Onboarding configuration saved successfully'
        });
    } catch (error) {
        console.error('Error saving onboarding config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save onboarding configuration'
        });
    }
});

// ===============================
// DETAILED BATCH API ENDPOINTS
// ===============================

// Helper to update specific section of config
function updateConfigSection(pageId, sectionKey, sectionData) {
    const config = readConfig(pageId);
    if (!config) return false;

    config[sectionKey] = sectionData;
    return writeConfig(pageId, config);
}

// PUT - Update Detailed Batches for Online
app.put('/api/online-config/detailed-batches', (req, res) => {
    try {
        const { batchesDetailed } = req.body;
        if (!batchesDetailed) {
            return res.status(400).json({ success: false, message: 'batchesDetailed is required' });
        }

        if (updateConfigSection('online', 'batchesDetailed', batchesDetailed)) {
            res.json({ success: true, message: 'Detailed batches updated successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update config' });
        }
    } catch (error) {
        console.error('Error updating online batches:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT - Update Detailed Batches for Offline
app.put('/api/offline-config/detailed-batches', (req, res) => {
    try {
        const { batchesDetailed } = req.body;
        if (!batchesDetailed) {
            return res.status(400).json({ success: false, message: 'batchesDetailed is required' });
        }

        // Ensure offline path key is mapped correctly (I used 'offline' in configPaths)
        // I need to check where offline config is read. I'll use the helper if I can add 'offline' to configPaths if not there
        // Line 209: const offlineConfigPath = path.join(__dirname, 'config-offline.json');
        // I should probably update configPaths in my mental model or explicit usage.
        // Let's just read/write manually for safety to match existing patterns if updateConfigSection fails.
        // Wait, line 200 `configPaths` definitely has 'online'. It didn't explicitly show 'offline' in my view but line 204 ended with online.
        // I'll assume I can use `readConfig` if I update `configPaths` or I'll just use the paths directly.

        // Direct file access for safety as I am not 100% sure of 'configPaths' content for offline/hybrid
        let config = {};
        if (fs.existsSync(offlineConfigPath)) {
            config = JSON.parse(fs.readFileSync(offlineConfigPath, 'utf8'));
        }

        config.batchesDetailed = batchesDetailed;
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));

        res.json({ success: true, message: 'Detailed batches updated successfully' });
    } catch (error) {
        console.error('Error updating offline batches:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT - Update Detailed Batches for Hybrid
app.put('/api/hybrid-config/detailed-batches', (req, res) => {
    try {
        const { batchesDetailed } = req.body;
        if (!batchesDetailed) {
            return res.status(400).json({ success: false, message: 'batchesDetailed is required' });
        }

        let config = {};
        if (fs.existsSync(hybridConfigPath)) {
            config = JSON.parse(fs.readFileSync(hybridConfigPath, 'utf8'));
        }

        config.batchesDetailed = batchesDetailed;
        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));

        res.json({ success: true, message: 'Detailed batches updated successfully' });
    } catch (error) {
        console.error('Error updating hybrid batches:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET - Offline Config (If not already defined)
app.get('/api/offline-config', (req, res) => {
    try {
        if (fs.existsSync(offlineConfigPath)) {
            const data = fs.readFileSync(offlineConfigPath, 'utf8');
            res.json({ success: true, data: JSON.parse(data) });
        } else {
            res.status(404).json({ success: false, message: 'Config not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET - Hybrid Config (If not already defined)
app.get('/api/hybrid-config', (req, res) => {
    try {
        if (fs.existsSync(hybridConfigPath)) {
            const data = fs.readFileSync(hybridConfigPath, 'utf8');
            res.json({ success: true, data: JSON.parse(data) });
        } else {
            res.status(404).json({ success: false, message: 'Config not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 404 Handler - Returns JSON instead of HTML
app.use((req, res) => {
    console.warn(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        message: 'ROUTE_NOT_FOUND',
        path: req.path,
        method: req.method,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`╔════════════════════════════════════════════════════════╗`);
    console.log(`║   Tech-Pro AI Backend Server                           ║`);
    console.log(`║   Port: ${PORT}                                           ║`);
    console.log(`╠════════════════════════════════════════════════════════╣`);
    console.log(`║   APIs: users, payment, ailearning, online, offline   ║`);
    console.log(`║         hybrid, aicc, assignments, trainers, health   ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
});
