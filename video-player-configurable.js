// Configurable video modal and playback functionality
// Version 3: Cinema Mode & Local File Support
// Usage: Set window.courseVideoId in the page before loading this script

document.addEventListener('DOMContentLoaded', () => {
    console.log('[VideoPlayer v3] Initializing...');

    // 1. Idempotency & Cleanup
    const existingModal = document.getElementById('videoModal');
    if (existingModal) {
        console.warn('[VideoPlayer] Removing existing modal to prevent conflicts.');
        existingModal.remove();
    }

    // 2. Configuration
    // Use the provided ID or fallback to the safe YouTube Test Video
    const videoId = window.courseVideoId || 'M7lc1UVf-VE';
    console.log(`[VideoPlayer] Configured ID: ${videoId}`);

    // 3. Create Cinema Mode Modal
    // Using fixed positioning with high Z-index to cover everything
    const modal = document.createElement('div');
    modal.id = 'videoModal';
    modal.className = 'fixed inset-0 z-[9999] hidden items-center justify-center bg-black/95 p-4 md:p-10 backdrop-blur-xl transition-all duration-300';

    modal.innerHTML = `
        <div class="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto flex flex-col bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5 group">
            <!-- Header / Close Bar -->
            <div class="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/90 to-transparent z-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-0"></div>
            
            <button class="close-video-btn absolute top-6 right-6 z-50 p-3 bg-white/10 text-white hover:bg-red-600/90 rounded-full transition-all backdrop-blur-md border border-white/10 shadow-lg hover:scale-110 active:scale-95">
                <span class="material-symbols-outlined text-3xl font-bold">close</span>
            </button>

            <!-- Video Container -->
            <div class="flex-1 w-full relative bg-slate-950 flex items-center justify-center">
                <iframe class="video-iframe w-full h-full" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 4. Scoped Control Logic
    const iframe = modal.querySelector('.video-iframe');
    const closeBtn = modal.querySelector('.close-video-btn');

    function playVideo(customId) {
        const targetId = customId || videoId;
        console.log(`[VideoPlayer] Playing: ${targetId}`);

        // Construct simplest possible embed URL for maximum compatibility
        // rel=0: Don't show related videos from other channels
        // modestbranding=1: Minimal YouTube branding
        // color=white: White progress bar
        let embedUrl = `https://www.youtube.com/embed/${targetId}?rel=0&modestbranding=1&color=white`;

        // Check for autoplay entitlement (browsers block unmuted autoplay often)
        // We add autoplay=1 but users might still need to click if browser blocks it.
        embedUrl += '&autoplay=1';

        iframe.src = embedUrl;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeVideo() {
        console.log('[VideoPlayer] Closing');
        iframe.src = ''; // Stop playback immediately
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    // 5. Event Binding
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeVideo();
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideo();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeVideo();
        }
    });

    // 6. Global Exposure
    window.playVideo = playVideo;
    window.closeVideo = closeVideo;

    // 7. Bind "Play" Buttons
    // Explicit IDs from various templates
    const specificIds = ['mainPlayBtn', 'videoPlayBtn', 'heroPlayBtn'];

    specificIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            console.log(`[VideoPlayer] Binding #${id}`);
            btn.style.cursor = 'pointer';
            // Force override existing listeners
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                playVideo();
            };
        }
    });

    // Semantic / Generic Buttons
    // Searches for buttons with "play" icons or text
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
        if (specificIds.includes(btn.id)) return; // Already handled

        const html = btn.innerHTML.toLowerCase();
        if (html.includes('play_arrow') || html.includes('play_circle')) {
            // console.log('[VideoPlayer] Binding generic button', btn);
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                playVideo();
            });
        }
    });

    // Legacy Text Links (looking for "video" text)
    const textNodes = document.querySelectorAll('p, span, div, h1, h2, h3');
    textNodes.forEach(el => {
        // filter for simple text nodes
        if (el.children.length === 0 && el.innerText.length < 50) {
            const txt = el.innerText.toLowerCase();
            if (txt.includes('video') || txt.includes('vedeo')) {
                el.style.cursor = 'pointer';
                el.style.color = '#3b82f6';
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playVideo();
                });
            }
        }
    });
});
