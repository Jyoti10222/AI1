/**
 * Access Control & Filtering Logic
 * Enforces course enrollment and filters UI elements.
 */

const COURSE_MAPPING = {
    'Java Programming': ['A83Java.html', 'A62Java.html'],
    'Python Full Stack': ['A8Assignment.html', 'A63Python.html'],
    'Cyber Security': ['A85Cyber.html', 'A67Cyber.html', 'AiCybersecurity.html'],
    'Networking': ['A84Net.html', 'A68Net.html', 'AiNet.html'],
    'Cloud Computing': ['A81CC.html', 'A61CC.html'],
    'Automation Testing': ['A86Automan.html', 'A65Automation.html', 'A66Manual.html'],
    'Selenium': ['A89Sel.html'],
    'C Programming': ['A87C.html'],
    'C++ Programming': ['A88C++.html'],
    'Artificial Intelligence': ['A82AI.html', 'A64Ai.html'],
    'Manual Testing': ['A66Manual.html', 'A86Automan.html']
};

function getEnrolledCourse() {
    try {
        const profile = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        return profile.course;
    } catch (e) {
        return null;
    }
}

function checkAccess() {
    const enrolled = getEnrolledCourse();
    if (!enrolled) return; // No restriction if no enrollment? Or strict? Assume strict later, but for now allow navigation if not set (relying on form redirect).

    const currentPath = window.location.pathname.split('/').pop();

    // Define pages that are safe for everyone
    const safePages = [
        'A5Dashboard.html',
        'Studentform.html',
        'A4Onboarding.html',
        'A6Catlog.html',
        'A7Tutor.html',
        'A3Login.html',
        'index.html'
    ];

    if (safePages.includes(currentPath)) return;

    // Check if current page belongs to the enrolled course
    const allowedPages = COURSE_MAPPING[enrolled] || [];

    // If we are on a course page NOT in the allowed list, Redirect.
    // We strictly check if the page IS in SOME course list but NOT ours.
    // Identify if current page is a filtered course page
    let isCoursePage = false;
    for (const key in COURSE_MAPPING) {
        if (COURSE_MAPPING[key].includes(currentPath)) {
            isCoursePage = true;
            break;
        }
    }

    if (isCoursePage && !allowedPages.includes(currentPath)) {
        console.warn('Unauthorized access. Redirecting to Onboarding.');
        window.location.href = 'A4Onboarding.html';
    }
}

function filterUI() {
    const enrolled = getEnrolledCourse();
    if (!enrolled) return;

    // Filter Catalog Cards (A6Catlog)
    const cards = document.querySelectorAll('[data-course]');
    cards.forEach(card => {
        const courseName = card.getAttribute('data-course');
        if (courseName !== enrolled) {
            // Hide parent anchor or div
            card.style.display = 'none';
            // If card is inside an anchor that wraps it, hide the anchor
            if (card.parentElement.tagName === 'A') card.parentElement.style.display = 'none';
        }
    });

    // Filter Dropdown Links (A7Tutor / Header)
    // We expect links to have data-course attribute
    const links = document.querySelectorAll('a[data-course-link]');
    links.forEach(link => {
        const courseName = link.getAttribute('data-course-link');
        if (courseName !== enrolled) {
            link.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    checkAccess();
    filterUI();
});
