/* main site JS: navbar, overlays, timeline, modal, ripples, loader, particles, carousel */

/* --- HELPERS & UTILS --- */
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Creates a looping typewriter animation for multiple phrases.
 * @param {HTMLElement} target - The DOM element to animate.
 * @param {...string} texts - Multiple phrases to type.
 */
function typewriter(target, ...texts) {
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingSpeed = 80;
  const deletingSpeed = 50;
  const delayAfterComplete = 1500;

  function type() {
    const currentText = texts[textIndex];
    let displayText;

    if (isDeleting) {
      charIndex--;
      displayText = currentText.substring(0, charIndex);
    } else {
      charIndex++;
      displayText = currentText.substring(0, charIndex);
    }

    target.textContent = displayText;

    let nextDelay = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentText.length) {
      nextDelay = delayAfterComplete;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      nextDelay = 400;
    }

    setTimeout(type, nextDelay);
  }

  type();
}



/* --- PARTICLES (BACKGROUND) --- */
(function makeParticles() {
  const wrap = document.getElementById('particles');
  if (!wrap) return;
  const count = 22;
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'particle';
    d.style.left = (Math.random() * 100) + '%';
    d.style.top = (Math.random() * 100) + '%';
    d.style.width = d.style.height = (3 + Math.random() * 6) + 'px';
    d.style.opacity = 0.03 + Math.random() * 0.12;
    wrap.appendChild(d);
  }
})();


/* --- GLOBAL LOADER CONTROL --- */
const globalLoader = $('#globalLoader');
const loaderInner = $('#loaderInner');
const loaderLabel = $('#loaderLabel');

function showLoader(label = 'Loading...', duration = 700) {
  if (prefersReduced) return Promise.resolve();
  loaderLabel.textContent = label;
  globalLoader.classList.add('show');
  return new Promise(resolve => {
    setTimeout(() => {
      globalLoader.classList.remove('show');
      resolve();
    }, duration);
  });
}


/* --- NAV INDICATOR & BEHAVIOR --- */
function setIndicatorTo(button, instant = false) {
  const ind = $('#navIndicator');
  if (!button || !ind || window.innerWidth <= 900) return; // Don't run on mobile
  const parentRect = button.parentElement.getBoundingClientRect();
  const r = button.getBoundingClientRect();
  const left = r.left - parentRect.left;
  const width = r.width;
  if (instant) {
    ind.style.transition = 'none';
    ind.style.left = left + 'px';
    ind.style.width = width + 'px';
    requestAnimationFrame(() => ind.style.transition = 'left .32s cubic-bezier(.2,.9,.2,1),width .32s cubic-bezier(.2,.9,.2,1)');
  } else {
    ind.style.left = left + 'px';
    ind.style.width = width + 'px';
  }
}

(function initNav() {
  const navBtns = $$('.nav-btn');
  const homeBtn = document.querySelector('.nav-btn[data-target="home"]');
  setIndicatorTo(homeBtn, true);

  navBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => setIndicatorTo(btn));
    btn.addEventListener('mouseleave', () => setIndicatorTo(document.querySelector('.nav-btn.active') || homeBtn));
    btn.addEventListener('click', async () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.target;
      let label = 'Loading...';
      if (target === 'internship') label = 'Opening Internship…';
      if (target === 'education') label = 'Opening Education…';
      if (target === 'projects') label = 'Opening Projects…';
      if (target === 'contact') label = 'Opening Contact…';

      await showLoader(label, 700);
      openSection(target);
    });
  });

  const logo = $('#logo');
  logo.addEventListener('click', () => {
    closeAllOverlays(true);
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    setIndicatorTo(homeBtn, true);
  });
  logo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') logo.click();
  });
})();


/* --- OVERLAY & SECTION MANAGEMENT --- */
function openSection(name) {
  closeAllOverlays(true);
  if (name === 'home') return;
  const overlay = {
    projects: $('#overlayProjects'),
    internship: $('#overlayInternship'),
    education: $('#overlayEducation'),
    contact: $('#overlayContact')
  }[name];

  if (!overlay) return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (name === 'projects' && !isCarouselInitialized) {
    setTimeout(initCarousel, 50);
  }
  if (name === 'internship') setTimeout(() => revealTimeline('#internTimeline'), 120);
  if (name === 'education') setTimeout(() => revealTimeline('#eduTimeline'), 120);
}

