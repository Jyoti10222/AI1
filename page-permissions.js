/**
 * Page-Level Permission Mapping
 * Defines which permissions are required to access each page
 */

const PagePermissions = {
    // Map page filenames to required permissions
    pagePermissionMap: {
        // Admin Pages - Require admin permissions
        'A9Admin.html': 'viewAnalytics',
        'A14Student.html': 'viewStudents',
        'A16Users.html': 'viewStudents', // User management
        'NotificationAdmin.html': 'manageNotifications',
        'A17Analytics.html': 'viewAnalytics',
        'A18Report.html': 'viewGlobalReports',

        // Faculty Pages - Require faculty permissions
        'FacultyOnline.html': 'viewCourses',
        'FacultyOffline.html': 'viewCourses',
        'FacultyHybrid.html': 'viewCourses',

        // Course Management - Require course permissions
        'A11Builder.html': 'createCourses',
        'A6Catlog.html': 'viewCourses',
        'AIlearning.html': 'viewCourses',

        // Batch Management - Require batch permissions
        'Online.html': 'manageBatches',
        'OnlineAdmin.html': 'manageBatches',
        'Offline.html': 'manageBatches',
        'OfflineAdmin.html': 'manageBatches',
        'Hybrid.html': 'manageBatches',
        'HybridAdmin.html': 'manageBatches',

        // Super Admin - Only for superadmin role
        'SuperAdmin.html': 'superadmin',

        // Student Pages - Available to all
        'A5Dashboard.html': 'viewCourses',
        'Studentform.html': 'viewCourses',
        'Certificate.html': 'viewCourses',

        // Public Pages - No permission required
        'A1Homepage.html': null,
        'A2Login.html': null,
        'A3Signup.html': null,
        'A4Onboarding.html': null
    },

    /**
     * Check if current user can access a specific page
     * @param {string} pageName - Name of the page (e.g., 'A14Student.html')
     * @returns {Promise<boolean>} True if user has access
     */
    async canAccessPage(pageName) {
        const requiredPermission = this.pagePermissionMap[pageName];

        // Public pages - no permission required
        if (requiredPermission === null) {
            return true;
        }

        // Super Admin pages - check role directly
        if (requiredPermission === 'superadmin') {
            const userRole = PermissionManager.getUserRole();
            return userRole === 'superadmin';
        }

        // Check permission via API
        return await PermissionManager.hasPermission(requiredPermission);
    },

    /**
     * Get current page name from URL
     * @returns {string} Current page filename
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1);
    },

    /**
     * Enforce page-level access control
     * Call this on every protected page to check access
     */
    async enforcePageAccess() {
        const currentPage = this.getCurrentPageName();
        const hasAccess = await this.canAccessPage(currentPage);

        if (!hasAccess) {
            const userRole = PermissionManager.getUserRole();
            const requiredPermission = this.pagePermissionMap[currentPage];

            console.error(`Access Denied: User role '${userRole}' does not have permission '${requiredPermission}' for page '${currentPage}'`);

            // Show access denied message
            alert(`Access Denied\n\nYou do not have permission to access this page.\n\nRequired permission: ${requiredPermission}\nYour role: ${userRole}\n\nPlease contact your administrator.`);

            // Redirect to appropriate page based on role
            this.redirectToHomePage(userRole);
        }
    },

    /**
     * Redirect user to appropriate home page based on role
     * @param {string} role - User role
     */
    redirectToHomePage(role) {
        const roleHomepages = {
            'superadmin': 'SuperAdmin.html',
            'admin': 'A9Admin.html',
            'faculty': 'FacultyOnline.html',
            'student': 'A5Dashboard.html',
            'user': 'A1Homepage.html'
        };

        const homepage = roleHomepages[role] || 'A1Homepage.html';
        window.location.href = homepage;
    },

    /**
     * Filter navigation links based on user permissions
     * Hides links to pages the user cannot access
     */
    async filterNavigationLinks() {
        const links = document.querySelectorAll('a[href$=".html"]');

        for (const link of links) {
            const href = link.getAttribute('href');
            const pageName = href.substring(href.lastIndexOf('/') + 1);

            const hasAccess = await this.canAccessPage(pageName);

            if (!hasAccess) {
                // Hide the link or its parent element
                const parentLi = link.closest('li');
                if (parentLi) {
                    parentLi.style.display = 'none';
                } else {
                    link.style.display = 'none';
                }
            }
        }
    }
};

// Auto-enforce page access on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Check if this is a protected page
        const currentPage = PagePermissions.getCurrentPageName();
        const requiredPermission = PagePermissions.pagePermissionMap[currentPage];

        if (requiredPermission !== undefined && requiredPermission !== null) {
            await PagePermissions.enforcePageAccess();
            await PagePermissions.filterNavigationLinks();
        }
    });
} else {
    // DOM already loaded
    (async () => {
        const currentPage = PagePermissions.getCurrentPageName();
        const requiredPermission = PagePermissions.pagePermissionMap[currentPage];

        if (requiredPermission !== undefined && requiredPermission !== null) {
            await PagePermissions.enforcePageAccess();
            await PagePermissions.filterNavigationLinks();
        }
    })();
}
