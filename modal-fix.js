// Add this script to A4OnboardingAdmin.html right before the closing </script> tag

// Replace the addCourseOption function
function addCourseOption() {
    document.getElementById('add-course-modal').classList.remove('hidden');
}

function closeAddCourseModal() {
    document.getElementById('add-course-modal').classList.add('hidden');
    document.getElementById('add-course-form').reset();
}

// Add form submission handler
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('add-course-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const courseName = document.getElementById('new-course-name').value.trim();
            const courseDescription = document.getElementById('new-course-description').value.trim();
            const courseIcon = document.getElementById('new-course-icon').value.trim();
            const courseColor = document.getElementById('new-course-color').value;
            const courseLink = document.getElementById('new-course-link').value.trim();

            if (!courseName || !courseDescription || !courseIcon || !courseLink) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            const courseId = courseName.toLowerCase().replace(/\s+/g, '-');

            // Add to homepage config
            if (!homepageConfig.courses) {
                homepageConfig.courses = [];
            }

            const newCourse = {
                id: courseId,
                name: courseName,
                description: courseDescription,
                icon: courseIcon,
                color: courseColor,
                link: courseLink,
                image: `images/${courseId}_card_bg.png`,
                enabled: true
            };

            homepageConfig.courses.push(newCourse);

            // Auto-select in onboarding
            if (!onboardingConfig.enabledCourseIds) {
                onboardingConfig.enabledCourseIds = [];
            }
            onboardingConfig.enabledCourseIds.push(courseId);

            renderCourses();
            updateStats();
            closeAddCourseModal();
            showToast('Course added! Remember to save changes.', 'success');
        });
    }
});
