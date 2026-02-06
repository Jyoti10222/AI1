const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const emailConfig = require('./email-config');

// Email Setup for Routes
let transporter = null;
if (emailConfig && emailConfig.email && emailConfig.email.auth) {
    transporter = nodemailer.createTransport({
        service: emailConfig.email.service,
        auth: {
            user: emailConfig.email.auth.user,
            pass: emailConfig.email.auth.pass
        }
    });
}

// File Paths
const counselorBookingsPath = path.join(__dirname, 'counsellor-bookings.json');
const counselorsPath = path.join(__dirname, 'counselors.json');

// Ensure files exist
if (!fs.existsSync(counselorBookingsPath)) {
    fs.writeFileSync(counselorBookingsPath, JSON.stringify({ bookings: [] }));
}
if (!fs.existsSync(counselorsPath)) {
    fs.writeFileSync(counselorsPath, JSON.stringify([]));
}

// ===========================
// COUNSELOR PROFILE ROUTES
// ===========================

// GET - Retrieve all counselors
router.get('/counselors', (req, res) => {
    try {
        const data = fs.readFileSync(counselorsPath, 'utf8');
        const counselorsData = JSON.parse(data);
        res.json({ success: true, source: 'counsellor-routes', data: counselorsData.counselors || [] });
    } catch (error) {
        console.error('Error reading counselors:', error);
        res.status(500).json({ success: false, message: 'Failed to read counselors' });
    }
});

// POST - Add a new counselor
router.post('/counselors', (req, res) => {
    try {
        const data = fs.readFileSync(counselorsPath, 'utf8');
        const counselorsData = JSON.parse(data);

        const newCounselor = {
            id: crypto.randomBytes(8).toString('hex'),
            ...req.body,
            createdAt: new Date().toISOString()
        };

        if (!counselorsData.counselors) counselorsData.counselors = [];
        counselorsData.counselors.push(newCounselor);
        fs.writeFileSync(counselorsPath, JSON.stringify(counselorsData, null, 2));

        res.json({ success: true, message: 'Counselor added', data: newCounselor });
    } catch (error) {
        console.error('Error adding counselor:', error);
        res.status(500).json({ success: false, message: 'Failed to add counselor' });
    }
});

// DELETE - Remove a counselor
router.delete('/counselors/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = fs.readFileSync(counselorsPath, 'utf8');
        let counselorsData = JSON.parse(data);

        if (!counselorsData.counselors) counselorsData.counselors = [];
        const initialLength = counselorsData.counselors.length;
        counselorsData.counselors = counselorsData.counselors.filter(c => c.id !== id);

        if (counselorsData.counselors.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Counselor not found' });
        }

        fs.writeFileSync(counselorsPath, JSON.stringify(counselorsData, null, 2));
        res.json({ success: true, message: 'Counselor deleted' });
    } catch (error) {
        console.error('Error deleting counselor:', error);
        res.status(500).json({ success: false, message: 'Failed to delete counselor' });
    }
});

// ===========================
// BOOKING ROUTES
// ===========================

// GET - Retrieve all bookings
router.get('/counsellor-bookings', (req, res) => {
    try {
        const data = fs.readFileSync(counselorBookingsPath, 'utf8');
        const bookingsData = JSON.parse(data);
        res.json({ success: true, data: bookingsData.bookings || [] });
    } catch (error) {
        console.error('Error reading bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to read bookings' });
    }
});


