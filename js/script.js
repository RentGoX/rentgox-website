/* =========================================================
   RentGoX — main script
   Sections:
   1. Loader
   2. Particle background canvas
   3. Header scroll state + mobile nav
   4. Scroll reveal (IntersectionObserver)
   5. Ripple buttons
   6. FAQ accordion
   7. Circular category wheel (drag + momentum + snap)
   ========================================================= */

const APP_LINK = 'https://play.google.com/store/apps/details?id=com.rentgox.com&pcampaignid=web_share';

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. LOADER ---------- */
  const loader = document.getElementById('loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('is-hidden'), 350);
    });
    // Fallback in case 'load' already fired
    setTimeout(() => loader.classList.add('is-hidden'), 2200);
  }

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 2. PARTICLE BACKGROUND ----------
     Disabled as part of the premium white theme (no glowing
     particles/stars). initParticles() is left defined below,
     untouched, in case it's ever needed again — it's simply
     not invoked here. */
  // initParticles();
  initHeroSlideshow();

  /* ---------- 3. HEADER + MOBILE NAV ---------- */
  const header = document.getElementById('site-header');
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mainNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mainNav.classList.remove('is-open'));
  });

  /* ---------- 4. SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- 5. RIPPLE BUTTONS ---------- */
  document.querySelectorAll('.ripple').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const dot = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.2;
      dot.className = 'ripple-dot';
      dot.style.width = dot.style.height = size + 'px';
      dot.style.left = (e.clientX - rect.left - size / 2) + 'px';
      dot.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    });
  });

  /* ---------- 6. FAQ ACCORDION ---------- */
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      item.closest('.accordion').querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('is-open');
        i.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- 7. 3D CATEGORY CAROUSEL ---------- */
  initCategoryCarousel3D();

  /* ---------- 9. ANIMATED STAT COUNTERS ---------- */
  initStatCounters();

  /* ---------- 10. TESTIMONIAL CAROUSEL ---------- */
  initTestimonials();

  /* ---------- 11. BACK TO TOP ---------- */
  initBackToTop();

  /* ---------- 12. SCREENSHOT SKELETON -> LOADED STATE ---------- */
  document.querySelectorAll('.screenshot-img').forEach(img => {
    const reveal = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth > 0) {
      reveal();
    } else {
      img.addEventListener('load', reveal);
    }
  });

  /* ---------- 8. ANY OTHER CATEGORY CARDS (e.g. future-services grid) ----------
     Any element on the page with a [data-category] attribute goes through
     the same openCategory() rule: Room/Apartment/PG/Hostel navigate straight
     to their listings page, everything else keeps existing behavior
     (currently these cards have no Coming Soon popup of their own, so
     nothing changes for Car/Bike/Electronics/Marriage Hall here). */
  document.querySelectorAll('[data-category]').forEach(card => {
    const key = card.dataset.category;
    if (!LIVE_CATEGORIES.includes(key)) return; // leave non-live cards untouched
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openCategory(key));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCategory(key);
      }
    });
  });

});

/* =========================================================
   Particle background — lightweight canvas, no dependencies
   ========================================================= */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = document.documentElement.scrollHeight;
  }

  function createParticles() {
    const count = Math.min(70, Math.floor((w * h) / 32000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      hue: Math.random() > 0.5 ? '109,94,245' : '52,209,191',
      alpha: Math.random() * 0.5 + 0.15
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }

  resize();
  createParticles();
  requestAnimationFrame(tick);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); createParticles(); }, 250);
  });
}

/* =========================================================
   Hero background slideshow — crossfades between 3-4 photos.
   Any image that fails to load (missing file) is skipped
   automatically, so this keeps working even with fewer photos.
   ========================================================= */
function initHeroSlideshow() {
  const container = document.getElementById('hero-bg');
  if (!container) return;
  const slides = Array.from(container.querySelectorAll('.hero-bg-slide'));
  if (slides.length <= 1) return;

  let current = 0;

  function goToNext() {
    const available = slides.filter(s => s.dataset.failed !== 'true');
    if (available.length <= 1) return; // nothing to rotate between

    // find current active among available slides, then move to the next one
    const currentEl = slides[current];
    let nextIndex = (current + 1) % slides.length;
    let safety = 0;
    while (slides[nextIndex].dataset.failed === 'true' && safety < slides.length) {
      nextIndex = (nextIndex + 1) % slides.length;
      safety++;
    }

    if (currentEl) currentEl.classList.remove('is-active');
    slides[nextIndex].classList.add('is-active');
    current = nextIndex;
  }

  setInterval(goToNext, 5000);
}