function closeAllOverlays(instant = false) {
  $$('.overlay').forEach(o => {
    if (instant) {
      o.classList.remove('show');
      o.setAttribute('aria-hidden', 'true');
    } else {
      o.classList.remove('show');
      setTimeout(() => o.setAttribute('aria-hidden', 'true'), 320);
    }
  });
  document.body.style.overflow = '';
  closeTimelineModal(true);
}

$$('.overlay .close').forEach(btn => {
  btn.addEventListener('click', () => {
    const overlay = btn.closest('.overlay');
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setIndicatorTo(document.querySelector('.nav-btn[data-target="home"]'), true);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllOverlays(false);
  }
});


/* --- TIMELINE LOGIC --- */
function revealTimeline(selector) {
  const wrap = document.querySelector(selector);
  if (!wrap) return;
  const items = Array.from(wrap.querySelectorAll('.tl-item'));
  items.forEach((it, i) => {
    it.style.opacity = 0;
    it.style.transform = 'translateY(12px)';
    setTimeout(() => {
      it.style.transition = 'all .46s cubic-bezier(.2,.9,.2,1)';
      it.style.opacity = 1;
      it.style.transform = 'translateY(0)';
    }, 80 + i * 120);
  });

  wrap.querySelectorAll('.timeline-node').forEach(node => {
    if (node._attached) return;
    node._attached = true;
    node.addEventListener('click', () => openTimelineModal(node));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openTimelineModal(node);
    });
  });
}

const tlModal = $('#tlModal');
const tlModalContent = $('#tlModalContent');
const closeTlBtn = $('#closeTlModal');

function openTimelineModal(node) {
  const item = node.closest('.tl-item');
  if (!item) return;
  const year = item.dataset.year || '';
  const title = item.dataset.title || item.querySelector('h4')?.textContent || '';
  const sub = item.dataset.sub || '';
  const desc = item.dataset.desc || item.querySelector('.muted')?.textContent || '';

  tlModalContent.innerHTML = `
    <div style="color:var(--muted);font-weight:600;margin-bottom:8px">${year}</div>
    <h3 style="margin:0 0 8px 0">${title}</h3>
    <div style="color:var(--muted);margin-bottom:12px">${sub}</div>
    <p style="color:var(--text);line-height:1.45">${desc}</p>
  `;
  tlModal.classList.add('show');
  tlModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

closeTlBtn.addEventListener('click', () => closeTimelineModal());

function closeTimelineModal(force = false) {
  tlModal.classList.remove('show');
  tlModal.setAttribute('aria-hidden', 'true');
  if (!force && !$$('.overlay.show').length) {
    document.body.style.overflow = '';
  }
}


/* --- PROJECT CAROUSEL LOGIC --- */
let carousel, carouselItems, prevButton, nextButton;
let carouselIndex = 0;
let isCarouselInitialized = false;

function initCarousel() {
  carousel = $('#projectCarousel');
  if (!carousel) return;

  carouselItems = Array.from(carousel.children);
  prevButton = $('#carouselPrev');
  nextButton = $('#carouselNext');

  prevButton.addEventListener('click', () => {
    carouselIndex--;
    updateCarousel();
  });

  nextButton.addEventListener('click', () => {
    carouselIndex++;
    updateCarousel();
  });

  isCarouselInitialized = true;
  updateCarousel();
}

function updateCarousel() {
  if (!isCarouselInitialized) return;

  if (carouselIndex < 0) carouselIndex = carouselItems.length - 1;
  if (carouselIndex >= carouselItems.length) carouselIndex = 0;

  const angle = 360 / carouselItems.length;

  carouselItems.forEach((item, i) => {
    const rotateY = angle * i;
    item.style.transform = `rotateY(${rotateY}deg) translateZ(320px)`;
  });

  const targetRotation = -carouselIndex * angle;
  carousel.style.transform = `translateZ(-320px) rotateY(${targetRotation}deg)`;
}


/* --- UI ENHANCEMENTS --- */
function attachRipples() {
  $$('.btn, .social, .logo').forEach(el => {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('click', (ev) => {
      if (prefersReduced) return;
      const r = Math.max(el.clientWidth, el.clientHeight) * 1.5;
      const s = document.createElement('span');
      s.style.width = s.style.height = r + 'px';
      s.style.left = (ev.clientX - el.getBoundingClientRect().left - r / 2) + 'px';
      s.style.top = (ev.clientY - el.getBoundingClientRect().top - r / 2) + 'px';
      s.style.background = 'radial-gradient(circle, rgba(255,255,255,0.32), rgba(59,130,246,0.12))';
      s.style.position = 'absolute';
      s.style.borderRadius = '50%';
      s.style.pointerEvents = 'none';
      el.appendChild(s);
      s.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(2)', opacity: 0 }],
        { duration: 650, easing: 'cubic-bezier(.2,.9,.2,1)' }
      );
      setTimeout(() => s.remove(), 700);
    });
  });

  $$('.ripple-img').forEach(img => {
    const parent = img.parentElement;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    parent.style.overflow = 'hidden';
    img.addEventListener('click', (ev) => {
      if (prefersReduced) return;
      const rect = parent.getBoundingClientRect();
      const r = Math.max(rect.width, rect.height) * 1.5;
      const s = document.createElement('span');
      s.style.position = 'absolute';
      s.style.left = (ev.clientX - rect.left - r / 2) + 'px';
      s.style.top = (ev.clientY - rect.top - r / 2) + 'px';
      s.style.width = s.style.height = r + 'px';
      s.style.background = 'radial-gradient(circle, rgba(255,255,255,0.28), rgba(59,130,246,0.08))';
      s.style.pointerEvents = 'none';
      parent.appendChild(s);
      s.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(2)', opacity: 0 }],
        { duration: 700, easing: 'cubic-bezier(.2,.9,.2,1)' }
      );
      setTimeout(() => s.remove(), 750);
    });
  });
}

