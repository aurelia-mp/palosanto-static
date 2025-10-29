document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-disclosure]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('aria-controls');
      const panel = document.getElementById(id);
      if (!panel) return;

      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      panel.classList.toggle('hidden', expanded);

      const chev = btn.querySelector('.chev');
      if (chev) chev.classList.toggle('-rotate-180');
    });
  });

  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !expanded;
      mobileToggle.setAttribute('aria-expanded', String(nextExpanded));
      mobileMenu.classList.toggle('hidden', !nextExpanded);
      mobileToggle.classList.toggle('border-gray-400', nextExpanded);
    });
  }

  const heroVideo = document.getElementById('hero-video');
  if (heroVideo) {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const videoFiles = ['Video Suite con sushi.mp4', 'video-colibri-edit.mp4'];

    const ensureVideoState = () => {
      if (!desktopQuery.matches) {
        if (heroVideo.dataset.loaded === 'true') {
          heroVideo.pause();
          heroVideo.removeAttribute('src');
          heroVideo.load();
          heroVideo.dataset.loaded = 'false';
        }
        return;
      }

      if (heroVideo.dataset.loaded === 'true') return;

      const selected = videoFiles[Math.floor(Math.random() * videoFiles.length)];
      const videoSrc = `./images/videos/${encodeURIComponent(selected)}`;
      heroVideo.src = videoSrc;
      heroVideo.dataset.loaded = 'true';
      heroVideo.load();
      const playAttempt = heroVideo.play();
      if (playAttempt && typeof playAttempt.then === 'function') {
        playAttempt.catch(() => {
          /* Ignore autoplay rejection; user interaction will start playback */
        });
      }
    };

    ensureVideoState();
    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', ensureVideoState);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(ensureVideoState);
    }
  }
});
