/**
 * Batch Data Store Service
 * Handles localStorage management for Online, Offline, and Hybrid batches.
 * Seeds data for February 2026 if empty.
 */

const BatchStore = {
    KEYS: {
        ONLINE: 'onlineBatches',
        OFFLINE: 'offlineBatches',
        HYBRID: 'hybridBatches'
    },

    // Default Data for February 2026
    DEFAULTS: {
        ONLINE: [
            {
                id: 'batch-on-001',
                name: 'Java Full Stack - Batch 8',
                instructor: 'Khan Sir',
                course: 'Java Full Stack',
                startDate: '2026-02-10',
                endDate: '2026-06-10',
                schedule: 'Mon, Wed, Fri • 11:00 AM - 01:00 PM',
                time: '11:00 AM',
                duration: '2 Hours',
                status: 'upcoming',
                mode: 'Online',
                capacity: 50,
                enrolled: 12
            },
            {
                id: 'batch-on-002',
                name: 'Python Full Stack - Morning',
                instructor: 'Suma M',
                course: 'Python Full Stack',
                startDate: '2026-01-15',
                endDate: '2026-05-15',
                schedule: 'Tue, Thu, Sat • 11:30 AM - 01:30 PM',
                time: '11:30 AM',
                duration: '2 Hours',
                status: 'running',
                mode: 'Online',
                capacity: 40,
                enrolled: 35
            },
            {
                id: 'batch-on-003',
                name: 'AI & Machine Learning - Pro',
                instructor: 'Dr. Alan Turing',
                course: 'AI & Machine Learning',
                startDate: '2026-02-20',
                endDate: '2026-08-20',
                schedule: 'Mon, Wed • 10:00 AM - 12:00 PM',
                time: '10:00 AM',
                duration: '2 Hours',
                status: 'upcoming',
                mode: 'Online',
                capacity: 30,
                enrolled: 5
            },
            {
                id: 'batch-on-004',
                name: 'Cloud Computing - Fast Track',
                instructor: 'Priya Sharma',
                course: 'Cloud Computing',
                startDate: '2026-02-05',
                endDate: '2026-04-05',
                schedule: 'Daily • 06:00 PM - 08:00 PM',
                time: '06:00 PM',
                duration: '2 Hours',
                status: 'upcoming',
                mode: 'Online',
                capacity: 60,
                enrolled: 45
            },
            {
                id: 'batch-on-005',
                name: 'Data Science Bootcamp',
                instructor: 'Dr. Rao',
                course: 'Data Science',
                startDate: '2025-11-01',
                endDate: '2026-01-30',
                schedule: 'Mon, Wed, Fri • 02:00 PM - 04:00 PM',
                time: '02:00 PM',
                duration: '2 Hours',
                status: 'past',
                mode: 'Online',
                capacity: 40,
                enrolled: 40
            }
        ],
        OFFLINE: [
            {
                id: 'batch-off-001',
                name: 'Networking Masterclass',
                instructor: 'Shrusti Mulimani',
                course: 'Networking',
                startDate: '2026-01-10',
                endDate: '2026-04-10',
                schedule: 'Mon - Fri • 01:00 PM - 03:00 PM',
                time: '01:00 PM',
                duration: '2 Hours',
                status: 'running',
                mode: 'Offline',
                capacity: 25,
                enrolled: 20
            },
            {
                id: 'batch-off-002',
                name: 'Java Full Stack - Early Bird',
                instructor: 'VinodRaj',
                course: 'Java Full Stack',
                startDate: '2026-01-20',
                endDate: '2026-05-20',
                schedule: 'Mon - Fri • 08:00 AM - 10:00 AM',
                time: '08:00 AM',
                duration: '2 Hours',
                status: 'running',
                mode: 'Offline',
                capacity: 30,
                enrolled: 28
            },
            {
                id: 'batch-off-003',
                name: 'Cybersecurity Basics',
                instructor: 'Ravi Kumar',
                course: 'Cybersecurity',
                startDate: '2025-10-15',
                endDate: '2026-01-15',
                schedule: 'Sat, Sun • 10:00 AM - 01:00 PM',
                time: '10:00 AM',
                duration: '3 Hours',
                status: 'past',
                mode: 'Offline',
                capacity: 20,
                enrolled: 18
            }
        ],
        HYBRID: [
            {
                id: 'batch-hyb-001',
                name: 'Networking - Hybrid',
                instructor: 'Vinod',
                course: 'Networking',
                startDate: '2026-02-15',
                endDate: '2026-05-15',
                schedule: 'Weekends Offline • 09:00 PM (Online)',
                time: '09:00 PM',
                duration: '2 Hours',
                status: 'upcoming',
                mode: 'Hybrid',
                capacity: 40,
                enrolled: 10
            },
            {
                id: 'batch-hyb-002',
                name: 'Cybersecurity Specialist',
                instructor: 'Khan',
                course: 'Cybersecurity',
                startDate: '2026-02-01',
                endDate: '2026-06-01',
                schedule: 'Tue, Thu (Online) • Sat (Offline) • 03:30 PM',
                time: '03:30 PM',
                duration: '2 Hours',
                status: 'running',
                mode: 'Hybrid',
                capacity: 35,
                enrolled: 30
            },
            {
                id: 'batch-hyb-003',
                name: 'Cloud Architecture',
                instructor: 'Anita Desai',
                course: 'Cloud Computing',
                startDate: '2025-09-01',
                endDate: '2025-12-31',
                schedule: 'Weekends Offline • 07:00 PM (Online)',
                time: '07:00 PM',
                duration: '2 Hours',
                status: 'past',
                mode: 'Hybrid',
                capacity: 25,
                enrolled: 25
            }
        ]
    },

    // Initialize Store
    // Initialize Store
    init() {
        const onlineData = localStorage.getItem(this.KEYS.ONLINE);
        const shouldReseed = !onlineData || !onlineData.includes('batch-on-005'); // Check for v2 data (Past batch)

        if (shouldReseed) {
            console.log('[BatchStore] Seeding/Upgrading Batches for Feb 2026');
            localStorage.setItem(this.KEYS.ONLINE, JSON.stringify(this.DEFAULTS.ONLINE));
            localStorage.setItem(this.KEYS.OFFLINE, JSON.stringify(this.DEFAULTS.OFFLINE));
            localStorage.setItem(this.KEYS.HYBRID, JSON.stringify(this.DEFAULTS.HYBRID));
            window.dispatchEvent(new Event('storage'));
        }
    },

    // Get All Batches for a Type
    getAll(type) { // type: 'ONLINE', 'OFFLINE', 'HYBRID'
        const key = this.KEYS[type.toUpperCase()];
        if (!key) return [];
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    // Save a Batch (Add or Update)
    save(type, batch) {
        const key = this.KEYS[type.toUpperCase()];
        if (!key) return false;

        const batches = this.getAll(type);
        const index = batches.findIndex(b => b.id === batch.id);

        if (index >= 0) {
            batches[index] = batch; // Update
        } else {
            batches.push(batch); // Add
        }

        localStorage.setItem(key, JSON.stringify(batches));
        // Dispatch event for real-time updates across tabs/windows
        window.dispatchEvent(new Event('storage'));
        return true;
    },

    // Delete a Batch
    delete(type, batchId) {
        const key = this.KEYS[type.toUpperCase()];
        if (!key) return false;

        let batches = this.getAll(type);
        batches = batches.filter(b => b.id !== batchId);

        localStorage.setItem(key, JSON.stringify(batches));
        window.dispatchEvent(new Event('storage'));
        return true;
    },

    // Reset to Defaults (For Admin Testing)
    resetDefaults() {
        localStorage.setItem(this.KEYS.ONLINE, JSON.stringify(this.DEFAULTS.ONLINE));
        localStorage.setItem(this.KEYS.OFFLINE, JSON.stringify(this.DEFAULTS.OFFLINE));
        localStorage.setItem(this.KEYS.HYBRID, JSON.stringify(this.DEFAULTS.HYBRID));
        window.dispatchEvent(new Event('storage'));
        alert('Batch Schedule Reset to Feb 2026 Defaults!');
    }
};

// Initialize immediately
BatchStore.init();

// Expose globally
window.BatchStore = BatchStore;
