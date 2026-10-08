document.addEventListener('DOMContentLoaded', () => {
  const toAbsoluteUrl = path => {
    try {
      return new URL(path, window.location.origin).href;
    } catch (error) {
      return path;
    }
  };

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
    const guestsInput = document.getElementById('booking-guests');

    bookingForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!bookingForm.reportValidity()) return;

      // El motor sirve cada idioma en su propia ruta (/es, /en), no como parametro.
      const lang = document.documentElement.lang === 'en' ? 'en' : 'es';

      // Los campos date ya entregan YYYY-MM-DD, que es el formato que espera el motor.
      const params = new URLSearchParams({
        entrada: checkinInput.value,
        salida: checkoutInput.value,
        adultos: guestsInput ? guestsInput.value : '2',
      });

      window.open(`https://reservas.palosantohotel.com/${lang}?${params.toString()}`, '_blank', 'noopener');
    });
  }

  // Reservas en mobile y tablet: el formulario se abre como panel inferior
  const bookingPanel = document.getElementById('booking-panel');
  const bookingOpeners = document.querySelectorAll('[data-booking-open]');
  if (bookingPanel && bookingOpeners.length) {
    const bookingBackdrop = document.querySelector('[data-booking-backdrop]');
    const setBookingOpen = open => {
      bookingPanel.classList.toggle('is-open', open);
      if (bookingBackdrop) bookingBackdrop.hidden = !open;
      bookingOpeners.forEach(btn => btn.setAttribute('aria-expanded', String(open)));
      if (open && checkinInput) checkinInput.focus();
    };

    bookingOpeners.forEach(btn => btn.addEventListener('click', () => setBookingOpen(true)));
    document.querySelectorAll('[data-booking-close]').forEach(el => {
      el.addEventListener('click', () => setBookingOpen(false));
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && bookingPanel.classList.contains('is-open')) setBookingOpen(false);
    });
  }

  // Hero: los tres videos se encadenan con un fundido y cada uno arranca sobre su imagen fija.
  // El primero se elige al azar en el HTML. Con ahorro de datos o movimiento reducido no arranca
  // solo: queda la imagen y se puede reproducir con los botones.
  const hero = document.querySelector('[data-hero]');
  const heroClips = hero ? Array.from(hero.querySelectorAll('[data-hero-clip]')) : [];
  if (hero && heroClips.length) {
    const chapters = Array.from(hero.querySelectorAll('[data-hero-chapter]'));
    const controls = hero.querySelector('[data-hero-controls]');
    const toggle = hero.querySelector('[data-hero-toggle]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    let current = Math.max(0, heroClips.findIndex(clip => clip.hasAttribute('data-hero-active')));
    let paused = reduceMotion || saveData;
    let started = false;
    let inView = true;
    let frame = 0;
    let skipTimer = 0;
    let prepareTimer = 0;

    const wrap = index => (index + heroClips.length) % heroClips.length;
    const fillOf = index => (chapters[index] ? chapters[index].querySelector('[data-hero-fill]') : null);

    const tick = () => {
      const video = heroClips[current].querySelector('video');
      const fill = fillOf(current);
      if (video && fill && video.duration) {
        fill.style.transform = `scaleX(${Math.min(1, video.currentTime / video.duration)})`;
      }
      frame = requestAnimationFrame(tick);
    };

    const stopTick = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    // Crea el video de un clip la primera vez que hace falta.
    // En celulares prueba primero el corte vertical y, si no está, el horizontal.
    const videoOf = index => {
      const clip = heroClips[index];
      if (clip.dataset.failed) return null;
      const existing = clip.querySelector('video');
      if (existing) return existing;

      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      const sources = [isMobile ? clip.dataset.videoMobile : '', clip.dataset.video].filter(Boolean);
      if (!sources.length) return null;

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-hidden', 'true');
      video.preload = 'auto';
      video.className = 'absolute inset-0 h-full w-full object-cover';
      let attempt = 0;

      video.addEventListener('playing', () => {
        video.classList.add('is-playing');
        // Con este clip ya en marcha, se empieza a cargar el siguiente
        if (heroClips[current] === clip) {
          clearTimeout(prepareTimer);
          prepareTimer = setTimeout(() => prepare(wrap(current + 1)), 3000);
        }
      });
      video.addEventListener('ended', () => {
        if (heroClips[current] === clip) show(index + 1);
      });
      video.addEventListener('error', () => {
        attempt += 1;
        if (attempt < sources.length) {
          video.src = sources[attempt];
          if (heroClips[current] === clip) play();
          return;
        }
        // Sin video queda la imagen fija y la secuencia sigue
        clip.dataset.failed = 'true';
        video.remove();
        if (heroClips[current] === clip) play();
      });

      video.src = sources[0];
      clip.append(video);
      return video;
    };

    const prepare = index => {
      heroClips[index].classList.remove('hidden');
      videoOf(index);
    };

    function play() {
      clearTimeout(skipTimer);
      if (!started || paused || !inView) return;
      const video = videoOf(current);
      if (!video) {
        // Clip sin video: se muestra su imagen unos segundos y sigue el próximo
        skipTimer = setTimeout(() => show(current + 1), 6000);
        return;
      }
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(error => {
          // Si el navegador bloquea la reproducción automática, queda la imagen y el botón de play
          if (error && error.name === 'NotAllowedError') setPaused(true);
        });
      }
      if (!frame) frame = requestAnimationFrame(tick);
    }

    const updateChapters = () => {
      chapters.forEach((button, index) => {
        const active = index === current;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        const fill = fillOf(index);
        if (fill && !active) fill.style.transform = 'scaleX(0)';
      });
    };

    function show(index) {
      index = wrap(index);
      clearTimeout(skipTimer);
      const previous = heroClips[current];
      const next = heroClips[index];
      if (previous !== next) {
        next.classList.remove('hidden');
        void next.offsetWidth; // para que el fundido arranque desde transparente
        next.classList.replace('opacity-0', 'opacity-100');
        previous.classList.replace('opacity-100', 'opacity-0');
        const previousVideo = previous.querySelector('video');
        if (previousVideo) {
          setTimeout(() => {
            if (heroClips[current] !== previous) previousVideo.pause();
          }, 1300);
        }
        current = index;
      }
      const video = videoOf(index);
      if (video) {
        try {
          video.currentTime = 0;
        } catch (error) {
          /* el video todavía no tiene datos */
        }
      }
      const fill = fillOf(index);
      if (fill) fill.style.transform = 'scaleX(0)';
      updateChapters();
      play();
    }

    const syncToggle = () => {
      if (!toggle) return;
      toggle.setAttribute('aria-label', paused ? toggle.dataset.labelPlay : toggle.dataset.labelPause);
      toggle.querySelector('[data-icon-pause]').classList.toggle('hidden', paused);
      toggle.querySelector('[data-icon-play]').classList.toggle('hidden', !paused);
    };

    function setPaused(value) {
      paused = value;
      syncToggle();
      if (paused) {
        clearTimeout(skipTimer);
        const video = heroClips[current].querySelector('video');
        if (video) video.pause();
        stopTick();
      } else {
        play();
      }
    }

    if (toggle) toggle.addEventListener('click', () => setPaused(!paused));
    chapters.forEach((button, index) => {
      button.addEventListener('click', () => {
        paused = false;
        syncToggle();
        show(index);
      });
    });

    // Fuera de pantalla el video se detiene y vuelve a arrancar al regresar
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        inView = entries[entries.length - 1].isIntersecting;
        if (inView) {
          play();
        } else {
          clearTimeout(skipTimer);
          const video = heroClips[current].querySelector('video');
          if (video) video.pause();
          stopTick();
        }
      }).observe(hero);
    }

    const startHero = () => {
      started = true;
      if (controls) {
        controls.classList.remove('hidden');
        controls.classList.add('flex');
      }
      updateChapters();
      setPaused(paused);
    };

    if (document.readyState === 'complete') {
      startHero();
    } else {
      window.addEventListener('load', startHero, { once: true });
    }
  }

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  const reviewsViewport = document.querySelector('[data-reviews-carousel]');
  if (reviewsViewport) {
    const track = reviewsViewport.querySelector('[data-reviews-track]');
    const controlsContainer = reviewsViewport.parentElement;
    const prevButton = controlsContainer?.querySelector('[data-reviews-prev]');
    const nextButton = controlsContainer?.querySelector('[data-reviews-next]');
    const slides = track ? Array.from(track.children) : [];

    if (track && slides.length && prevButton && nextButton) {
      let currentIndex = 0;

      const setUniformHeights = () => {
        slides.forEach((slide) => {
          slide.style.minHeight = '';
        });

        const tallest = slides.reduce((max, slide) => {
          const { height } = slide.getBoundingClientRect();
          return height > max ? height : max;
        }, 0);

        if (tallest > 0) {
          slides.forEach((slide) => {
            slide.style.minHeight = `${tallest}px`;
          });
        }
      };

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

      const handleResize = () => {
        window.requestAnimationFrame(() => {
          setUniformHeights();
          updateCarousel();
        });
      };

      window.addEventListener('resize', handleResize);

      setUniformHeights();
      updateCarousel();

      window.addEventListener('load', () => {
        setUniformHeights();
      });
    }
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
          const widths = (button.getAttribute('data-room-widths') || '800,1200,1600')
            .split(',')
            .map(value => Number(value.trim()))
            .filter(value => Number.isFinite(value) && value > 0);
          const dataIndex = Number(button.dataset.premiumThumb);
          const order = Number.isNaN(dataIndex) ? index : dataIndex;
          return { button, slug, alt, widths, order };
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
          slide.button.classList.toggle('ring-white', isActive);
          slide.button.classList.toggle('ring-1', !isActive);
          slide.button.classList.toggle('ring-transparent', !isActive);
        });
      };

      const buildSrcSet = (slug, format, sizes) => {
        return sizes
          .map(size => `${toAbsoluteUrl(`/images/hotel/${slug}-${size}.${format}`)} ${size}w`)
          .join(', ');
      };

      const updateSources = (slug, widths) => {
        const sizes = widths && widths.length ? widths : [800, 1200, 1600];
        if (sourceAvif) {
          sourceAvif.setAttribute('srcset', buildSrcSet(slug, 'avif', sizes));
        }
        if (sourceWebp) {
          sourceWebp.setAttribute('srcset', buildSrcSet(slug, 'webp', sizes));
        }
        heroImage.setAttribute('src', toAbsoluteUrl(`/images-source/hotel/${slug}.jpg`));
      };

      const goToSlide = nextIndex => {
        if (nextIndex < 0 || nextIndex >= totalSlides) return;
        const slide = slides[nextIndex];
        currentIndex = nextIndex;
        updateSources(slide.slug, slide.widths);
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

// Galería de fotos
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('[data-filter]');
  const items = document.querySelectorAll('.photo-item');
  const removablePositionClasses = [
    'md:col-start-1',
    'md:col-start-2',
    'md:col-start-3',
    'md:col-start-4',
    'md:row-start-1',
    'md:row-start-2',
    'md:row-start-3',
    'md:row-start-4',
    'md:row-start-5',
    'md:row-start-6',
    'md:row-start-7',
    'md:row-start-8',
    'md:row-start-9',
    'md:row-start-10',
    'md:row-start-11',
    'md:row-start-12',
    'md:row-start-13',
    'md:row-start-14',
    'md:row-start-15',
    'md:row-start-16',
    'md:row-start-17',
    'md:row-start-18',
    'md:row-start-19',
    'md:row-start-20',
  ];
  const layoutPositions = {
    pileta: ['md:col-start-1', 'md:row-start-1'],
    deluxe: ['md:col-start-3', 'md:row-start-1'],
    jardin: ['md:col-start-3', 'md:row-start-2'],
    pasillos: ['md:col-start-4', 'md:row-start-1'],
    'suite-8032': ['md:col-start-1', 'md:row-start-3'],
    'bath-8147': ['md:col-start-1', 'md:row-start-4'],
    'cama-8119': ['md:col-start-2', 'md:row-start-3'],
    'bath-8250': ['md:col-start-2', 'md:row-start-4'],
    'jardin-3054': ['md:col-start-3', 'md:row-start-3'],
    'fachada-verde': ['md:col-start-1', 'md:row-start-5'],
    'lobby-16': ['md:col-start-3', 'md:row-start-5'],
    'jardin-0825': ['md:col-start-4', 'md:row-start-5'],
    'terrace-5255': ['md:col-start-1', 'md:row-start-7'],
    'suite-cama-5323': ['md:col-start-1', 'md:row-start-8'],
    'lobby-2509': ['md:col-start-2', 'md:row-start-7'],
    'lobby-escultura': ['md:col-start-4', 'md:row-start-7'],
    'premium-8336': ['md:col-start-1', 'md:row-start-9'],
    'premium-7987': ['md:col-start-3', 'md:row-start-9'],
    'suite-8343': ['md:col-start-1', 'md:row-start-11'],
    'fachada-psanto05': ['md:col-start-2', 'md:row-start-11'],
    'deluxe-8266': ['md:col-start-1', 'md:row-start-12'],
    'desayuno-2345': ['md:col-start-2', 'md:row-start-12'],
    'desayuno-2250': ['md:col-start-3', 'md:row-start-11'],
    'palier-5190': ['md:col-start-1', 'md:row-start-13'],
    'resto-byn-2139': ['md:col-start-3', 'md:row-start-13'],
    'bikes-0299': ['md:col-start-1', 'md:row-start-15'],
    'resto-8187': ['md:col-start-1', 'md:row-start-16'],
    'desayuno-dic23': ['md:col-start-2', 'md:row-start-15'],
    'resto-byn-2113': ['md:col-start-4', 'md:row-start-15'],
    'bath-vertical-8318': ['md:col-start-1', 'md:row-start-19'],
    'fachada-205': ['md:col-start-2', 'md:row-start-19'],
    'rooftop-3142': ['md:col-start-2', 'md:row-start-20'],
    'gimnasio-1744': ['md:col-start-3', 'md:row-start-19'],
  };

  const setActiveButton = activeButton => {
    buttons.forEach(btn => {
      const isActive = btn === activeButton;
      btn.classList.toggle('border', isActive);
      btn.classList.toggle('border-white', isActive);
      btn.classList.toggle('border-none', !isActive);
    });
  };

  const applyFilter = filter => {
    items.forEach(item => {
      const tags = item.dataset.tags
        .split(',')
        .map(t => t.trim().toLowerCase());

      if (filter === 'all' || tags.includes(filter)) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  };

  const applyLayout = isAll => {
    items.forEach(item => {
      removablePositionClasses.forEach(cls => item.classList.remove(cls));

      if (!isAll) return;

      const key = (item.dataset.layout || '').trim().toLowerCase();
      const classes = layoutPositions[key];
      if (!classes) return;
      classes.forEach(cls => item.classList.add(cls));
    });
  };

  buttons.forEach(button => {
    button.classList.add('border-none');

    button.addEventListener('click', () => {
      const filter = (button.dataset.filter || '').toLowerCase();
      applyFilter(filter);
      applyLayout(filter === 'all');
      setActiveButton(button);
    });
  });

  if (buttons.length) {
    const first = buttons[0];
    applyLayout(true);
    applyFilter((first.dataset.filter || 'all').toLowerCase());
    setActiveButton(first);
  }
});