/* =========================================================
   3D category carousel — data + navigation rules
   - CAROUSEL_CATEGORIES below is the single source of truth for every
     category shown on the site (previously duplicated between
     the old wheel and slider — now defined once and reused).

   ---------------------------------------------------------
   CATEGORY NAVIGATION RULES (unchanged from before):
   - Room, Apartment, PG, Hostel are LIVE categories.
     Clicking them (from the carousel, or from any other section
     that calls openCategory) navigates straight to that
     category's listings page — no "Coming Soon" popup.
   - Car, Bike, Scooter, Electronics, Marriage Hall keep the
     existing "Coming Soon" detail-card behavior, unchanged,
     and that popup now includes a "Get the App" button that
     links straight to the Play Store.
   ========================================================= */

// Keys that are fully implemented and should navigate directly
// to a listings page instead of showing the Coming Soon card.
const LIVE_CATEGORIES = ['room', 'apartment', 'pg', 'hostel'];

// Central place that decides what happens when ANY category is
// clicked, from ANY part of the site (wheel, future-services grid,
// etc). Other sections should call this instead of duplicating logic.
function openCategory(key) {
  if (LIVE_CATEGORIES.includes(key)) {
    // Live category -> go straight to its listings page.
    window.location.href = `category.html?type=${encodeURIComponent(key)}`;
    return;
  }
  // Everything else -> unchanged "Coming Soon" behavior handled by caller.
}

// Single source of truth for every category card shown in the
// #categories carousel. Keys, labels, icons and descriptions are
// carried over unchanged from the previous wheel/slider implementation
// (which duplicated this same list in two places) — nothing new was
// added or renamed here, it was only consolidated into one array.
const CAROUSEL_CATEGORIES = [
  { key: 'room', label: 'Room', icon: '🛏️', desc: 'Find verified single and shared rooms near you, ready to move in.' },
  { key: 'apartment', label: 'Apartment', icon: '🏢', desc: 'Fully furnished apartments for short or long-term stays.' },
  { key: 'hostel', label: 'Hostel', icon: '🏨', desc: 'Budget-friendly beds for students and travellers, verified and safe.' },
  { key: 'pg', label: 'PG', icon: '🏠', desc: 'Paying-guest accommodations with meals and amenities included.' },
  { key: 'bike', label: 'Bike', icon: '🏍️', desc: 'Hourly and daily two-wheeler rentals wherever you are.' },
  { key: 'car', label: 'Car', icon: '🚗', desc: 'Self-drive and chauffeur cars, booked in a couple of taps.' },
  { key: 'scooter', label: 'Scooter', icon: '🛵', desc: 'Quick, affordable scooter rentals for short city trips.' },
  { key: 'electronics', label: 'Electronics', icon: '💻', desc: 'Laptops, cameras and gadgets available to rent by the day.' },
  { key: 'hall', label: 'Marriage Hall', icon: '💍', desc: 'Book verified venues and halls for weddings and events.' }
];

/* =========================================================
   3D category carousel (coverflow-style)
   - Cards are laid out around a shared center: the active card
     sits front-and-center at full scale, neighbours fan out to
     either side with a perspective rotation, shrinking and
     fading the further they sit from center — depth is done
     with CSS transforms driven by a single "offset" per card,
     recalculated on every index change.
   - Autoplay slowly advances the active card; it pauses on
     hover/focus/touch and resumes afterwards, and is skipped
     entirely for prefers-reduced-motion.
   - Drag (mouse) and swipe (touch) both work via Pointer Events;
     a small drag threshold tells a genuine swipe apart from a tap.
   - Arrow buttons, dot indicators and Left/Right arrow keys all
     move the same shared "active index" state.
   - Clicking the active/front card triggers the exact same
     openCategory()/"Coming Soon" behavior as the old wheel and
     slider did. Clicking a side card simply brings it to the
     front first (matches the reference carousel's behavior).
   ========================================================= */
