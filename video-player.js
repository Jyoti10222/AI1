// Add video modal and playback functionality to A61CC.html
document.addEventListener('DOMContentLoaded', () => {
    // Create video modal
    const videoModal = document.createElement('div');
    videoModal.id = 'videoModal';
    videoModal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-black/80 p-4';
    videoModal.innerHTML = `
        <div class="relative w-full max-w-5xl">
            <button id="closeVideoModal" class="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors">
                <span class="material-symbols-outlined text-4xl">close</span>
            </button>
            <div class="relative pb-[56.25%] h-0 bg-black rounded-lg overflow-hidden shadow-2xl">
                <iframe id="youtubePlayer" class="absolute top-0 left-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        </div>
    `;
    document.body.appendChild(videoModal);

    // Function to open video
    function playVideo(videoId) {
        const iframe = document.getElementById('youtubePlayer');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        videoModal.classList.remove('hidden');
        videoModal.classList.add('flex');
    }

    // Function to close video
    function closeVideo() {
        const iframe = document.getElementById('youtubePlayer');
        iframe.src = '';
        videoModal.classList.add('hidden');
        videoModal.classList.remove('flex');
    }

    // Close button handler
    document.getElementById('closeVideoModal').addEventListener('click', closeVideo);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
            closeVideo();
        }
    });

    // Close when clicking outside the video
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideo();
        }
    });

    // Add click handlers to course cards (specifically the Cloud Computing course card)
    // You can change this to target any element you want
    const cloudCourseCard = document.querySelector('.group.bg-white.dark\\:bg-dark-card.rounded-2xl');
    if (cloudCourseCard) {
        cloudCourseCard.style.cursor = 'pointer';
        cloudCourseCard.addEventListener('click', (e) => {
            // Don't trigger if clicking on checkboxes or other interactive elements
            if (!e.target.matches('input[type="checkbox"]') && !e.target.closest('label')) {
                playVideo('s_qQfOitQIs');
            }
        });
    }

    // Expose function globally for other elements to use
    window.playCloudVideo = () => playVideo('s_qQfOitQIs');
});
