/* ============================================================
   Barış Alışkan — interactions
   ============================================================ */
(() => {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  const yEl = document.getElementById('year');
  if (yEl) yEl.textContent = new Date().getFullYear();

  /* ---------- language switch ---------- */
  const langNodes = document.querySelectorAll('[data-tr]');
  const setLang = (lang) => {
    document.documentElement.lang = lang;
    langNodes.forEach(el => {
      const v = el.getAttribute('data-' + lang);
      if (v == null) return;
      if (el.hasAttribute('data-html')) el.innerHTML = v;
      else el.textContent = v;
    });
    document.querySelectorAll('.lang-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.lang === lang));
    try { localStorage.setItem('lang', lang); } catch (e) {}
  };
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.addEventListener('click', () => setLang(b.dataset.lang)));
  let saved = 'tr';
  try { saved = localStorage.getItem('lang') || 'tr'; } catch (e) {}
  if (saved !== 'tr') setLang(saved);

  /* ---------- scroll progress + navbar ---------- */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('scrollProgress');
  const onScroll = () => {
    const st = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', st > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal, .hero-title');
  if (prefersReduced) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -14% 0px' });
    const groups = new Map();
    reveals.forEach(el => {
      const p = el.parentElement;
      if (!groups.has(p)) groups.set(p, 0);
      const i = groups.get(p);
      el.style.transitionDelay = (i * 90) + 'ms';
      groups.set(p, i + 1);
      io.observe(el);
    });
  }

  /* ---------- animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const fmt = (el, val) => {
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    if (el.dataset.compact === '1') {
      let out;
      if (val >= 1e6) out = (val / 1e6).toFixed(val % 1e6 === 0 ? 0 : 1).replace(/\.0$/, '') + 'M';
      else if (val >= 1e3) out = (val / 1e3).toFixed(0) + 'K';
      else out = String(Math.floor(val));
      return out + suffix;
    }
    if (decimals > 0) return val.toFixed(decimals) + suffix;
    return (val >= 1000 ? val.toLocaleString('tr-TR') : String(Math.floor(val))) + suffix;
  };
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const dur = 1600, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(el, eased * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(el, target);
    };
    requestAnimationFrame(tick);
  };
  if (prefersReduced) {
    counters.forEach(el => el.textContent = fmt(el, parseFloat(el.dataset.count)));
  } else {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---------- mobile menu ---------- */
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    const close = () => { toggle.classList.remove('open'); links.classList.remove('open'); };
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open'); links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }

  /* ---------- active nav link ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navItems.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { threshold: 0.4, rootMargin: '-20% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- magnetic buttons (subtle) ---------- */
  if (window.matchMedia('(hover:hover)').matches && !prefersReduced) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${mx * 0.1}px, ${my * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- MIO scroll-driven horizontal gallery ---------- */
  const mioScroll = document.getElementById('mioScroll');
  const track = document.getElementById('carTrack');
  if (mioScroll && track) {
    const stage = track.parentElement;
    const curEl = document.getElementById('carCur');
    const totEl = document.getElementById('carTot');
    const progEl = document.getElementById('carProgress');
    const total = track.children.length;
    if (totEl) totEl.textContent = total;
    // scroll-driven pinning only on larger screens (and when motion is allowed)
    const isDesktop = () => window.matchMedia('(min-width:901px)').matches && !prefersReduced;
    let travel = 0;
    const measure = () => {
      if (!isDesktop()) { mioScroll.style.height = ''; track.style.transform = ''; travel = 0; return; }
      travel = Math.max(0, track.scrollWidth - stage.clientWidth);
      // vertical scroll distance mapped to the horizontal travel (a touch slower for feel)
      mioScroll.style.height = (window.innerHeight + travel * 1.25) + 'px';
    };
    const update = () => {
      if (!isDesktop()) { if (progEl) progEl.style.width = ''; return; }
      const denom = mioScroll.offsetHeight - window.innerHeight;
      if (denom <= 0) return;
      const p = Math.min(Math.max(-mioScroll.getBoundingClientRect().top / denom, 0), 1);
      track.style.transform = `translateX(${-(p * travel).toFixed(2)}px)`;
      if (curEl) curEl.textContent = Math.min(total, Math.floor(p * total) + 1);
      if (progEl) progEl.style.width = (6 + p * 94) + '%';
    };
    const init = () => { measure(); update(); };
    window.addEventListener('resize', init, { passive: true });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('load', init);
    init();
  }

  /* ---------- particle sphere (canvas 2D) ---------- */
  const canvas = document.getElementById('sphere');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W, H, R;
    const resize = () => {
      const size = canvas.clientWidth || 520;
      canvas.width = size * DPR; canvas.height = size * DPR;
      W = canvas.width; H = canvas.height; R = W * 0.36;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    // fibonacci sphere points
    const N = 900, pts = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = ga * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
    }
    let ang = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ang += 0.0032;
      const cx = W / 2, cy = H / 2;
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      const tilt = 0.42, ct = Math.cos(tilt), st = Math.sin(tilt);
      for (let i = 0; i < N; i++) {
        let [x, y, z] = pts[i];
        // rotate Y
        let x1 = x * cosA - z * sinA;
        let z1 = x * sinA + z * cosA;
        // tilt X
        let y1 = y * ct - z1 * st;
        let z2 = y * st + z1 * ct;
        const depth = (z2 + 1) / 2; // 0..1
        const px = cx + x1 * R;
        const py = cy + y1 * R;
        const rad = 0.6 + depth * 2.1 * DPR;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${90 + depth * 70},${31 + depth * 40},${0.15 + depth * 0.75})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    draw();
  }
})();
