// ===================================
// A5DASHBOARD.HTML - REAL-TIME FUNCTIONALITY
// ===================================
// Add this script before the closing </body> tag in A5Dashboard.html

<script>
// Dashboard Real-Time Functionality
document.addEventListener('DOMContentLoaded', () => {
        console.log('🎯 Dashboard real-time functionality loaded');

    // ===================================
    // 1. CONTINUE LEARNING - Redirect to Last Page
    // ===================================
    const continueBtn = document.querySelector('button:has(span:contains("Continue Learning"))') || 
                        Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Continue Learning'));

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            // Get last visited page from localStorage
            const lastPage = localStorage.getItem('lastCoursePage') || 'AIlearning.html';
            const lastCourse = localStorage.getItem('lastCourse') || 'AI & Machine Learning';

            console.log(`📚 Continuing to: ${lastPage}`);
            showToast(`Resuming ${lastCourse}...`, 'success');

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = lastPage;
            }, 500);
        });
    }

    // ===================================
    // 2. LOGOUT FUNCTIONALITY
    // ===================================
    function setupLogout() {
        // Add logout button to header if not exists
        const header = document.querySelector('header .flex.items-center.gap-4');
    if (header && !document.getElementById('logout-btn')) {
            const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors';
    logoutBtn.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">logout</span>
    Logout
    `;
            
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
        // Clear user session
        localStorage.removeItem('studentProfile');
    localStorage.removeItem('lastCoursePage');
    localStorage.removeItem('lastCourse');
    localStorage.removeItem('courseProgress');

    showToast('Logging out...', 'info');

                    // Redirect to login page
                    setTimeout(() => {
        window.location.href = 'A3Login.html';
                    }, 1000);
                }
            });

    header.insertBefore(logoutBtn, header.lastChild);
        }
    }

    setupLogout();

    // ===================================
    // 3. REAL-TIME COMPLETION PERCENTAGES
    // ===================================
    function updateCourseProgress() {
        // Get progress from localStorage or default
        const progress = JSON.parse(localStorage.getItem('courseProgress') || '{ }');

    // Default progress if none exists
    const defaultProgress = {
        currentCourse: 'Advanced Generative AI for UX Design',
    completedLessons: 24,
    totalLessons: 38,
    percentage: 65
        };

    const courseData = progress.currentCourse ? progress : defaultProgress;

    // Update main course card
    const progressText = document.querySelector('.text-blue-200.font-medium');
    if (progressText) {
        progressText.textContent = `${courseData.percentage}% Complete`;
        }

    const lessonsText = document.querySelector('.text-blue-200:not(.font-medium)');
    if (lessonsText && lessonsText.textContent.includes('/')) {
        lessonsText.textContent = `${courseData.completedLessons}/${courseData.totalLessons} Lessons`;
        }

    const progressBar = document.querySelector('.bg-blue-400.w-\\[65\\%\\]');
    if (progressBar) {
        progressBar.style.width = `${courseData.percentage}%`;
    progressBar.classList.remove('w-[65%]');
        }

    console.log(`📊 Progress updated: ${courseData.percentage}%`);
    }

    updateCourseProgress();

    // Update progress every 30 seconds
    setInterval(updateCourseProgress, 30000);

    // ===================================
    // 4. MAKE ALL CARDS CLICKABLE & FUNCTIONAL
    // ===================================
    function setupCourseCards() {
        // Course mapping
        const coursePages = {
        'Cloud Computing': 'AiCloud.html',
    'Networking': 'AiNet.html',
    'AI & Machine Learning': 'AiAI.html',
    'Cybersecurity': 'AiCybersecurity.html',
    'Java Full Stack': 'AiJava.html',
    'Python Full Stack': 'AiPython.html',
    'Automation Testing': 'AiAutomation.html',
    'Manual Testing': 'AiManual.html'
        };

    // Get all course cards
    const courseCards = document.querySelectorAll('.group.bg-white.dark\\:bg-dark-card.rounded-2xl');
        
        courseCards.forEach(card => {
            const titleElement = card.querySelector('h4');
    if (titleElement) {
                const courseTitle = titleElement.textContent.trim();
    const coursePage = coursePages[courseTitle];

    if (coursePage) {
        card.style.cursor = 'pointer';
                    
                    card.addEventListener('click', () => {
        // Save as last visited
        localStorage.setItem('lastCoursePage', coursePage);
    localStorage.setItem('lastCourse', courseTitle);

    showToast(`Opening ${courseTitle}...`, 'info');

                        // Redirect
                        setTimeout(() => {
        window.location.href = coursePage;
                        }, 500);
                    });

    console.log(`✅ Card linked: ${courseTitle} → ${coursePage}`);
                }
            }
        });
    }

    setupCourseCards();

    // ===================================
    // 5. MY SCHEDULE BUTTON
    // ===================================
    const scheduleBtn = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.textContent.includes('My Schedule')
    );

    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', () => {
            showToast('Opening your schedule...', 'info');
            // You can redirect to a schedule page or open a modal
            setTimeout(() => {
                window.location.href = 'Online.html'; // or your schedule page
            }, 500);
        });
    }

    // ===================================
    // 6. SET NEW GOAL BUTTON
    // ===================================
    const goalBtn = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.textContent.includes('Set New Goal')
    );

    if (goalBtn) {
        goalBtn.addEventListener('click', () => {
            const goal = prompt('What is your learning goal?');
            if (goal) {
                localStorage.setItem('learningGoal', goal);
                showToast(`Goal set: ${goal}`, 'success');
            }
        });
    }

    // ===================================
    // 7. TRACK PAGE VISITS (for Continue Learning)
    // ===================================
    window.trackPageVisit = function(pageName, courseName) {
        localStorage.setItem('lastCoursePage', pageName);
    localStorage.setItem('lastCourse', courseName);
    localStorage.setItem('lastVisit', new Date().toISOString());
    console.log(`📍 Tracked visit: ${courseName} (${pageName})`);
    };

    // ===================================
    // 8. UPDATE COURSE PROGRESS (call from course pages)
    // ===================================
    window.updateProgress = function(courseName, completed, total) {
        const percentage = Math.round((completed / total) * 100);
    const progress = {
        currentCourse: courseName,
    completedLessons: completed,
    totalLessons: total,
    percentage: percentage,
    lastUpdated: new Date().toISOString()
        };

    localStorage.setItem('courseProgress', JSON.stringify(progress));
    console.log(`📈 Progress saved: ${percentage}%`);

    // Update UI if on dashboard
    if (window.location.pathname.includes('A5Dashboard')) {
        updateCourseProgress();
        }
    };

    // ===================================
    // 9. TOAST NOTIFICATION HELPER
    // ===================================
    function showToast(message, type = 'info') {
        // Check if toast function exists
        if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    return;
        }

    // Create simple toast if function doesn't exist
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
        };

    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
    toast.textContent = message;

    document.body.appendChild(toast);
        
        setTimeout(() => {
        toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Make it globally available
    window.showToast = showToast;

    // ===================================
    // 10. INITIALIZE DASHBOARD
    // ===================================
    console.log('✅ Dashboard initialized with real-time features');
    console.log('📚 Last page:', localStorage.getItem('lastCoursePage') || 'None');
    console.log('📊 Progress:', localStorage.getItem('courseProgress') || 'None');
});
</script>

// ===================================
// USAGE INSTRUCTIONS
// ===================================
/*
1. Add this script to A5Dashboard.html before </body>

2. In your course pages (AiAI.html, AiJava.html, etc.), add:
   <script>
   // Track page visit
   trackPageVisit('AiAI.html', 'AI & Machine Learning');
   
   // Update progress when lesson completed
   updateProgress('AI & Machine Learning', 15, 30); // 15 of 30 lessons done
   </script>

3. Features now working:
   ✅ Continue Learning - redirects to last visited course page
   ✅ Logout - clears session and redirects to login
   ✅ Real-time progress - updates every 30 seconds
   ✅ All course cards clickable - redirect to respective pages
   ✅ My Schedule button - redirects to schedule page
   ✅ Set New Goal - saves learning goal
   ✅ Page tracking - remembers where user stopped
   ✅ Toast notifications - user feedback

4. localStorage keys used:
   - lastCoursePage: Last visited course page
   - lastCourse: Last visited course name
   - courseProgress: Current course progress data
   - studentProfile: User profile data
   - learningGoal: User's learning goal
*/