// POST - Submit a new booking with AUTO-ASSIGNMENT for offline
router.post('/counsellor-bookings', async (req, res) => {
    try {
        const { name, email, phone, course, notes, selectedDate, selectedTime, mode, preferredCounselor, submittedAt } = req.body;

        const data = fs.readFileSync(counselorBookingsPath, 'utf8');
        const bookingsData = JSON.parse(data);

        const newBooking = {
            id: crypto.randomBytes(16).toString('hex'),
            name,
            email,
            phone,
            course,
            notes: notes || '',
            selectedDate,
            selectedTime,
            mode, // 'online' or 'offline'
            preferredCounselor,
            submittedAt: submittedAt || new Date().toISOString(),
            status: 'pending',
            assignedCounselor: null,
            meetingLink: null,
            locationAddress: null,
            adminNotes: null
        };

        // AUTO-ASSIGN COUNSELOR FOR OFFLINE BOOKINGS
        if (mode === 'offline') {
            try {
                // Load counselors
                const cData = fs.readFileSync(counselorsPath, 'utf8');
                const counselorsData = JSON.parse(cData);
                const allCounselors = counselorsData.counselors || [];

                // Filter counselors who can handle offline mode
                const availableCounselors = allCounselors.filter(c =>
                    c.mode === 'offline' || c.mode === 'both'
                );

                if (availableCounselors.length > 0) {
                    // Calculate workload for each counselor
                    const workloadMap = {};
                    availableCounselors.forEach(c => {
                        workloadMap[c.name] = 0;
                    });

                    // Count current assignments
                    bookingsData.bookings.forEach(b => {
                        if (b.assignedCounselor && workloadMap.hasOwnProperty(b.assignedCounselor)) {
                            workloadMap[b.assignedCounselor]++;
                        }
                    });

                    // Find counselor with minimum workload
                    let minWorkload = Infinity;
                    let selectedCounselor = null;

                    for (const [counselorName, workload] of Object.entries(workloadMap)) {
                        if (workload < minWorkload) {
                            minWorkload = workload;
                            selectedCounselor = counselorName;
                        }
                    }

                    if (selectedCounselor) {
                        // Auto-assign the counselor
                        newBooking.assignedCounselor = selectedCounselor;
                        newBooking.status = 'Confirmed';
                        newBooking.assignedAt = new Date().toISOString();

                        console.log(`✅ AUTO-ASSIGNED: ${selectedCounselor} (Workload: ${minWorkload}) for offline booking`);

                        // Send email notifications
                        if (transporter) {
                            const counselor = availableCounselors.find(c => c.name === selectedCounselor);

                            // Email to student
                            console.log(`📧 Sending confirmation email to STUDENT: ${email}`);
                            transporter.sendMail({
                                from: '"Tech-Pro AI" <techproai.noreply@gmail.com>',
                                to: email,
                                subject: 'Counseling Session Confirmed ✅',
                                text: `Hello ${name},\n\nYour in-person counseling session for ${course} has been confirmed!\n\nCounselor: ${selectedCounselor}\nDate: ${selectedDate}\nTime: ${selectedTime}\nMode: In-Person\n\nYour counselor will contact you soon with the location details.\n\nThank you!`
                            }).catch(err => console.error('Student Email Error:', err));

                            // Email to counselor
                            if (counselor && counselor.email) {
                                console.log(`📧 Sending assignment email to COUNSELOR: ${counselor.email}`);
                                transporter.sendMail({
                                    from: '"Tech-Pro AI" <techproai.noreply@gmail.com>',
                                    to: counselor.email,
                                    subject: 'New Counseling Session Assigned 📅',
                                    text: `Hello ${selectedCounselor},\n\nYou have been automatically assigned a new in-person counseling session.\n\nStudent: ${name}\nEmail: ${email}\nPhone: ${phone}\nCourse: ${course}\nDate: ${selectedDate}\nTime: ${selectedTime}\nMode: In-Person\n\nPlease contact the student to arrange the meeting location.\n\nThank you!`
                                }).catch(err => console.error('Counselor Email Error:', err));
                            }
                        }
                    } else {
                        console.log('⚠️ No available counselor found for auto-assignment');
                    }
                } else {
                    console.log('⚠️ No offline counselors available for auto-assignment');
                }
            } catch (autoAssignError) {
                console.error('Error during auto-assignment:', autoAssignError);
                // Continue with booking creation even if auto-assignment fails
            }
        }

        bookingsData.bookings.push(newBooking);
        fs.writeFileSync(counselorBookingsPath, JSON.stringify(bookingsData, null, 2));

        res.json({ success: true, message: 'Booking submitted successfully', data: newBooking });
    } catch (error) {
        console.error('Error submitting booking:', error);
        res.status(500).json({ success: false, message: 'Failed to submit booking' });
    }
});


