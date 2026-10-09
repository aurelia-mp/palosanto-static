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
});

// Galería de fotos: visor a pantalla completa, por secciones (rooftop, suites, gimnasio,
// habitaciones y planta baja). La foto se ve entera, sin bajadas ni velos encima.
// Los datos salen del JSON #galeria-datos de la página. Los botones con data-visor-abrir
// lo abren en una sección, y con data-visor-foto, en una foto puntual. El hash
// (#fotos-terrace-suite) permite enlazar una sección, y el botón "atrás" del celular lo cierra.
document.addEventListener('DOMContentLoaded', () => {
  const visor = document.querySelector('[data-visor]');
  const fuente = document.getElementById('galeria-datos');
  if (!visor || !fuente) return;

  let datos;
  try {
    datos = JSON.parse(fuente.textContent);
  } catch (error) {
    return;
  }
  const secciones = datos.secciones || [];
  if (!secciones.length) return;

  const textos = datos.textos || {};
  const prefijo = `#${datos.hash || 'fotos'}-`;
  const uno = selector => visor.querySelector(selector);
  const ui = {
    piso: uno('[data-visor-piso]'),
    titulo: uno('[data-visor-titulo]'),
    seccion: Array.from(visor.querySelectorAll('[data-visor-seccion]')),
    escena: uno('[data-visor-escena]'),
    img: uno('[data-visor-img]'),
    avif: uno('[data-visor-avif]'),
    webp: uno('[data-visor-webp]'),
    contador: uno('[data-visor-contador]'),
    link: uno('[data-visor-link]'),
    linkTexto: uno('[data-visor-link-texto]'),
    linkCorto: uno('[data-visor-link-corto]'),
    tira: uno('[data-visor-tira]'),
    segmentos: uno('[data-visor-segmentos]'),
    secAnterior: uno('[data-visor-seccion-anterior]'),
    secSiguiente: uno('[data-visor-seccion-siguiente]'),
    anteriorCorto: uno('[data-visor-anterior-corto]'),
    anteriorNombre: uno('[data-visor-anterior-nombre]'),
    siguienteCorto: uno('[data-visor-siguiente-corto]'),
    siguienteNombre: uno('[data-visor-siguiente-nombre]'),
    cerrar: uno('[data-visor-cerrar]'),
  };
  const formato = (plantilla, valores) => (plantilla || '').replace(/\{(\w+)\}/g, (_, clave) => valores[clave] ?? '');
  const dos = n => String(n).padStart(2, '0');
  const srcset = (foto, ext) => foto.ws.map(w => `${foto.b}-${w}.${ext} ${w}w`).join(', ');
  const nombre = seccion => `${seccion.piso} · ${seccion.titulo}`;
  const hashDe = k => prefijo + secciones[k].id;

  let s = 0;
  let i = 0;
  let abierto = false;
  let conHistorial = false;
  let foco = null;
  let tiraDe = -1;

  // Un segmento por sección: muestra en qué parte del recorrido está y permite saltar
  const segmentos = secciones.map((seccion, k) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'flex h-7 min-w-0 flex-1 items-center';
    boton.title = nombre(seccion);
    boton.setAttribute('aria-label', nombre(seccion));
    boton.innerHTML = '<span class="block h-0.5 w-full bg-white/30"></span>';
    boton.addEventListener('click', () => mostrar(k, 0));
    ui.segmentos.appendChild(boton);
    return boton;
  });

  // Miniaturas de la sección actual
  const armarTira = () => {
    const seccion = secciones[s];
    ui.tira.textContent = '';
    ui.tira.setAttribute('aria-label', formato(textos.tira, { titulo: seccion.titulo }));
    seccion.fotos.forEach((foto, k) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'shrink-0 outline outline-2 outline-offset-2 outline-transparent opacity-50 transition-opacity hover:opacity-100';
      boton.setAttribute('aria-label', foto.alt);
      const miniatura = document.createElement('img');
      miniatura.src = `${foto.b}-${foto.ws[0]}.webp`;
      miniatura.alt = '';
      miniatura.width = foto.w;
      miniatura.height = foto.h;
      miniatura.loading = 'lazy';
      miniatura.decoding = 'async';
      miniatura.className = 'h-11 w-auto max-w-none md:h-[60px]';
      boton.appendChild(miniatura);
      boton.addEventListener('click', () => mostrar(s, k));
      ui.tira.appendChild(boton);
    });
    tiraDe = s;
  };

  // Deja descargada la foto que sigue, en el mismo formato que eligió el navegador
  const precargar = (ns, ni) => {
    const foto = secciones[ns] && secciones[ns].fotos[ni];
    if (!foto) return;
    const img = new Image();
    img.sizes = '100vw';
    img.srcset = srcset(foto, /\.avif(\?|$)/.test(ui.img.currentSrc) ? 'avif' : 'webp');
  };

  const pintar = () => {
    const seccion = secciones[s];
    const foto = seccion.fotos[i];
    const anterior = secciones[s - 1];
    const siguiente = secciones[s + 1];

    ui.piso.textContent = seccion.piso;
    ui.titulo.textContent = seccion.titulo;
    const numero = formato(textos.seccion, { n: s + 1, total: secciones.length });
    ui.seccion.forEach(el => {
      el.textContent = numero;
    });

    // La foto completa (object-contain); aparece con un fundido cuando termina de cargar
    const grande = `${foto.b}-${foto.ws[foto.ws.length - 1]}.webp`;
    if (ui.img.getAttribute('src') !== grande) {
      ui.img.classList.add('opacity-0');
      ui.avif.srcset = srcset(foto, 'avif');
      ui.webp.srcset = srcset(foto, 'webp');
      ui.img.src = grande;
    }
    ui.img.alt = foto.alt;
    ui.contador.textContent = `${dos(i + 1)} / ${dos(seccion.fotos.length)}`;

    ui.link.classList.toggle('hidden', !seccion.link);
    if (seccion.link) {
      ui.link.href = seccion.link.href;
      ui.linkTexto.textContent = seccion.link.texto;
      ui.linkCorto.textContent = seccion.link.corto;
    }

    ui.secAnterior.disabled = !anterior;
    ui.secSiguiente.disabled = !siguiente;
    ui.anteriorCorto.textContent = anterior ? anterior.corto : textos.primera;
    ui.anteriorNombre.textContent = anterior ? nombre(anterior) : textos.primera;
    ui.siguienteCorto.textContent = siguiente ? siguiente.corto : textos.ultima;
    ui.siguienteNombre.textContent = siguiente ? nombre(siguiente) : textos.ultima;

    segmentos.forEach((boton, k) => {
      const actual = k === s;
      boton.setAttribute('aria-current', actual ? 'true' : 'false');
      boton.firstChild.className = actual ? 'block h-[3px] w-full bg-white' : 'block h-0.5 w-full bg-white/30';
    });

    if (tiraDe !== s) armarTira();
    Array.from(ui.tira.children).forEach((boton, k) => {
      const actual = k === i;
      boton.setAttribute('aria-current', actual ? 'true' : 'false');
      boton.classList.toggle('opacity-50', !actual);
      boton.classList.toggle('outline-white', actual);
      boton.classList.toggle('outline-transparent', !actual);
      if (actual) {
        ui.tira.scrollTo({ left: boton.offsetLeft - (ui.tira.clientWidth - boton.offsetWidth) / 2, behavior: 'smooth' });
      }
    });

    if (i < seccion.fotos.length - 1) precargar(s, i + 1);
    else precargar((s + 1) % secciones.length, 0);
  };

  const ir = (ns, ni) => {
    s = (ns + secciones.length) % secciones.length;
    i = Math.max(0, Math.min(ni, secciones[s].fotos.length - 1));
    pintar();
  };

  const mostrar = (ns, ni) => {
    const antes = s;
    ir(ns, ni);
    if (abierto && s !== antes) history.replaceState(history.state, '', hashDe(s));
  };

  // Las flechas recorren todas las fotos: al terminar una sección pasan a la siguiente
  const paso = delta => {
    const fotos = secciones[s].fotos;
    if (delta > 0) {
      if (i < fotos.length - 1) mostrar(s, i + 1);
      else mostrar(s + 1, 0);
    } else if (i > 0) {
      mostrar(s, i - 1);
    } else {
      const previa = (s - 1 + secciones.length) % secciones.length;
      mostrar(previa, secciones[previa].fotos.length - 1);
    }
  };

  const abrir = (ns, ni, desdeHash = false) => {
    if (!abierto) foco = document.activeElement;
    ir(ns, ni);
    if (!abierto) {
      abierto = true;
      visor.classList.remove('hidden');
      visor.classList.add('flex');
      document.documentElement.classList.add('overflow-hidden');
      ui.cerrar.focus();
    }
    if (!desdeHash) {
      history.pushState({ visor: true }, '', hashDe(s));
      conHistorial = true;
    }
  };

  const cerrar = (desdeHistorial = false) => {
    if (!abierto) return;
    abierto = false;
    visor.classList.add('hidden');
    visor.classList.remove('flex');
    document.documentElement.classList.remove('overflow-hidden');
    if (!desdeHistorial) {
      if (conHistorial) history.back();
      else history.replaceState(null, '', location.pathname + location.search);
    }
    conHistorial = false;
    if (foco && document.contains(foco)) foco.focus({ preventScroll: true });
    foco = null;
  };

  const seccionDelHash = () => {
    if (!location.hash.startsWith(prefijo)) return -1;
    const id = decodeURIComponent(location.hash.slice(prefijo.length));
    return secciones.findIndex(seccion => seccion.id === id);
  };

  document.querySelectorAll('[data-visor-abrir]').forEach(boton => {
    boton.addEventListener('click', event => {
      const k = secciones.findIndex(seccion => seccion.id === boton.dataset.visorAbrir);
      if (k < 0) return;
      event.preventDefault();
      const n = secciones[k].fotos.findIndex(foto => foto.id === boton.dataset.visorFoto);
      abrir(k, Math.max(0, n));
    });
  });

  ui.cerrar.addEventListener('click', () => cerrar());
  visor.querySelectorAll('[data-visor-anterior]').forEach(boton => boton.addEventListener('click', () => paso(-1)));
  visor.querySelectorAll('[data-visor-siguiente]').forEach(boton => boton.addEventListener('click', () => paso(1)));
  ui.secAnterior.addEventListener('click', () => {
    if (s > 0) mostrar(s - 1, 0);
  });
  ui.secSiguiente.addEventListener('click', () => {
    if (s < secciones.length - 1) mostrar(s + 1, 0);
  });
  ui.img.addEventListener('load', () => ui.img.classList.remove('opacity-0'));
  ui.img.addEventListener('error', () => ui.img.classList.remove('opacity-0'));

  document.addEventListener('keydown', event => {
    if (!abierto) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      cerrar();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      paso(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Tab') {
      // Mientras el visor está abierto, el foco no sale de él
      const enfocables = Array.from(visor.querySelectorAll('a[href], button:not([disabled])')).filter(el => el.offsetParent !== null);
      if (!enfocables.length) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
      }
    }
  });

  // En el celular se cambia de foto deslizando el dedo
  let toque = null;
  ui.escena.addEventListener('touchstart', event => {
    toque = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  ui.escena.addEventListener('touchend', event => {
    if (!toque) return;
    const dx = event.changedTouches[0].clientX - toque.x;
    const dy = event.changedTouches[0].clientY - toque.y;
    toque = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) paso(dx < 0 ? 1 : -1);
  });

  window.addEventListener('popstate', () => {
    const k = seccionDelHash();
    if (abierto && k < 0) cerrar(true);
    else if (!abierto && k >= 0) abrir(k, 0, true);
  });

  const inicial = seccionDelHash();
  if (inicial >= 0) abrir(inicial, 0, true);
});
