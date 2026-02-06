const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// File paths
const aiQueriesPath = path.join(__dirname, 'ai-queries.json');
const inPersonBookingsPath = path.join(__dirname, 'in-person-bookings.json');
const counselorsPath = path.join(__dirname, 'counselors.json');

// Ensure files exist
if (!fs.existsSync(aiQueriesPath)) {
    fs.writeFileSync(aiQueriesPath, JSON.stringify({ queries: [] }, null, 2));
}
if (!fs.existsSync(inPersonBookingsPath)) {
    fs.writeFileSync(inPersonBookingsPath, JSON.stringify({ bookings: [] }, null, 2));
}

// ===========================
// AI COUNSELING ROUTES
// ===========================

// POST - Submit AI Query
router.post('/ai-queries', (req, res) => {
    try {
        const { name, email, query } = req.body;

        const data = fs.readFileSync(aiQueriesPath, 'utf8');
        const queriesData = JSON.parse(data);

        const newQuery = {
            id: crypto.randomBytes(16).toString('hex'),
            name,
            email,
            query,
            timestamp: new Date().toISOString(),
            status: 'pending',
            response: null
        };

        queriesData.queries.push(newQuery);
        fs.writeFileSync(aiQueriesPath, JSON.stringify(queriesData, null, 2));

        console.log(`📝 New AI Query from ${name}: ${query.substring(0, 50)}...`);

        res.json({ success: true, message: 'Query submitted successfully', data: newQuery });
    } catch (error) {
        console.error('Error submitting AI query:', error);
        res.status(500).json({ success: false, message: 'Failed to submit query' });
    }
});

// GET - Retrieve all AI queries
router.get('/ai-queries', (req, res) => {
    try {
        const data = fs.readFileSync(aiQueriesPath, 'utf8');
        const queriesData = JSON.parse(data);
        res.json({ success: true, data: queriesData.queries });
    } catch (error) {
        console.error('Error reading AI queries:', error);
        res.status(500).json({ success: false, message: 'Failed to read queries' });
    }
});

// ===========================
// IN-PERSON BOOKING ROUTES
// ===========================

// POST - Submit In-Person Booking with Auto-Assignment
router.post('/in-person-bookings', (req, res) => {
    try {
        const { name, email, phone, course, location, selectedDate, selectedTime, notes, mode } = req.body;

        // Read existing bookings
        const bookingsData = JSON.parse(fs.readFileSync(inPersonBookingsPath, 'utf8'));

        // Read counselors
        const counselorsData = JSON.parse(fs.readFileSync(counselorsPath, 'utf8'));
        const counselors = counselorsData.counselors || [];

        // Auto-assign counselor using smart load balancing
        const assignedCounselor = autoAssignCounselor(
            counselors,
            bookingsData.bookings,
            location,
            selectedDate,
            selectedTime,
            mode
        );

        if (!assignedCounselor) {
            return res.status(400).json({
                success: false,
                message: 'No counselors available for the selected time and location'
            });
        }

        const newBooking = {
            id: crypto.randomBytes(16).toString('hex'),
            name,
            email,
            phone,
            course,
            location,
            selectedDate,
            selectedTime,
            notes: notes || '',
            mode,
            assignedCounselor: assignedCounselor.name,
            autoAssigned: true,
            status: 'Confirmed',
            submittedAt: new Date().toISOString()
        };

        bookingsData.bookings.push(newBooking);
        fs.writeFileSync(inPersonBookingsPath, JSON.stringify(bookingsData, null, 2));

        console.log(`✅ Auto-assigned ${name} to ${assignedCounselor.name} (Load: ${assignedCounselor.currentLoad})`);

        res.json({
            success: true,
            message: 'Booking confirmed with auto-assignment',
            data: newBooking,
            assignedCounselor: assignedCounselor.name
        });
    } catch (error) {
        console.error('Error creating in-person booking:', error);
        res.status(500).json({ success: false, message: 'Failed to create booking' });
    }
});

// GET - Retrieve all in-person bookings
router.get('/in-person-bookings', (req, res) => {
    try {
        const data = fs.readFileSync(inPersonBookingsPath, 'utf8');
        const bookingsData = JSON.parse(data);
        res.json({ success: true, data: bookingsData.bookings });
    } catch (error) {
        console.error('Error reading in-person bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to read bookings' });
    }
});

// ===========================
// AUTO-ASSIGNMENT LOGIC
// ===========================

function autoAssignCounselor(counselors, existingBookings, location, date, time, mode) {
    // Filter counselors by mode (online counselors can handle online sessions, offline for in-person)
    let availableCounselors = counselors.filter(c => {
        if (mode === 'online') {
            return c.mode === 'online' || c.mode === 'both';
        } else {
            // For offline, we can add location matching logic here if counselors have location data
            return c.mode === 'offline' || c.mode === 'both';
        }
    });

    if (availableCounselors.length === 0) {
        return null;
    }

    // Count current assignments for each counselor
    const counselorLoads = availableCounselors.map(counselor => {
        const assignmentCount = existingBookings.filter(booking =>
            booking.assignedCounselor === counselor.name &&
            booking.status === 'Confirmed'
        ).length;

        return {
            ...counselor,
            currentLoad: assignmentCount
        };
    });

    // Sort by load (ascending) - counselor with least assignments first
    counselorLoads.sort((a, b) => a.currentLoad - b.currentLoad);

    // Log the assignment decision
    console.log('🔄 Auto-Assignment Analysis:');
    counselorLoads.forEach(c => {
        console.log(`   ${c.name}: ${c.currentLoad} assignments`);
    });

    // Return counselor with minimum load
    return counselorLoads[0];
}

// ===========================
// COUNSELING HUB CONFIG ROUTES
// ===========================

const hubConfigPath = path.join(__dirname, 'counseling-hub-config.json');

// Ensure hub config file exists
if (!fs.existsSync(hubConfigPath)) {
    const defaultConfig = {
        aiCounselor: {
            title: "AI Counseling",
            subtitle: "Instant support, anytime",
            badge: "24/7 Available",
            avatars: [],
            features: [],
            buttonText: "Start AI Session",
            link: "AICounseling.html"
        },
        offlineCounselor: {
            title: "In-Person Counseling",
            subtitle: "Face-to-face support",
            badge: "Certified",
            images: [],
            features: [],
            buttonText: "Book Appointment",
            link: "InPersonCounseling.html"
        }
    };
    fs.writeFileSync(hubConfigPath, JSON.stringify(defaultConfig, null, 2));
}

// GET - Retrieve counseling hub configuration
router.get('/hub-config', (req, res) => {
    try {
        const data = fs.readFileSync(hubConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error reading hub config:', error);
        res.status(500).json({ success: false, message: 'Failed to read configuration' });
    }
});

// POST - Update counseling hub configuration
router.post('/hub-config', (req, res) => {
    try {
        const config = req.body;
        fs.writeFileSync(hubConfigPath, JSON.stringify(config, null, 2));
        console.log('✅ Counseling hub configuration updated');
        res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating hub config:', error);
        res.status(500).json({ success: false, message: 'Failed to update configuration' });
    }
});

module.exports = router;
