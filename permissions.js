/**
 * Permission Helper Library
 * Provides functions to check user permissions and enforce access control
 */

const PermissionManager = {
    API_BASE_URL: "http://localhost:8080/api",

    /**
     * Get current user role from localStorage
     * @returns {string} User role (admin, faculty, student, user)
     */
    getUserRole() {
        return localStorage.getItem('userRole') || 'user';
    },

    /**
     * Set user role in localStorage
     * @param {string} role - User role to set
     */
    setUserRole(role) {
        localStorage.setItem('userRole', role);
    },

    /**
     * Check if current user has permission for an action
     * @param {string} action - Permission action to check
     * @returns {Promise<boolean>} True if user has permission
     */
    async hasPermission(action) {
        try {
            const role = this.getUserRole();

            // Super Admin has ALL permissions automatically
            if (role === 'superadmin') {
                console.log(`✅ Super Admin - Auto-granted permission: ${action}`);
                return true;
            }

            const response = await fetch(`${this.API_BASE_URL}/permissions/check?role=${role}&action=${action}`);

            if (!response.ok) {
                console.error('Permission check failed:', response.statusText);
                return false;
            }

            const data = await response.json();
            console.log(`Permission check for ${role}.${action}:`, data.hasPermission);
            return data.hasPermission || false;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false; // Deny by default on error
        }
    },

    /**
     * Hide element if user doesn't have permission
     * @param {string} elementId - ID of element to hide
     * @param {string} action - Permission action to check
     */
    async hideIfNoPermission(elementId, action) {
        const hasAccess = await this.hasPermission(action);
        const element = document.getElementById(elementId);

        if (element) {
            if (!hasAccess) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        }
    },

    /**
     * Disable element if user doesn't have permission
     * @param {string} elementId - ID of element to disable
     * @param {string} action - Permission action to check
     */
    async disableIfNoPermission(elementId, action) {
        const hasAccess = await this.hasPermission(action);
        const element = document.getElementById(elementId);

        if (element) {
            if (!hasAccess) {
                element.disabled = true;
                element.classList.add('opacity-50', 'cursor-not-allowed');
                element.title = 'You do not have permission for this action';
            } else {
                element.disabled = false;
                element.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    },

    /**
     * Show access denied message
     * @param {string} action - Action that was denied
     */
    showAccessDenied(action) {
        const message = `Access Denied: You do not have permission to ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;

        // Try to use existing toast system if available
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(message);
        }
    },

    /**
     * Enforce permission before executing a function
     * @param {string} action - Permission action to check
     * @param {Function} callback - Function to execute if permission granted
     * @returns {Promise<any>} Result of callback or null if denied
     */
    async enforcePermission(action, callback) {
        const hasAccess = await this.hasPermission(action);

        if (hasAccess) {
            return callback();
        } else {
            this.showAccessDenied(action);
            return null;
        }
    },

    /**
     * Initialize permissions for a page
     * Automatically hides/disables elements based on data attributes
     */
    async initializePagePermissions() {
        // Find all elements with data-permission attribute
        const elements = document.querySelectorAll('[data-permission]');

        for (const element of elements) {
            const action = element.getAttribute('data-permission');
            const mode = element.getAttribute('data-permission-mode') || 'hide'; // 'hide' or 'disable'

            if (mode === 'disable') {
                await this.disableIfNoPermission(element.id, action);
            } else {
                const hasAccess = await this.hasPermission(action);
                if (!hasAccess) {
                    element.style.display = 'none';
                }
            }
        }
    },

    /**
     * Initialize Super Admin button visibility
     * Shows button only for users with superadmin role
     */
    initSuperAdminButton() {
        const userRole = this.getUserRole();
        const superAdminBtn = document.getElementById('superAdminBtn');

        if (superAdminBtn && userRole === 'superadmin') {
            superAdminBtn.style.display = 'flex';
            console.log('✅ Super Admin button enabled');
        }
    }
};

// Auto-initialize on page load if enabled
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body.hasAttribute('data-auto-permissions')) {
            PermissionManager.initializePagePermissions();
        }
        // Always initialize Super Admin button
        PermissionManager.initSuperAdminButton();
    });
} else {
    if (document.body.hasAttribute('data-auto-permissions')) {
        PermissionManager.initializePagePermissions();
    }
    // Always initialize Super Admin button
    PermissionManager.initSuperAdminButton();
}