function initCategoryCarousel3D() {
  const stage = document.getElementById('carousel3d-stage');
  const viewport = document.getElementById('carousel3d-viewport');
  const track = document.getElementById('carousel3d-track');
  const prevBtn = document.getElementById('carousel3d-prev');
  const nextBtn = document.getElementById('carousel3d-next');
  const dotsWrap = document.getElementById('carousel3d-dots');
  const detail = document.getElementById('category-detail');
  const detailClose = document.getElementById('detail-close');
  const detailTitle = document.getElementById('detail-title');
  const detailDesc = document.getElementById('detail-desc');
  const detailIcon = document.getElementById('detail-icon');
  const detailAppLink = document.getElementById('detail-app-link');
  if (!stage || !track) return;

  const categories = CAROUSEL_CATEGORIES;
  const n = categories.length;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let active = 0;
  let autoplayTimer = null;

  /* ---- build cards ---- */
  const cards = categories.map((cat, i) => {
    const isLive = LIVE_CATEGORIES.includes(cat.key);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `carousel3d-card ${isLive ? 'is-live' : 'is-soon'}`;
    card.dataset.index = i;
    card.setAttribute('aria-label', `${isLive ? 'Open' : 'Preview'} ${cat.label} category`);
    card.innerHTML = `
      <div class="carousel3d-card-icon">${cat.icon}</div>
      <div class="carousel3d-card-label">${cat.label}</div>
      <span class="carousel3d-card-badge">${isLive ? 'Available' : 'Coming Soon'}</span>
    `;
    track.appendChild(card);
    return card;
  });

  /* ---- dot indicators ---- */
  const dots = categories.map((cat, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel3d-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to ${cat.label}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  /* ---- shortest-path offset of card i relative to active, in [-n/2, n/2] ---- */
  function offsetOf(i) {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  const MAX_VISIBLE = 3; // how many cards deep the fan shows on either side

  function render() {
    cards.forEach((card, i) => {
      const o = offsetOf(i);
      const abs = Math.abs(o);
      const clampedAbs = Math.min(abs, MAX_VISIBLE);
      card.style.setProperty('--o', o);
      card.style.setProperty('--ao', clampedAbs); // pre-computed |offset|, clamped — avoids relying on CSS abs()
      card.classList.toggle('is-active', o === 0);
      card.classList.toggle('is-hidden', abs > MAX_VISIBLE);
      card.setAttribute('aria-current', o === 0 ? 'true' : 'false');
      card.tabIndex = abs > MAX_VISIBLE ? -1 : 0;
    });
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === active));
    const cat = categories[active];
    stage.setAttribute('aria-label', `Property and rental categories, showing ${cat.label}`);
  }

  function goTo(index, { userInitiated = true } = {}) {
    active = ((index % n) + n) % n;
    render();
    if (userInitiated) restartAutoplay();
  }

  function next() { goTo(active + 1); }
  function prev() { goTo(active - 1); }

  /* ---- activating a card: same rules as the old wheel/slider ---- */
  function activateCategory(i) {
    const cat = categories[i];
    if (LIVE_CATEGORIES.includes(cat.key)) {
      openCategory(cat.key); // navigates directly, no popup
      return;
    }
    detailIcon.textContent = cat.icon;
    detailTitle.textContent = cat.label;
    detailDesc.textContent = cat.desc;
    if (detailAppLink) detailAppLink.href = APP_LINK;
    detail.classList.add('is-open');
    detail.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  // NOTE: tapping/clicking a card is handled centrally via pointerdown/up
  // below rather than a plain 'click' listener per card. Once the viewport
  // captures the pointer (for dragging), the browser retargets the
  // resulting click event to the capturing element instead of the card
  // that was actually pressed — so a per-card click listener would silently
  // never fire. Keyboard activation isn't affected by pointer capture, so
  // that stays as a simple per-card listener.
  cards.forEach((card, i) => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (i === active) activateCategory(i); else goTo(i);
      }
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateCategory(active); }
  });

  /* ---- autoplay: slow, gentle, pauses on any interaction ---- */
  function startAutoplay() {
    if (prefersReducedMotion) return;
    stopAutoplay();
    autoplayTimer = setInterval(() => goTo(active + 1, { userInitiated: false }), 4200);
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  function restartAutoplay() { startAutoplay(); }

  [stage, viewport].forEach(el => {
    el.addEventListener('mouseenter', stopAutoplay);
    el.addEventListener('mouseleave', startAutoplay);
    el.addEventListener('focusin', stopAutoplay);
    el.addEventListener('focusout', startAutoplay);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });

  /* ---- drag (mouse) + swipe (touch) via Pointer Events ----
     Also handles taps: since the viewport captures the pointer for
     dragging, the browser retargets the resulting 'click' event to the
     viewport instead of the card under the finger/cursor — so taps on a
     card are detected here directly (comparing total travel distance
     against a small threshold) rather than via a 'click' listener. */
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let dragDistance = 0;
  let pressedIndex = null; // index of the card actually pressed on pointerdown
  const TAP_MAX_DISTANCE = 8;  // px of travel still counted as a tap, not a drag
  const DRAG_THRESHOLD = 45;   // px before a drag counts as a swipe to next/prev

  viewport.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragDistance = 0;
    startX = e.clientX;
    startY = e.clientY;
    const pressedCard = e.target.closest('.carousel3d-card');
    pressedIndex = pressedCard ? Number(pressedCard.dataset.index) : null;
    stopAutoplay();
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dragDistance = e.clientX - startX;
    // Subtle live-follow: nudge the whole fan with the pointer while
    // dragging, without changing the active index until release.
    track.style.setProperty('--drag', `${dragDistance * 0.35}px`);
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    track.style.setProperty('--drag', '0px');

    const traveled = e ? Math.hypot(e.clientX - startX, e.clientY - startY) : Math.abs(dragDistance);
    const wasTap = traveled <= TAP_MAX_DISTANCE;

    if (wasTap && pressedIndex !== null) {
      if (pressedIndex === active) activateCategory(pressedIndex); else goTo(pressedIndex);
    } else if (dragDistance <= -DRAG_THRESHOLD) {
      next();
    } else if (dragDistance >= DRAG_THRESHOLD) {
      prev();
    } else {
      restartAutoplay();
    }
    pressedIndex = null;
    dragDistance = 0;
  }

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', () => endDrag());
  viewport.addEventListener('pointerleave', (e) => { if (dragging && e.buttons === 0) endDrag(e); });

  render();
  startAutoplay();
}