// POST - Assign/Update booking
router.post('/counsellor-bookings/assign', (req, res) => {
    try {
        const { bookingId, counselor, meetingLink, locationAddress, notes } = req.body;
        const data = fs.readFileSync(counselorBookingsPath, 'utf8');
        const bookingsData = JSON.parse(data);

        const index = bookingsData.bookings.findIndex(b => b.id === bookingId);
        if (index === -1) return res.status(404).json({ success: false, message: 'Booking not found' });

        bookingsData.bookings[index] = {
            ...bookingsData.bookings[index],
            status: 'assigned',
            assignedCounselor: counselor,
            meetingLink: meetingLink || null,
            locationAddress: locationAddress || null,
            adminNotes: notes || null,
            assignedAt: new Date().toISOString()
        };

        fs.writeFileSync(counselorBookingsPath, JSON.stringify(bookingsData, null, 2));

        // Note: Email logic removed to keep this file clean. Import transporter if needed.

        res.json({ success: true, message: 'Counselor assigned', data: bookingsData.bookings[index] });
    } catch (error) {
        console.error('Error assigning:', error);
        res.status(500).json({ success: false, message: 'Failed to assign' });
    }
});

// PUT - Assign/Approve Counselor
router.put('/counsellor-bookings/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { counselorName, status } = req.body;

        const data = fs.readFileSync(counselorBookingsPath, 'utf8');
        let bookingsData = JSON.parse(data);

        const bookingIndex = bookingsData.bookings.findIndex(b => b.id === id);
        if (bookingIndex === -1) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const booking = bookingsData.bookings[bookingIndex];

        // Find counselor details for email
        const cData = fs.readFileSync(counselorsPath, 'utf8');
        const counselors = JSON.parse(cData).counselors || [];
        const counselor = counselors.find(c => c.name === counselorName);
        const counselorEmail = counselor ? counselor.email : null;

        // Update booking
        bookingsData.bookings[bookingIndex].assignedCounselor = counselorName;
        bookingsData.bookings[bookingIndex].status = status || 'Confirmed';

        fs.writeFileSync(counselorBookingsPath, JSON.stringify(bookingsData, null, 2));

        // Send Emails
        if (transporter) {
            console.log(`📧 Sending confirmation email to STUDENT: ${booking.email}`);
            transporter.sendMail({
                from: '"Tech-Pro AI" <techproai.noreply@gmail.com>',
                to: booking.email,
                subject: 'Counseling Session Confirmed ✅',
                text: `Hello ${booking.name},\n\nYour counseling session for ${booking.course} has been confirmed with ${counselorName}.\n\nDate: ${booking.selectedDate}\nTime: ${booking.selectedTime}\nMode: ${booking.mode}\n\nThank you!`
            }).catch(err => console.error('Student Email Error:', err));

            if (counselorEmail) {
                console.log(`📧 Sending confirmation email to COUNSELOR: ${counselorEmail}`);
                transporter.sendMail({
                    from: '"Tech-Pro AI" <techproai.noreply@gmail.com>',
                    to: counselorEmail,
                    subject: 'New Counseling Session Assigned 📅',
                    text: `Hello ${counselorName},\n\nYou have been assigned a new counseling session.\n\nStudent: ${booking.name}\nCourse: ${booking.course}\nDate: ${booking.selectedDate}\nTime: ${booking.selectedTime}\nMode: ${booking.mode}\n\nPlease check your dashboard for details.`
                }).catch(err => console.error('Counselor Email Error:', err));
            } else {
                console.warn(`⚠️ No email found for counselor: ${counselorName}`);
            }
        } else {
            console.log('⚠️ Email Transporter not configured. Skipping emails.');
        }

        res.json({ success: true, message: 'Counselor assigned successfully', data: bookingsData.bookings[bookingIndex] });
    } catch (error) {
        console.error('Error assigning counselor:', error);
        res.status(500).json({ success: false, message: 'Failed to assign counselor' });
    }
});

module.exports = router;
