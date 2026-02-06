/**
 * Student Profile Manager
 * Handles student ID, name, and profile display across all student pages
 * Fetches data from backend API with localStorage fallback
 */

const StudentProfile = {
    API_BASE_URL: 'http://localhost:8080/api',
    USE_BACKEND: true,

    /**
     * Get current student data from backend or localStorage
     */
    async getCurrentStudent() {
        // Check if student has enrolled (has studentProfile with ID)
        const enrolledProfile = localStorage.getItem('studentProfile');
        if (enrolledProfile) {
            try {
                const profile = JSON.parse(enrolledProfile);

                // If we have an ID already, return it (student has enrolled)
                if (profile.id) {
                    return profile;
                }

                // If no ID but we have email, try to fetch from backend
                if (profile.email && this.USE_BACKEND) {
                    try {
                        const response = await fetch(`${this.API_BASE_URL}/students`);
                        const result = await response.json();
                        if (result.success && result.data) {
                            // Find student by email
                            const student = result.data.find(s => s.email === profile.email);
                            if (student) {
                                // Update localStorage with full data including ID
                                const updatedProfile = {
                                    id: student.id,
                                    firstName: student.firstName,
                                    lastName: student.lastName,
                                    fullName: `${student.firstName} ${student.lastName}`,
                                    email: student.email,
                                    photo: student.photo || profile.photo,
                                    course: student.desiredCourse
                                };
                                localStorage.setItem('studentProfile', JSON.stringify(updatedProfile));
                                return updatedProfile;
                            }
                        }
                    } catch (error) {
                        console.warn('Backend unavailable, using localStorage:', error);
                    }
                }

                return profile;
            } catch (e) {
                console.error('Error parsing student profile:', e);
            }
        }

        // Check if user has signed up but not enrolled yet (from A2Signup.html)
        const firstName = localStorage.getItem('userFirstName');
        const lastName = localStorage.getItem('userLastName');
        const email = localStorage.getItem('userEmail');

        if (firstName && lastName) {
            // User signed up but hasn't enrolled yet - no ID
            return {
                id: null, // No ID until enrollment
                firstName: firstName,
                lastName: lastName,
                fullName: `${firstName} ${lastName}`,
                email: email || '',
                photo: null,
                course: ''
            };
        }

        // Return default if nothing found
        return {
            id: 'GUEST',
            firstName: 'Guest',
            lastName: 'User',
            fullName: 'Guest User',
            email: '',
            photo: null,
            course: ''
        };
    },

    /**
     * Update header with student name and ID
     */
    async updateHeader() {
        const student = await this.getCurrentStudent();

        // Update name in header - support both ID patterns
        const nameElement = document.getElementById('header-user-name') || document.getElementById('user-fullname');
        if (nameElement) {
            nameElement.textContent = student.fullName || `${student.firstName} ${student.lastName}`;
        }

        // Update avatar - support both ID patterns
        const avatarElement = document.getElementById('user-avatar');
        if (avatarElement && student.firstName && student.lastName) {
            const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
            avatarElement.innerHTML = `<span class="text-sm font-bold">${initials}</span>`;
        }

        // Update student name in welcome message
        const welcomeElement = document.getElementById('student-name');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome back, ${student.firstName}! 👋`;
        }

        // Update photo if element exists
        const photoElement = document.getElementById('student-photo');
        if (photoElement && student.photo) {
            photoElement.src = student.photo;
        }

        // Add student ID badge if not already present
        this.addStudentIDBadge(student.id);

        // Add logout button if not already present
        this.addLogoutButton();
    },

    /**
     * Add student ID badge to header
     */
    addStudentIDBadge(studentId) {
        // Don't show ID if student hasn't enrolled yet (null ID)
        if (!studentId || studentId === 'GUEST') {
            // Remove badge if it exists
            const existingBadge = document.getElementById('student-id-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
            return;
        }

        // Check if badge already exists
        if (document.getElementById('student-id-badge')) {
            document.getElementById('student-id-badge').textContent = `ID: ${studentId}`;
            return;
        }

        // Find the header user name element - support both ID patterns
        const nameElement = document.getElementById('header-user-name') || document.getElementById('user-fullname');
        if (!nameElement) return;

        // Create ID badge
        const badge = document.createElement('div');
        badge.id = 'student-id-badge';
        badge.className = 'text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5';
        badge.textContent = `ID: ${studentId}`;

        // Insert after name element
        nameElement.parentNode.appendChild(badge);
    },

    /**
     * Add logout button to header
     */
    addLogoutButton() {
        // Check if logout button already exists (manual or auto)
        if (document.getElementById('auto-logout-btn') || document.getElementById('logout-btn')) {
            // If manual logout-btn exists, attach our handler to it
            const existingBtn = document.getElementById('logout-btn');
            if (existingBtn && !existingBtn.dataset.handlerAttached) {
                existingBtn.addEventListener('click', () => this.logout());
                existingBtn.dataset.handlerAttached = 'true';
            }
            return;
        }

        // Find the header user name container - support both ID patterns
        const nameElement = document.getElementById('header-user-name') || document.getElementById('user-fullname');
        if (!nameElement) return;

        // Find the parent container (should be a flex container)
        let container = nameElement.closest('.flex.items-center');
        if (!container) return;

        // Make container relative for positioning
        if (!container.classList.contains('relative')) {
            container.classList.add('relative');
        }

        // Create logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'auto-logout-btn';
        logoutBtn.className = 'ml-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';
        logoutBtn.title = 'Logout';
        logoutBtn.innerHTML = '<span class="material-symbols-outlined text-slate-600 dark:text-slate-400 text-[20px]">logout</span>';

        // Add click handler
        logoutBtn.addEventListener('click', () => this.logout());

        // Append to container
        container.appendChild(logoutBtn);
    },

    /**
     * Handle logout
     */
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear student profile from localStorage
            localStorage.removeItem('studentProfile');
            localStorage.removeItem('userFirstName');
            localStorage.removeItem('userLastName');
            localStorage.removeItem('userEmail');

            // Show logout message
            alert('✅ Logged out successfully!');

            // Redirect to home page
            window.location.href = 'A1Homepage.html';
        }
    },

    /**
     * Initialize student profile on page load
     */
    async init() {
        await this.updateHeader();

        // Listen for storage changes (if student enrolls in another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'studentProfile') {
                this.updateHeader();
            }
        });
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StudentProfile.init());
} else {
    StudentProfile.init();
}
