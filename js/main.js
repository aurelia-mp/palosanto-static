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
      mobileToggle.setAttribute('aria-expanded', String(!expanded));
      mobileMenu.classList.toggle('hidden', expanded);
    });
  }

  const heroVideo = document.getElementById('hero-video');
  if (heroVideo) {
    const videoFiles = ['Video Suite con sushi.mp4', 'video-colibri-edit.mp4'];
    const selected = videoFiles[Math.floor(Math.random() * videoFiles.length)];
    const videoSrc = `./images/videos/${encodeURIComponent(selected)}`;
    heroVideo.src = videoSrc;
    heroVideo.load();
    const playAttempt = heroVideo.play();
    if (playAttempt && typeof playAttempt.then === 'function') {
      playAttempt.catch(() => {
        /* Ignore autoplay rejection; user interaction will start playback */
      });
    }
  }
});