/* =========================================================
   Animated stat counters (hero-stats)
   - Counts up any .stat-num that has a [data-count] attribute
     the moment it scrolls into view, once, then leaves the
     original text (e.g. "100%", "24/7") completely alone for
     any stat that doesn't opt in via data-count.
   ========================================================= */
function initStatCounters() {
  const nums = document.querySelectorAll('.stat-num[data-count]');
  if (!nums.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (prefersReducedMotion || isNaN(target)) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1200;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      el.textContent = value + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  nums.forEach(el => observer.observe(el));
}

/* =========================================================
   Testimonial carousel
   - Autoplays every 6s, pauses on hover/focus, and supports
     manual navigation via the dot controls.
   ========================================================= */
function initTestimonials() {
  const viewport = document.getElementById('testimonial-viewport');
  if (!viewport) return;
  const slides = Array.from(viewport.querySelectorAll('.testimonial-slide'));
  const dotsWrap = document.getElementById('testimonial-dots');
  if (slides.length <= 1) return;

  let current = 0;
  let timer = null;

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'testimonial-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Show testimonial ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function goTo(index) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
  }

  function next() { goTo(current + 1); }

  function start() {
    stop();
    timer = setInterval(next, 6000);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  start();
  viewport.addEventListener('mouseenter', stop);
  viewport.addEventListener('mouseleave', start);
  viewport.addEventListener('focusin', stop);
  viewport.addEventListener('focusout', start);
}

/* =========================================================
   Back-to-top button
   - Fades in after the person scrolls past one viewport height,
     smooth-scrolls back to #top on click.
   ========================================================= */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
