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

  const reviewsViewport = document.querySelector('[data-reviews-carousel]');
  if (reviewsViewport) {
    const track = reviewsViewport.querySelector('[data-reviews-track]');
    const controlsContainer = reviewsViewport.parentElement;
    const prevButton = controlsContainer?.querySelector('[data-reviews-prev]');
    const nextButton = controlsContainer?.querySelector('[data-reviews-next]');
    const slides = track ? Array.from(track.children) : [];

    if (track && slides.length && prevButton && nextButton) {
      let currentIndex = 0;

      const getSlidesPerView = () => {
        if (window.innerWidth >= 1280) return 3;
        if (window.innerWidth >= 768) return 2;
        return 1;
      };

      const getGap = () => {
        const styles = window.getComputedStyle(track);
        const gapValue = parseFloat(styles.columnGap || styles.gap || '0');
        return Number.isFinite(gapValue) ? gapValue : 0;
      };

      const updateButtons = (maxIndex, shouldShowControls) => {
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex >= maxIndex;

        const visibility = shouldShowControls ? 'visible' : 'hidden';
        const pointerEvents = shouldShowControls ? 'auto' : 'none';
        prevButton.style.visibility = visibility;
        nextButton.style.visibility = visibility;
        prevButton.style.pointerEvents = pointerEvents;
        nextButton.style.pointerEvents = pointerEvents;
      };

      const updateCarousel = () => {
        const slidesPerView = getSlidesPerView();
        const maxIndex = Math.max(0, slides.length - slidesPerView);
        currentIndex = Math.min(currentIndex, maxIndex);

        const slideWidth = slides[0].getBoundingClientRect().width;
        const offset = currentIndex * (slideWidth + getGap());
        track.style.transform = `translateX(-${offset}px)`;

        updateButtons(maxIndex, slides.length > slidesPerView);
      };

      prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex -= 1;
          updateCarousel();
        }
      });

      nextButton.addEventListener('click', () => {
        const slidesPerView = getSlidesPerView();
        const maxIndex = Math.max(0, slides.length - slidesPerView);
        if (currentIndex < maxIndex) {
          currentIndex += 1;
          updateCarousel();
        }
      });

      window.addEventListener('resize', () => {
        window.requestAnimationFrame(updateCarousel);
      });

      updateCarousel();
    }
  }

  const experienceGallery = document.querySelector('[data-experience-gallery]');
  if (experienceGallery) {
    const viewport = experienceGallery.querySelector('[data-experience-viewport]');
    const track = experienceGallery.querySelector('[data-experience-track]');
    const slides = track ? Array.from(track.children) : [];
    const prevButton = document.querySelector('[data-experience-gallery-prev]');
    const nextButton = document.querySelector('[data-experience-gallery-next]');
    const status = document.querySelector('[data-experience-gallery-status]');
    let currentIndex = 0;

    if (viewport && track && slides.length && prevButton && nextButton) {
      const updateStatus = () => {
        if (status) status.textContent = `${currentIndex + 1} / ${slides.length}`;
      };

      const updateTransform = () => {
        const width = viewport.getBoundingClientRect().width;
        track.style.transform = `translateX(-${currentIndex * width}px)`;
      };

      const goToSlide = nextIndex => {
        currentIndex = (nextIndex + slides.length) % slides.length;
        updateTransform();
        updateStatus();
      };

      prevButton.addEventListener('click', () => goToSlide(currentIndex - 1));
      nextButton.addEventListener('click', () => goToSlide(currentIndex + 1));
      window.addEventListener('resize', () => {
        window.requestAnimationFrame(updateTransform);
      });

      updateStatus();
      updateTransform();
    }
  }

  const featureGallery = document.querySelector('[data-feature-gallery]');
  if (featureGallery) {
    const viewport = featureGallery.querySelector('[data-feature-viewport]');
    const track = featureGallery.querySelector('[data-feature-track]');
    const slides = track ? Array.from(track.children) : [];
    const prevButton = featureGallery.querySelector('[data-feature-gallery-prev]');
    const nextButton = featureGallery.querySelector('[data-feature-gallery-next]');
    const status = featureGallery.querySelector('[data-feature-gallery-status]');
    let currentIndex = 0;

    if (viewport && track && slides.length && prevButton && nextButton) {
      const updateStatus = () => {
        if (status) status.textContent = `${currentIndex + 1} / ${slides.length}`;
      };

      const updateTransform = () => {
        const width = viewport.getBoundingClientRect().width;
        track.style.transform = `translateX(-${currentIndex * width}px)`;
      };

      const goToSlide = index => {
        currentIndex = (index + slides.length) % slides.length;
        updateTransform();
        updateStatus();
      };

      prevButton.addEventListener('click', () => goToSlide(currentIndex - 1));
      nextButton.addEventListener('click', () => goToSlide(currentIndex + 1));
      window.addEventListener('resize', () => {
        window.requestAnimationFrame(updateTransform);
      });

      updateStatus();
      updateTransform();
    }
  }

  const experienceAccordion = document.querySelector('[data-experience-accordion]');
  if (experienceAccordion) {
    const items = Array.from(experienceAccordion.querySelectorAll('[data-experience-accordion-item]'));

    const setIconState = (trigger, expanded) => {
      const icon = trigger.querySelector('svg');
      if (icon) icon.style.transform = expanded ? 'rotate(45deg)' : 'rotate(0deg)';
    };

    const closeAll = () => {
      items.forEach(item => {
        const trigger = item.querySelector('[data-experience-accordion-trigger]');
        const panel = item.querySelector('[data-experience-accordion-panel]');
        if (trigger && panel) {
          trigger.setAttribute('aria-expanded', 'false');
          panel.style.maxHeight = '0px';
          setIconState(trigger, false);
        }
      });
    };

    items.forEach((item, index) => {
      const trigger = item.querySelector('[data-experience-accordion-trigger]');
      const panel = item.querySelector('[data-experience-accordion-panel]');
      if (!trigger || !panel) return;

      trigger.addEventListener('click', () => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        closeAll();
        if (!isExpanded) {
          trigger.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = `${panel.scrollHeight}px`;
          setIconState(trigger, true);
        }
      });

      if (index === 0) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = `${panel.scrollHeight}px`;
        setIconState(trigger, true);
      }
    });
  }

  const roomGallery = document.querySelector('[data-room-gallery]');
  if (roomGallery) {
    const heroImage = roomGallery.querySelector('[data-room-hero]');
    const status = roomGallery.querySelector('[data-room-status]');
    const prevButton = roomGallery.querySelector('[data-room-prev]');
    const nextButton = roomGallery.querySelector('[data-room-next]');
    const thumbButtons = Array.from(roomGallery.querySelectorAll('[data-room-thumb]'));
    const picture = roomGallery.querySelector('[data-room-picture]');
    const sourceAvif = picture?.querySelector('[data-room-source-avif]');
    const sourceWebp = picture?.querySelector('[data-room-source-webp]');

    if (heroImage && status && thumbButtons.length) {
      const slides = thumbButtons
        .map((button, index) => {
          const slug = button.getAttribute('data-room-slug');
          if (!slug) return null;
          const alt = button.getAttribute('data-room-alt') || 'Habitación Premium en Palo Santo Hotel';
          const dataIndex = Number(button.dataset.premiumThumb);
          const order = Number.isNaN(dataIndex) ? index : dataIndex;
          return { button, slug, alt, order };
        })
        .filter(Boolean)
        .sort((a, b) => a.order - b.order);

      if (!slides.length) return;

      slides.forEach((slide, index) => {
        slide.index = index;
          slide.button.dataset.roomThumb = String(index);
      });

      const totalSlides = slides.length;
      let currentIndex = 0;
      let autoplayId;
      const autoplayDelay = 5000;
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      const updateStatus = () => {
        status.textContent = `${currentIndex + 1} / ${totalSlides}`;
      };

      const setActiveThumb = () => {
        slides.forEach((slide, index) => {
          const isActive = index === currentIndex;
          slide.button.setAttribute('aria-pressed', String(isActive));
          slide.button.classList.toggle('ring-2', isActive);
          slide.button.classList.toggle('ring-black', isActive);
          slide.button.classList.toggle('ring-1', !isActive);
          slide.button.classList.toggle('ring-transparent', !isActive);
        });
      };

      const buildSrcSet = (slug, format) => {
        const sizes = [800, 1200, 1600];
        return sizes
          .map(size => `/images/hotel/${slug}-${size}.${format} ${size}w`)
          .join(', ');
      };

      const updateSources = slug => {
        if (sourceAvif) {
          sourceAvif.setAttribute('srcset', buildSrcSet(slug, 'avif'));
        }
        if (sourceWebp) {
          sourceWebp.setAttribute('srcset', buildSrcSet(slug, 'webp'));
        }
        heroImage.setAttribute('src', `/images-source/hotel/${slug}.jpg`);
      };

      const goToSlide = nextIndex => {
        if (nextIndex < 0 || nextIndex >= totalSlides) return;
        const slide = slides[nextIndex];
        currentIndex = nextIndex;
        updateSources(slide.slug);
        heroImage.setAttribute('alt', slide.alt);
        updateStatus();
        setActiveThumb();
      };

      const getNextIndex = direction => {
        if (direction === 'prev') {
          return currentIndex === 0 ? totalSlides - 1 : currentIndex - 1;
        }
        return currentIndex === totalSlides - 1 ? 0 : currentIndex + 1;
      };

      const stopAutoplay = () => {
        if (autoplayId) {
          window.clearInterval(autoplayId);
          autoplayId = undefined;
        }
      };

      const startAutoplay = () => {
        if (motionQuery.matches || totalSlides <= 1) return;
        stopAutoplay();
        autoplayId = window.setInterval(() => {
          goToSlide(getNextIndex('next'));
        }, autoplayDelay);
      };

      prevButton?.addEventListener('click', () => {
        goToSlide(getNextIndex('prev'));
        startAutoplay();
      });

      nextButton?.addEventListener('click', () => {
        goToSlide(getNextIndex('next'));
        startAutoplay();
      });

      slides.forEach((slide, index) => {
        slide.button.addEventListener('click', () => {
          goToSlide(index);
          startAutoplay();
        });
      });

      ['mouseenter', 'focusin'].forEach(eventName => {
        roomGallery.addEventListener(eventName, stopAutoplay);
      });

      roomGallery.addEventListener('mouseleave', () => {
        startAutoplay();
      });

      roomGallery.addEventListener('focusout', event => {
        if (!roomGallery.contains(event.relatedTarget)) {
          startAutoplay();
        }
      });

      const handleMotionPreference = () => {
        if (motionQuery.matches) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      };

      if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', handleMotionPreference);
      } else if (typeof motionQuery.addListener === 'function') {
        motionQuery.addListener(handleMotionPreference);
      }

      goToSlide(0);
      startAutoplay();
    }
  }

  document.querySelectorAll('[data-room-accordion]').forEach(accordion => {
    const summary = accordion.querySelector('summary');
    if (!summary) return;
    const icon = summary.querySelector('svg');

    const updateIcon = () => {
      if (!icon) return;
      const isOpen = accordion.open;
      if (isOpen) {
        icon.classList.add('rotate-180');
      } else {
        icon.classList.remove('rotate-180');
      }
    };

    summary.addEventListener('click', () => {
      requestAnimationFrame(updateIcon);
    });

    updateIcon();
  });
});
