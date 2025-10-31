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

  const checkinInput = document.getElementById('booking-checkin');
  const checkoutInput = document.getElementById('booking-checkout');
  if (checkinInput && checkoutInput) {
    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };
    const today = new Date();
    const formatDate = date => {
      const tzAdjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return tzAdjusted.toISOString().split('T')[0];
    };
    const tomorrow = addDays(today, 1);
    const defaultCheckoutMin = formatDate(tomorrow);
    checkinInput.min = formatDate(today);
    checkoutInput.min = defaultCheckoutMin;

    checkinInput.addEventListener('change', () => {
      const checkinValue = checkinInput.value;
      if (checkinValue) {
        const checkinDate = new Date(`${checkinValue}T00:00`);
        const minCheckout = formatDate(addDays(checkinDate, 1));
        checkoutInput.min = minCheckout;
        if (!checkoutInput.value || checkoutInput.value < minCheckout) {
          checkoutInput.value = minCheckout;
        }
      } else {
        checkoutInput.min = defaultCheckoutMin;
        if (checkoutInput.value && checkoutInput.value < defaultCheckoutMin) {
          checkoutInput.value = defaultCheckoutMin;
        }
      }
    });
  }

  const bookingForm = document.getElementById('booking-form');
  if (bookingForm && checkinInput && checkoutInput) {
    const formatForQuery = value => {
      if (!value) return '';
      const [year, month, day] = value.split('-');
      return `${day}-${month}-${year}`;
    };

    bookingForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!bookingForm.reportValidity()) return;

      const checkinValue = checkinInput.value;
      const checkoutValue = checkoutInput.value;

      const baseUrl = 'https://motor.winpax.com.ar/search.php?hotel_id=135&lang=es&currency_code=';
      const params = new URLSearchParams({
        date_from: formatForQuery(checkinValue),
        date_to: formatForQuery(checkoutValue),
      });

      window.location.href = `${baseUrl}&${params.toString()}`;
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
      const videoSrc = `./images-source/hero/videos/${encodeURIComponent(selected)}`;
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
