// Motion Poster marketing page behavior: theme wall, scroll reveals, hero particles.
(function () {
  'use strict';

  // [id, display name, pack, screenshot file]
  const THEMES = [
    ['spring', 'Spring Blossom', 'standard', 'eventPoster'],
    ['digital-grid', 'Digital Grid', 'standard', 'poster-digital'],
    ['alpine-winter', 'Alpine Winter', 'standard', 'poster-winter'],
    ['vintage-radio', 'Vintage Radio', 'standard', 'poster-radio'],
    ['corporate', 'Corporate Pro', 'standard', 'poster-corporate'],
    ['minimal-elegance', 'Minimal Elegance', 'standard', 'poster-minimal'],
    ['electric-pulse', 'Electric Pulse', 'party', 'poster-electric-pulse'],
    ['celebration', 'Celebration', 'party', 'poster-celebration'],
    ['summer-cookout', 'Summer Cookout', 'party', 'poster-cookout'],
    ['tropical-oasis', 'Tropical Oasis', 'party', 'poster-tropical-oasis'],
    ['casino-night', 'Casino Night', 'party', 'poster-casino-night'],
    ['karaoke-night', 'Karaoke Night', 'party', 'poster-karaoke-night'],
    ['retro-wave', 'Retro Wave', 'decades', 'poster-retro-wave'],
    ['disco-fever', 'Disco Fever', 'decades', 'poster-disco-fever'],
    ['art-deco-gala', 'Art Deco Gala', 'decades', 'poster-art-deco'],
    ['atomic-mid-century', 'Atomic Mid-Century', 'decades', 'poster-mid-century'],
    ['memphis-pop', 'Memphis Pop', 'decades', 'poster-memphis-pop'],
    ['00-glass', '2000s Glass', 'decades', 'poster-00s-glass'],
    ['cinema', 'Cinema Premiere', 'specialty', 'poster-cinema'],
    ['game-console', 'Game Console', 'specialty', 'poster-game-console'],
    ['space-odyssey', 'Space Odyssey', 'specialty', 'poster-space-odyssey'],
    ['bistro-lounge', 'Bistro Lounge', 'specialty', 'poster-bistro-lounge'],
    ['steampunk-gears', 'Steampunk Gears', 'specialty', 'poster-steampunk-gears'],
    ['deep-blue', 'Deep Blue Sea', 'specialty', 'poster-deep-blue'],
    ['halloween', 'Halloween Soiree', 'holiday', 'poster-halloween-soiree'],
    ['autumn-harvest', 'Autumn Harvest', 'holiday', 'poster-autumn-harvest'],
    ['valentines-romance', "Valentine's Romance", 'holiday', 'poster-valentines-romance'],
    ['mardi-gras', 'Mardi Gras', 'holiday', 'poster-mardi-gras'],
    ['festive-holiday', 'Festive Holiday', 'holiday', 'poster-festive-holiday'],
    ['new-years-eve', "New Year's Eve", 'holiday', 'poster-new-years-eve']
  ];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Theme wall ---
  const grid = document.getElementById('theme-grid');
  if (grid) {
    grid.innerHTML = '';
    THEMES.forEach(([id, name, pack, img]) => {
      const li = document.createElement('li');
      li.dataset.pack = pack;
      li.innerHTML =
        `<a class="theme-tile" href="/app/?theme=${id}" aria-label="Open the ${name} theme">` +
        `<img src="assets/screenshots/${img}.avif" width="640" height="400" loading="lazy" alt="${name} theme preview">` +
        `<span class="tile-label"><span class="tile-name">${name}</span><span class="tile-pack">${pack}</span></span></a>`;
      grid.appendChild(li);
    });

    const chips = document.querySelectorAll('#theme-filters .chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const pack = chip.dataset.pack;
        chips.forEach((c) => {
          const on = c === chip;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', String(on));
        });
        grid.querySelectorAll('li').forEach((li) => {
          li.hidden = pack !== 'all' && li.dataset.pack !== pack;
        });
      });
    });
  }

  // --- Header border on scroll ---
  const header = document.getElementById('site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Reveal on scroll ---
  const revealEls = document.querySelectorAll('.section-head, .chapter, .remote-inner, .card, .doc-card, .stats li, .final-cta > *');
  revealEls.forEach((el) => el.classList.add('reveal'));
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  // --- Hero: gently drifting gold particles ---
  const canvas = document.getElementById('hero-particles');
  const video = document.querySelector('.tv-video');
  if (video && reduceMotion) { video.removeAttribute('autoplay'); video.pause(); }
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, parts = [], running = true, raf = 0;
    const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f9d783';

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(46, (w * h) / 26000));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -10,
      r: 1.2 + Math.random() * 2.6,
      vy: 0.25 + Math.random() * 0.6,
      sway: Math.random() * Math.PI * 2,
      a: 0.25 + Math.random() * 0.5
    });
    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = accent();
      parts.forEach((p, i) => {
        p.y += p.vy; p.sway += 0.015; p.x += Math.sin(p.sway) * 0.4;
        if (p.y > h + 10) parts[i] = spawn(false);
        ctx.globalAlpha = p.a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(frame);
    };
    new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting;
      if (visible && !running) { running = true; raf = requestAnimationFrame(frame); }
      if (!visible) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(frame);
  }
})();
