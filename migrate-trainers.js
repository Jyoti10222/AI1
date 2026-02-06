// Migration script to convert old trainer format to new format
const fs = require('fs');
const path = require('path');

const trainersPath = path.join(__dirname, 'trainers.json');

console.log('🔄 Starting trainer data migration...\n');

// Read current trainers
const data = JSON.parse(fs.readFileSync(trainersPath, 'utf8'));

let migrated = 0;
let skipped = 0;

data.trainers = data.trainers.map(trainer => {
    // Check if trainer needs migration (old format)
    if (trainer.status === 'Active' || !trainer.specializations || typeof trainer.specialization !== 'undefined') {
        console.log(`Migrating: ${trainer.name}`);

        // Convert specialization to new format
        let courses = [];
        let topics = [];

        if (trainer.specialization) {
            if (Array.isArray(trainer.specialization)) {
                courses = trainer.specialization;
            } else if (typeof trainer.specialization === 'string') {
                courses = trainer.specialization.split(',').map(c => c.trim());
            }
        }

        // Create new trainer object
        const newTrainer = {
            id: trainer.id,
            name: trainer.name,
            email: trainer.email,
            phone: trainer.phone || 'N/A',
            profilePicture: trainer.profilePicture || null,
            bio: trainer.bio || '',
            experience: trainer.experience ? trainer.experience.toString() : '0',
            qualifications: trainer.qualifications || '',
            specializations: {
                courses: courses,
                topics: topics
            },
            status: trainer.status === 'Active' ? 'approved' : trainer.status,
            password: trainer.password || null,
            appliedAt: trainer.createdAt || trainer.appliedAt || new Date().toISOString(),
            reviewedAt: trainer.updatedAt || trainer.reviewedAt || new Date().toISOString(),
            reviewedBy: trainer.reviewedBy || 'system-migration'
        };

        migrated++;
        return newTrainer;
    } else {
        console.log(`Skipping (already new format): ${trainer.name}`);
        skipped++;
        return trainer;
    }
});

// Write updated data
data.lastUpdated = new Date().toISOString();
fs.writeFileSync(trainersPath, JSON.stringify(data, null, 2));

console.log('\n✅ Migration complete!');
console.log(`   Migrated: ${migrated} trainers`);
console.log(`   Skipped: ${skipped} trainers (already in new format)`);
console.log(`   Total: ${data.trainers.length} trainers\n`);
