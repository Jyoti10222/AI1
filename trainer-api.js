// ============================================================================
// TRAINER MANAGEMENT API ENDPOINTS
// ============================================================================

const fs = require('fs');
const path = require('path');

const trainersPath = path.join(__dirname, 'trainers.json');

// Helper function to read trainers
function readTrainers() {
    try {
        if (fs.existsSync(trainersPath)) {
            const data = fs.readFileSync(trainersPath, 'utf8');
            return JSON.parse(data);
        }
        return { trainers: [], lastUpdated: new Date().toISOString() };
    } catch (error) {
        console.error('Error reading trainers:', error);
        return { trainers: [], lastUpdated: new Date().toISOString() };
    }
}

// Helper function to write trainers
function writeTrainers(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(trainersPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing trainers:', error);
        return false;
    }
}

module.exports = function (app) {
    // POST /api/trainers/apply - Submit trainer application
    app.post('/api/trainers/apply', (req, res) => {
        try {
            const { name, email, phone, bio, experience, qualifications, specializations, profilePicture } = req.body;

            // Validation
            if (!name || !email || !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, and phone are required'
                });
            }

            const data = readTrainers();

            // Check if email already exists
            const existingTrainer = data.trainers.find(t => t.email === email);
            if (existingTrainer) {
                return res.status(400).json({
                    success: false,
                    message: 'A trainer with this email already exists'
                });
            }

            // Create new trainer application
            const newTrainer = {
                id: `TRN-${Date.now()}`,
                name,
                email,
                phone,
                profilePicture: profilePicture || null,
                bio: bio || '',
                experience: experience || '0',
                qualifications: qualifications || '',
                specializations: specializations || { courses: [], topics: {} },
                status: 'pending', // pending, approved, rejected
                appliedAt: new Date().toISOString(),
                reviewedAt: null,
                reviewedBy: null
            };

            data.trainers.push(newTrainer);

            if (writeTrainers(data)) {
                console.log(`✅ New trainer application: ${name} (${email})`);
                res.json({
                    success: true,
                    message: 'Application submitted successfully',
                    trainer: newTrainer
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to save application'
                });
            }
        } catch (error) {
            console.error('Error in trainer application:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    });

    // GET /api/trainers - Get all approved trainers
    app.get('/api/trainers', (req, res) => {
        try {
            const data = readTrainers();
            const approvedTrainers = data.trainers.filter(t => t.status === 'approved');

            res.json({
                success: true,
                trainers: approvedTrainers,
                count: approvedTrainers.length
            });
        } catch (error) {
            console.error('Error fetching trainers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch trainers',
                error: error.message
            });
        }
    });

    // GET /api/trainers/pending - Get pending trainer applications
    app.get('/api/trainers/pending', (req, res) => {
        try {
            const data = readTrainers();
            const pendingTrainers = data.trainers.filter(t => t.status === 'pending');

            res.json({
                success: true,
                trainers: pendingTrainers,
                count: pendingTrainers.length
            });
        } catch (error) {
            console.error('Error fetching pending trainers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending applications',
                error: error.message
            });
        }
    });

    // GET /api/trainers/all - Get all trainers (all statuses) - Admin only
    app.get('/api/trainers/all', (req, res) => {
        try {
            const data = readTrainers();

            res.json({
                success: true,
                trainers: data.trainers,
                count: data.trainers.length,
                stats: {
                    pending: data.trainers.filter(t => t.status === 'pending').length,
                    approved: data.trainers.filter(t => t.status === 'approved').length,
                    rejected: data.trainers.filter(t => t.status === 'rejected').length
                }
            });
        } catch (error) {
            console.error('Error fetching all trainers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch trainers',
                error: error.message
            });
        }
    });

    // POST /api/trainers/add - Admin manually adds trainer
    app.post('/api/trainers/add', (req, res) => {
        try {
            const { name, email, phone, bio, experience, qualifications, specializations, profilePicture } = req.body;

            // Validation
            if (!name || !email || !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, and phone are required'
                });
            }

            const data = readTrainers();

            // Check if email already exists
            const existingTrainer = data.trainers.find(t => t.email === email);
            if (existingTrainer) {
                return res.status(400).json({
                    success: false,
                    message: 'A trainer with this email already exists'
                });
            }

            // Create new trainer (directly approved)
            const newTrainer = {
                id: `TRN-${Date.now()}`,
                name,
                email,
                phone,
                profilePicture: profilePicture || null,
                bio: bio || '',
                experience: experience || '0',
                qualifications: qualifications || '',
                specializations: specializations || { courses: [], topics: {} },
                status: 'approved', // Directly approved when added by admin
                appliedAt: new Date().toISOString(),
                reviewedAt: new Date().toISOString(),
                reviewedBy: 'admin' // Could be passed from frontend
            };

            data.trainers.push(newTrainer);

            if (writeTrainers(data)) {
                console.log(`✅ Admin added trainer: ${name} (${email})`);
                res.json({
                    success: true,
                    message: 'Trainer added successfully',
                    trainer: newTrainer
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to add trainer'
                });
            }
        } catch (error) {
            console.error('Error adding trainer:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    });

    // PUT /api/trainers/:id/approve - Approve trainer application
    app.put('/api/trainers/:id/approve', async (req, res) => {
        try {
            const { id } = req.params;
            const { reviewedBy } = req.body;

            const data = readTrainers();
            const trainerIndex = data.trainers.findIndex(t => t.id === id);

            if (trainerIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Trainer not found'
                });
            }

            // Generate random password (8 characters: letters + numbers)
            const password = Math.random().toString(36).slice(-8) + Math.random().toString(10).slice(-2);

            // Update trainer status
            data.trainers[trainerIndex].status = 'approved';
            data.trainers[trainerIndex].password = password;
            data.trainers[trainerIndex].reviewedAt = new Date().toISOString();
            data.trainers[trainerIndex].reviewedBy = reviewedBy || 'admin';

            if (writeTrainers(data)) {
                console.log(`✅ Trainer approved: ${data.trainers[trainerIndex].name}`);

                // Send email notification
                const trainer = data.trainers[trainerIndex];
                try {
                    // Get email transporter from parent scope (server.js)
                    const nodemailer = require('nodemailer');
                    const emailConfig = require('./email-config');

                    if (emailConfig && emailConfig.email && emailConfig.email.auth) {
                        const transporter = nodemailer.createTransport({
                            service: emailConfig.email.service,
                            auth: {
                                user: emailConfig.email.auth.user,
                                pass: emailConfig.email.auth.pass
                            }
                        });

                        const mailOptions = {
                            from: emailConfig.email.auth.user,
                            to: trainer.email,
                            subject: '🎉 Welcome to TECH-PRO AI - Trainer Application Approved!',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                                    <div style="background: linear-gradient(135deg, #137fec 0%, #0f65bd 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
                                    </div>
                                    
                                    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <h2 style="color: #1f2937; margin-top: 0;">Welcome to TECH-PRO AI, ${trainer.name}!</h2>
                                        
                                        <p style="color: #4b5563; line-height: 1.6;">
                                            We're excited to inform you that your trainer application has been <strong style="color: #10b981;">approved</strong>! 
                                            You are now part of India's leading AI-powered learning platform.
                                        </p>

                                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #137fec;">
                                            <h3 style="color: #1f2937; margin-top: 0;">Your Login Credentials</h3>
                                            <p style="color: #4b5563; margin: 10px 0;"><strong>Email:</strong> ${trainer.email}</p>
                                            <p style="color: #4b5563; margin: 10px 0;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 16px; color: #dc2626;">${password}</code></p>
                                            <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">
                                                ⚠️ Please keep this password secure and change it after your first login.
                                            </p>
                                        </div>

                                        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                            <h4 style="color: #1e40af; margin-top: 0;">Your Specializations:</h4>
                                            <p style="color: #1e40af; margin: 5px 0;">${(trainer.specializations?.courses || []).join(', ')}</p>
                                        </div>

                                        <h3 style="color: #1f2937;">Next Steps:</h3>
                                        <ol style="color: #4b5563; line-height: 1.8;">
                                            <li>Log in to your trainer portal using the credentials above</li>
                                            <li>Complete your profile setup</li>
                                            <li>Review your assigned courses</li>
                                            <li>Start inspiring the next generation of tech professionals!</li>
                                        </ol>

                                        <div style="text-align: center; margin-top: 30px;">
                                            <a href="http://localhost:8080/TrainerLogin.html" style="display: inline-block; background-color: #137fec; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                                Login to Trainer Portal
                                            </a>
                                        </div>

                                        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
                                            If you have any questions, please contact us at support@techpro.ai
                                        </p>
                                    </div>
                                </div>
                            `
                        };

                        await transporter.sendMail(mailOptions);
                        console.log(`📧 Approval email sent to ${trainer.email}`);
                    }
                } catch (emailError) {
                    console.error('Email sending failed:', emailError);
                    // Don't fail the approval if email fails
                }

                res.json({
                    success: true,
                    message: 'Trainer approved successfully',
                    trainer: data.trainers[trainerIndex],
                    password: password // Return password to show in admin UI
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to approve trainer'
                });
            }
        } catch (error) {
            console.error('Error approving trainer:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    });

    // PUT /api/trainers/:id/reject - Reject trainer application
    app.put('/api/trainers/:id/reject', (req, res) => {
        try {
            const { id } = req.params;
            const { reviewedBy, reason } = req.body;

            const data = readTrainers();
            const trainerIndex = data.trainers.findIndex(t => t.id === id);

            if (trainerIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Trainer not found'
                });
            }

            // Update trainer status
            data.trainers[trainerIndex].status = 'rejected';
            data.trainers[trainerIndex].reviewedAt = new Date().toISOString();
            data.trainers[trainerIndex].reviewedBy = reviewedBy || 'admin';
            data.trainers[trainerIndex].rejectionReason = reason || 'Not specified';

            if (writeTrainers(data)) {
                console.log(`❌ Trainer rejected: ${data.trainers[trainerIndex].name}`);
                res.json({
                    success: true,
                    message: 'Trainer application rejected',
                    trainer: data.trainers[trainerIndex]
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to reject trainer'
                });
            }
        } catch (error) {
            console.error('Error rejecting trainer:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    });

    // PUT /api/trainers/:id - Update trainer details
    app.put('/api/trainers/:id', (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const data = readTrainers();
            const trainerIndex = data.trainers.findIndex(t => t.id === id);

            if (trainerIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Trainer not found'
                });
            }

            // Update trainer (preserve id and timestamps)
            data.trainers[trainerIndex] = {
                ...data.trainers[trainerIndex],
                ...updates,
                id: data.trainers[trainerIndex].id, // Preserve ID
                appliedAt: data.trainers[trainerIndex].appliedAt, // Preserve original application date
                updatedAt: new Date().toISOString()
            };

            if (writeTrainers(data)) {
                console.log(`✅ Trainer updated: ${data.trainers[trainerIndex].name}`);
                res.json({
                    success: true,
                    message: 'Trainer updated successfully',
                    trainer: data.trainers[trainerIndex]
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to update trainer'
                });
            }
        } catch (error) {
            console.error('Error updating trainer:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    });

    // DELETE /api/trainers/:id - Delete trainer
    app.delete('/api/trainers/:id', (req, res) => {
        try {
            const { id } = req.params;

            const data = readTrainers();
            const trainerIndex = data.trainers.findIndex(t => t.id === id);

            if (trainerIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Trainer not found'
                });
            }

            const deletedTrainer = data.trainers[trainerIndex];
            data.trainers.splice(trainerIndex, 1);

            if (writeTrainers(data)) {
                console.log(`🗑️ Trainer deleted: ${deletedTrainer.name}`);
                res.json({
                    success: true,
                    message: 'Trainer deleted successfully',
                    trainer: deletedTrainer
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete trainer'
                });
            }
        } catch (error) {
            console.error('Error deleting trainer:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    });

    // PUT /api/trainers/:id/set-password - Set/Reset trainer password
    app.put('/api/trainers/:id/set-password', async (req, res) => {
        try {
            const { id } = req.params;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required'
                });
            }

            const data = readTrainers();
            const trainerIndex = data.trainers.findIndex(t => t.id === id);

            if (trainerIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Trainer not found'
                });
            }

            // Update password
            data.trainers[trainerIndex].password = password;
            data.trainers[trainerIndex].passwordUpdatedAt = new Date().toISOString();

            if (writeTrainers(data)) {
                console.log(`🔑 Password updated for: ${data.trainers[trainerIndex].name}`);

                // Send email notification
                const trainer = data.trainers[trainerIndex];
                try {
                    const nodemailer = require('nodemailer');
                    const emailConfig = require('./email-config');

                    if (emailConfig && emailConfig.email && emailConfig.email.auth) {
                        const transporter = nodemailer.createTransport({
                            service: emailConfig.email.service,
                            auth: {
                                user: emailConfig.email.auth.user,
                                pass: emailConfig.email.auth.pass
                            }
                        });

                        const mailOptions = {
                            from: emailConfig.email.auth.user,
                            to: trainer.email,
                            subject: '🔐 TECH-PRO AI - Password Updated',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                                    <div style="background: linear-gradient(135deg, #137fec 0%, #0f65bd 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                        <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Updated</h1>
                                    </div>
                                    
                                    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <h2 style="color: #1f2937; margin-top: 0;">Hello ${trainer.name},</h2>
                                        
                                        <p style="color: #4b5563; line-height: 1.6;">
                                            Your TECH-PRO AI trainer account password has been updated by an administrator.
                                        </p>

                                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #137fec;">
                                            <h3 style="color: #1f2937; margin-top: 0;">Your New Login Credentials</h3>
                                            <p style="color: #4b5563; margin: 10px 0;"><strong>Email:</strong> ${trainer.email}</p>
                                            <p style="color: #4b5563; margin: 10px 0;"><strong>New Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 16px; color: #dc2626;">${password}</code></p>
                                            <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">
                                                ⚠️ Please keep this password secure and change it after your next login.
                                            </p>
                                        </div>

                                        <div style="text-align: center; margin-top: 30px;">
                                            <a href="http://localhost:8080/TrainerLogin.html" style="display: inline-block; background-color: #137fec; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                                Login to Trainer Portal
                                            </a>
                                        </div>

                                        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
                                            If you did not request this password change, please contact support immediately at support@techpro.ai
                                        </p>
                                    </div>
                                </div>
                            `
                        };

                        await transporter.sendMail(mailOptions);
                        console.log(`📧 Password notification email sent to ${trainer.email}`);
                    }
                } catch (emailError) {
                    console.error('Email sending failed:', emailError);
                    // Don't fail the password update if email fails
                }

                res.json({
                    success: true,
                    message: 'Password updated successfully',
                    trainer: data.trainers[trainerIndex]
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to update password'
                });
            }
        } catch (error) {
            console.error('Error updating password:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    });

    console.log('✅ Trainer Management API endpoints loaded');
};
