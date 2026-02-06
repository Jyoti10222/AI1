// Add this to A4Onboarding.html to fix dynamic content display

// Replace the element selectors in loadOnboardingContent function:

// Find the features section (the one with "Learning Experience Includes")
const featuresSection = document.querySelector('.flex.flex-col.gap-10');
if (featuresSection) {
    const sectionTitle = featuresSection.querySelector('h2');
    const sectionSubtitle = featuresSection.querySelector('p.text-slate-500');

    if (sectionTitle && onboardingConfig.featuresTitle) {
        sectionTitle.textContent = onboardingConfig.featuresTitle;
        console.log('✅ Updated features title:', onboardingConfig.featuresTitle);
    }
    if (sectionSubtitle && onboardingConfig.featuresSubtitle) {
        sectionSubtitle.textContent = onboardingConfig.featuresSubtitle;
        console.log('✅ Updated features subtitle:', onboardingConfig.featuresSubtitle);
    }
}