(function heroParallax() {
  if (prefersReduced || window.innerWidth < 900) return;
  const left = $('.left'), card = $('.hero-card'), right = $('.right');
  let raf = 0;
  window.addEventListener('mousemove', (e) => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const nx = (e.clientX / window.innerWidth - 0.5);
      const tx = nx * 18;
      left.style.transform = `translateX(${-tx}px)`;
      card.style.transform = `rotateY(${nx * 6}deg)`;
      right.style.transform = `translateX(${tx}px)`;
    });
  });
  window.addEventListener('mouseleave', () => {
    left.style.transform = '';
    card.style.transform = '';
    right.style.transform = '';
  });
})();


/* --- APP INITIALIZATION ON DOM READY --- */
document.addEventListener('DOMContentLoaded', () => {
  // Start typewriter
  const typewriterTarget = $('#typewriter-text');
  if (typewriterTarget) {
    typewriter(typewriterTarget, "Backend Developer",
      "Full Stack Engineer",
      "Tech Enthusiast",
      "Machine Learning Engineer",
      "MERN Stack Developer",
      "NextJS Developer");

  }

  // Mobile Nav Toggle
  const menuToggleBtn = $('#menuToggleBtn');
  const navLinks = $('#navLinks');
  menuToggleBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuToggleBtn.classList.toggle('active');
    const isMenuOpen = navLinks.classList.contains('open');
    menuToggleBtn.setAttribute('aria-expanded', isMenuOpen);
    document.body.classList.toggle('no-scroll', isMenuOpen);
  });

  // Close mobile menu when a link is clicked
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        menuToggleBtn.classList.remove('active');
        menuToggleBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
      }
    });
  });

  // Attach UI effects
  attachRipples();

  // Wire up hero CTA buttons
  $('#openProjects').addEventListener('click', () => $('.nav-btn[data-target="projects"]').click());
  $('#openIntern').addEventListener('click', () => $('.nav-btn[data-target="internship"]').click());
  $('#openEdu').addEventListener('click', () => $('.nav-btn[data-target="education"]').click());

  // Initial nav indicator alignment
  setTimeout(() => setIndicatorTo(document.querySelector('.nav-btn[data-target="home"]'), true), 120);
  window.addEventListener('resize', () => setIndicatorTo(document.querySelector('.nav-btn.active') || document.querySelector('.nav-btn[data-target="home"]'), true));

  // Make timeline nodes accessible
  $$('.timeline-node').forEach(n => n.setAttribute('tabindex', '0'));
});