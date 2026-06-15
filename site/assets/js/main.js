/* ============================================================
   Ник Меньшов · site logic
   ============================================================ */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- review helper: ?section=<id> isolates one section for screenshots ---------- */
  const onlySec = new URLSearchParams(location.search).get('section');
  if (onlySec) {
    $$('section[id]').forEach(s => { s.style.display = (s.id === onlySec ? '' : 'none'); });
    if (onlySec !== 'hero') ['.hero', '.footer'].forEach(sel => { const el = $(sel); if (el) el.style.display = 'none'; });
    $$('.rv').forEach(e => e.classList.add('in'));
  }

  /* ---------- year ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- showreel crossfade ---------- */
  (function showreel() {
    const vids = [$('#v0'), $('#v1')];
    if (!vids[0]) return;
    // prefers-reduced-motion: freeze on poster, no playback, no crossfade (perf + a11y).
    if (reduceMotion) return;

    const reels = ['reel1','reel7','reel2','reel3','reel8','reel4','reel5','reel6'].map(r => `media/${r}.mp4`);
    let cur = 0, idx = 0, busy = false, guard = 0;

    const clearBusy = () => { busy = false; clearTimeout(guard); };
    const start = (v, src, onReady) => {
      const cleanup = () => { v.removeEventListener('loadeddata', ok); v.removeEventListener('error', fail); v.removeEventListener('stalled', fail); };
      const ok   = () => { cleanup(); v.play().catch(() => {}); onReady && onReady(); };
      const fail = () => { cleanup(); onReady && onReady(true); };   // skip on error/stall, never deadlock
      v.addEventListener('loadeddata', ok);
      v.addEventListener('error', fail);
      v.addEventListener('stalled', fail);
      v.src = src; v.muted = true; v.playsInline = true; v.load();
    };
    const advance = () => {
      if (busy) return; busy = true;
      // hard timeout: if neither loadeddata nor error fires, release the lock so the reel never freezes
      guard = setTimeout(() => { busy = false; }, 6000);
      const next = (idx + 1) % reels.length, nv = vids[1 - cur];
      start(nv, reels[next], (failed) => {
        if (failed) { idx = next; clearBusy(); advance(); return; }   // bad clip: move on
        nv.classList.add('on'); vids[cur].classList.remove('on');
        const old = cur; cur = 1 - cur; idx = next;
        setTimeout(() => { try { vids[old].pause(); } catch (e) {} clearBusy(); }, 950);
      });
    };
    vids.forEach(v => {
      v.addEventListener('timeupdate', () => {
        if (v === vids[cur] && isFinite(v.duration) && v.duration > 0 && v.currentTime > v.duration - 1.0) advance();
      });
      v.addEventListener('ended', () => { if (v === vids[cur]) advance(); });
    });
    start(vids[0], reels[0]);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) vids.forEach(v => v.pause());
      else if (!busy) vids[cur].play().catch(() => {});
    });
  })();

  /* ---------- about: bg video (lazy play on view) + custom subtitles ---------- */
  (function aboutVideo() {
    const v = $('#aboutVid'), cap = $('#aboutCap'), sec = $('#about');
    if (!v || !sec) return;

    // desktop: sharper 540×960 encode; phones and Save-Data keep the light 360×640.
    // v.src (not <source>.src): re-runs resource selection, which ignores late <source> edits
    if (matchMedia('(min-width: 900px)').matches && !(navigator.connection || {}).saveData)
      v.src = 'media/about-hd.mp4';

    const wireTrack = () => {
      const track = v.textTracks && v.textTracks[0];
      if (!track) return;
      track.mode = 'hidden';                         // suppress native ::cue; render our own overlay
      track.addEventListener('cuechange', () => {
        const cues = track.activeCues;
        if (cap && cues && cues.length) { cap.textContent = cues[0].text; cap.classList.add('show'); }
        else if (cap) cap.classList.remove('show');
      });
    };
    wireTrack();
    v.addEventListener('loadeddata', () => { const t = v.textTracks && v.textTracks[0]; if (t) t.mode = 'hidden'; });

    if (reduceMotion || !('IntersectionObserver' in window)) return;   // reduced motion: poster only, no autoplay

    let inView = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        inView = e.isIntersecting;
        if (inView) v.play().catch(() => {});         // preload=none → loads + plays only when scrolled into view
        else { try { v.pause(); } catch (err) {} }
      });
    }, { threshold: 0.2 });
    io.observe(sec);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { try { v.pause(); } catch (e) {} }
      else if (inView) v.play().catch(() => {});
    });
  })();

  /* ---------- persistent player: real audio playlist ---------- */
  const player = (function player() {
    const pl = $('#player'), audio = $('#audio'), pp = $('#pp');
    if (!pl || !audio || !pp) return {};
    const prevBtn = $('#plPrev'), nextBtn = $('#plNext');
    const titleEl = $('#plTitle'), subEl = $('#plSub');
    const seek = $('#plSeek'), fill = $('#plFill'), curT = $('#plCur'), durT = $('#plDur');
    const rows = $$('.set-row');

    const TRACKS = [
      { src: 'media/mixes/set01-summer.m4a',     title: 'Your Memories · Summer', sub: 'Melodic · Sunset' },
      { src: 'media/mixes/set02-sashaksuuu.m4a', title: 'Georgia Live Kvevri',    sub: 'House · Live' },
      { src: 'media/mixes/set03-house-afro.m4a', title: 'House + Afro',           sub: 'Afro House' },
    ];
    let i = 0, srcSet = false;

    const fmt = (s) => {
      if (!isFinite(s)) return '--:--';
      s = Math.max(0, Math.floor(s));
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      const mm = h ? String(m).padStart(2, '0') : String(m);
      return (h ? h + ':' : '') + mm + ':' + String(sec).padStart(2, '0');
    };

    const setLabels = (t) => { titleEl.textContent = t.title; subEl.textContent = t.sub; };

    function selectTrack(n) {
      i = (n + TRACKS.length) % TRACKS.length;
      const t = TRACKS[i];
      setLabels(t);
      audio.src = t.src; srcSet = true;
      durT.textContent = '--:--'; curT.textContent = '0:00';
      fill.style.transform = 'scaleX(0)';
      seek.setAttribute('aria-valuenow', '0'); seek.setAttribute('aria-valuetext', '0:00');
      markRows();
    }
    function play(n, autoplay = true) { selectTrack(n); if (autoplay) audio.play().catch(() => {}); }

    function toggle() {
      if (!srcSet) { play(i, true); return; }
      if (audio.paused) audio.play().catch(() => {}); else audio.pause();
    }

    function markRows() {
      const on = !audio.paused && srcSet;
      rows.forEach((r, n) => r.setAttribute('aria-current', (n === i && on) ? 'true' : 'false'));
      rows.forEach((r, n) => r.classList.toggle('active', n === i));
    }

    pp.addEventListener('click', toggle);
    if (prevBtn) prevBtn.addEventListener('click', () => play(i - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => play(i + 1));
    rows.forEach((row) => {
      const n = +row.dataset.track || 0;
      row.addEventListener('click', () => play(n));
    });

    // reflect real audio state back to UI (handles autoplay-block, ended, etc.)
    audio.addEventListener('play', () => {
      pl.classList.add('playing', 'played');
      pp.textContent = '⏸'; pp.setAttribute('aria-label', 'Пауза'); pp.setAttribute('aria-pressed', 'true');
      markRows();
    });
    audio.addEventListener('pause', () => {
      pl.classList.remove('playing');
      pp.textContent = '▶'; pp.setAttribute('aria-label', 'Слушать сет'); pp.setAttribute('aria-pressed', 'false');
      markRows();
    });
    audio.addEventListener('ended', () => play(i + 1));
    audio.addEventListener('loadedmetadata', () => { durT.textContent = fmt(audio.duration); });
    audio.addEventListener('error', () => {
      if (!srcSet) return;
      subEl.textContent = 'Не удалось загрузить сет';
    });
    audio.addEventListener('timeupdate', () => {
      const d = audio.duration;
      if (!isFinite(d) || d <= 0) return;
      const p = audio.currentTime / d;
      fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      curT.textContent = fmt(audio.currentTime);
      seek.setAttribute('aria-valuenow', String(Math.round(p * 100)));
      seek.setAttribute('aria-valuetext', fmt(audio.currentTime) + ' из ' + fmt(d));
    });

    // seek: pointer + keyboard
    const seekTo = (ratio) => { if (isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Math.min(audio.duration, Math.max(0, ratio * audio.duration)); };
    seek.addEventListener('click', (e) => { const r = seek.getBoundingClientRect(); seekTo((e.clientX - r.left) / r.width); });
    seek.addEventListener('keydown', (e) => {
      const d = audio.duration; if (!isFinite(d) || d <= 0) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } return; }
      const step = d * 0.02;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(d, audio.currentTime + step); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - step); e.preventDefault(); }
      else if (e.key === 'Home') { audio.currentTime = 0; e.preventDefault(); }
      else if (e.key === 'End') { audio.currentTime = d - 1; e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ') { toggle(); e.preventDefault(); }
    });

    // init labels only — no src/network until first interaction (preload="none")
    setLabels(TRACKS[0]); markRows();

    return {
      // player stays visible through the whole page (client decision, v8)
      onScroll() { pl.classList.remove('hidden'); }
    };
  })();

  /* ---------- unified scroll handler: nav state + player auto-hide ---------- */
  (function scrollFx() {
    const nav = $('#nav');
    let lastY = window.scrollY, ticking = false;
    const update = () => {
      const yNow = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', yNow > 40);
      if (player.onScroll) player.onScroll(yNow, lastY);
      lastY = yNow; ticking = false;
    };
    update();
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  })();

  /* ---------- mobile menu ---------- */
  (function nav() {
    const burger = $('#burger'), menu = $('#mobileMenu');
    if (!burger || !menu) return;
    const close = (returnFocus) => { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); if (returnFocus) burger.focus(); };
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
      if (open) { const first = $('#mobileMenu a'); if (first) first.focus(); }   // move focus into the sheet
    });
    $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => close(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) close(true); });
    // close + unlock scroll if viewport grows past the mobile breakpoint while menu is open
    matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) close(false); });
  })();

  /* ---------- reveal on scroll ---------- */
  (function reveal() {
    const items = $$('.rv:not(.hero .rv)');
    if (reduceMotion || !('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    items.forEach(i => io.observe(i));
  })();

  /* ---------- portfolio: hover = muted preview, click = play WITH sound ---------- */
  (function portfolio() {
    const items = $$('.pf-item').filter(i => $('video', i));
    const syncMark = (item, v) => { const m = $('.pf-mark', item); if (m) m.textContent = (!v.muted && !v.paused) ? '♪' : '▶'; };
    // one sound source at a time: silence other gallery videos
    const quietOthers = except => items.forEach(i => {
      const v = $('video', i);
      if (v !== except && !v.muted) { try { v.pause(); } catch (e) {} v.muted = true; i.classList.remove('sound'); syncMark(i, v); }
    });
    const mixes = $('#audio');
    if (mixes) mixes.addEventListener('play', () => quietOthers(null));   // mixes win: silence sounding tiles
    items.forEach(item => {
      const v = $('video', item);
      let touched = false;
      const play = () => { v.preload = 'auto'; v.play().catch(() => {}); };
      const stop = () => { try { v.pause(); } catch (e) {} };
      item.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') touched = true; });
      item.addEventListener('mouseenter', () => { if (!touched && v.muted) play(); });
      item.addEventListener('mouseleave', () => { if (!touched && v.muted) stop(); });
      item.addEventListener('click', () => {
        if (v.muted || v.paused) {           // sound on: silence the mixes player + other tiles
          const a = $('#audio'); if (a) { try { a.pause(); } catch (e) {} }
          quietOthers(v);
          v.muted = false; item.classList.add('sound'); play();
        } else {                             // sound off: back to quiet preview mode
          stop(); v.muted = true; item.classList.remove('sound');
        }
        syncMark(item, v);
      });
      v.addEventListener('play', () => syncMark(item, v));
      v.addEventListener('pause', () => syncMark(item, v));
      item.addEventListener('focus', () => { if (v.muted) play(); });
      item.addEventListener('blur', () => { if (v.muted) stop(); });
    });
  })();

  /* ---------- sound-direction: cases behind a button ---------- */
  (function casesDisclosure() {
    const btn = $('#casesToggle'), panel = $('#casesPanel');
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      const willOpen = panel.hidden;
      panel.hidden = !willOpen;
      btn.setAttribute('aria-expanded', String(willOpen));
      const l = $('.ct-label', btn); if (l) l.textContent = willOpen ? 'Скрыть кейсы' : 'Смотреть кейсы';
      if (willOpen) panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    });
  })();

  /* ---------- playlists: live Spotify / Yandex Music embeds ----------
     ДОБАВИТЬ ПЛЕЙЛИСТ: вставьте объект в массив PLAYLISTS ниже.
       platform — 'spotify' | 'yandex' (только для подписи/иконки)
       title    — название подборки
       embed    — ТОЧНЫЙ src из «Поделиться → Встроить»:
                  Spotify  → https://open.spotify.com/embed/playlist/XXXX?theme=0
                  Яндекс   → https://music.yandex.ru/iframe/#playlist/USER/KIND/
       height   — высота встраивания в px (необязательно, по умолчанию 420)
     Массив пуст → показываем аккуратные плейсхолдеры «скоро» по двум платформам. */
  (function playlists() {
    const grid = $('#playlistGrid');
    if (!grid) return;
    const PLAYLISTS = [
      // { platform: 'yandex',  title: 'Закатный сет',  embed: 'https://music.yandex.ru/iframe/#playlist/USER/KIND/', height: 420 },
      // { platform: 'spotify', title: 'House + Afro',   embed: 'https://open.spotify.com/embed/playlist/XXXXXXXX?theme=0', height: 420 },
    ];
    const label = p => (p === 'spotify' ? 'Spotify' : 'Яндекс Музыка');

    if (!PLAYLISTS.length) {
      grid.classList.add('pl-grid--empty');
      grid.innerHTML = ['yandex', 'spotify'].map(p => `
        <div class="pl-card pl-card--soon" data-platform="${p}">
          <span class="pl-chip">${label(p)}</span>
          <p class="pl-soon">Подборки скоро появятся здесь</p>
        </div>`).join('');
      return;
    }

    grid.innerHTML = PLAYLISTS.map(pl => {
      const name = label(pl.platform);
      const h = Number(pl.height) || 420;
      return `
        <figure class="pl-card" data-platform="${pl.platform}">
          <figcaption class="pl-cap"><span class="pl-chip">${name}</span><span class="pl-title">${pl.title || ''}</span></figcaption>
          <iframe src="${pl.embed}" width="100%" height="${h}" frameborder="0" loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
            title="Плейлист ${name}${pl.title ? ': ' + pl.title : ''}"></iframe>
        </figure>`;
    }).join('');
  })();

  /* ---------- booking: dynamic price per product ---------- */
  const pricing = (function pricing() {
    const sel = $('#f-format'), panel = $('#pricePanel');
    const fmt = n => Number(n).toLocaleString('ru-RU') + ' ₽';
    const current = () => {
      const o = sel && sel.selectedOptions && sel.selectedOptions[0];
      if (!o || !o.dataset || !o.dataset.base) return null;
      return { label: o.textContent.trim(), base: +o.dataset.base, hours: +o.dataset.hours, ext: +o.dataset.ext };
    };
    const render = () => {
      if (!panel) return;
      const p = current();
      if (!p) { panel.hidden = true; return; }
      $('#priceAmount').textContent = fmt(p.base);
      $('#priceIncl').textContent = `до ${p.hours} часов`;
      $('#priceExt').innerHTML = `Продление <b>+${fmt(p.ext)} / час</b>`;
      panel.hidden = false;
    };
    if (sel) sel.addEventListener('change', render);
    const summary = () => { const p = current(); return p ? `${p.label} · ${fmt(p.base)} (до ${p.hours} ч, продление +${fmt(p.ext)}/ч)` : ''; };
    return { current, summary, render };
  })();

  /* ---------- booking: static price board preselects the format ---------- */
  (function priceBoard() {
    const board = $('.price-board'), sel = $('#f-format');
    if (!board || !sel) return;
    const items = $$('.pb-item', board);
    const sync = () => items.forEach(b => b.classList.toggle('on', b.dataset.format === sel.value));
    items.forEach(b => b.addEventListener('click', () => {
      sel.value = b.dataset.format;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }));
    sel.addEventListener('change', sync);
  })();

  /* ---------- booking calendar ---------- */
  const booking = (function calendar() {
    const grid = $('#calGrid'), label = $('#calMonth'), prevB = $('#calPrev'), nextB = $('#calNext');
    if (!grid) return {};
    const DOW = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    const MON = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const MONl = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];   // genitive: «19 июня 2026»
    // Demo busy dates (ISO). TODO: заменить на занятость из Google Calendar через serverless.
    const busy = new Set(['2026-06-14','2026-06-21','2026-06-28','2026-07-04','2026-07-12','2026-07-19']);
    const today = new Date(); today.setHours(0,0,0,0);
    const minView = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxView = new Date(today.getFullYear(), today.getMonth() + 12, 1);   // bound forward nav: 12 months
    let view = new Date(minView);
    let selected = null;
    const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const fmt = d => `${d.getDate()} ${MONl[d.getMonth()]} ${d.getFullYear()}`;

    function syncNavButtons() {
      const atMin = view <= minView, atMax = view >= maxView;
      if (prevB) { prevB.disabled = atMin; prevB.setAttribute('aria-disabled', String(atMin)); }
      if (nextB) { nextB.disabled = atMax; nextB.setAttribute('aria-disabled', String(atMax)); }
    }
    function render() {
      label.textContent = `${MON[view.getMonth()]} ${view.getFullYear()}`;
      grid.innerHTML = '';
      DOW.forEach(d => { const el = document.createElement('div'); el.className = 'dow'; el.setAttribute('aria-hidden','true'); el.textContent = d; grid.appendChild(el); });
      const first = new Date(view.getFullYear(), view.getMonth(), 1);
      let lead = (first.getDay() + 6) % 7; // Mon-first
      for (let i = 0; i < lead; i++) { const e = document.createElement('div'); e.className = 'cal-day empty'; e.setAttribute('aria-hidden','true'); grid.appendChild(e); }
      const days = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const date = new Date(view.getFullYear(), view.getMonth(), d);
        const key = iso(date);
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = d;
        const human = `${d} ${MONl[date.getMonth()]} ${date.getFullYear()}`;
        if (date < today) { cell.classList.add('past'); cell.setAttribute('aria-hidden','true'); }
        else if (busy.has(key)) { cell.classList.add('busy'); cell.setAttribute('aria-label', `${human} — занято`); }
        else {
          cell.classList.add('free'); cell.tabIndex = 0; cell.setAttribute('role','button');
          cell.setAttribute('aria-label', `${human} — свободно, выбрать дату`);
          if (selected === key) { cell.classList.add('sel'); cell.setAttribute('aria-pressed','true'); }
          const choose = () => { selected = key; render(); setSelected(fmt(date), key); };
          cell.addEventListener('click', choose);
          cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
        }
        grid.appendChild(cell);
      }
      syncNavButtons();
    }
    function setSelected(human, key) {
      const sd = $('#selDate'); if (sd) sd.textContent = human;
      const f = $('#bookForm'); if (f) f.dataset.date = key;
      const name = $('#f-name'); if (name) name.focus({ preventScroll:true });
      $('#book').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    if (prevB) prevB.addEventListener('click', () => {
      const prev = new Date(view.getFullYear(), view.getMonth()-1, 1);
      if (prev < minView) return;
      view = prev; render();
    });
    if (nextB) nextB.addEventListener('click', () => {
      const next = new Date(view.getFullYear(), view.getMonth()+1, 1);
      if (next > maxView) return;
      view = next; render();
    });
    render();
    return { getSelected: () => selected };
  })();

  /* ---------- booking form ---------- */
  (function bookForm() {
    const form = $('#bookForm'); if (!form) return;
    const status = $('#formStatus');
    const ENDPOINT = ''; // TODO (CP3): URL Cloudflare Worker. Пусто = демо-режим.

    const setErr = (name, msg) => {
      const el = $(`.err[data-for="${name}"]`, form); if (el) el.textContent = msg || '';
      const input = $(`[name="${name}"]`, form);
      if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status'; status.textContent = '';
      const data = Object.fromEntries(new FormData(form).entries());
      // honeypot
      if (data.company) return;
      let ok = true;
      if (!data.name || data.name.trim().length < 2) { setErr('name','Укажите имя'); ok = false; } else setErr('name');
      if (!data.contact || data.contact.trim().length < 3) { setErr('contact','Телефон или Telegram'); ok = false; } else setErr('contact');
      if (!ok) return;
      data.date = form.dataset.date || '';

      const btn = $('#bookSubmit'); const orig = btn.textContent;
      btn.disabled = true; btn.textContent = 'Отправляю…';
      try {
        if (ENDPOINT) {
          const res = await fetch(ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
          if (!res.ok) throw new Error('bad');
          status.className = 'form-status ok';
          status.textContent = data.date
            ? `Заявка отправлена. Спасибо! Отвечу по дате ${data.date} в ближайшее время.`
            : 'Заявка отправлена. Спасибо! Свяжусь с вами в ближайшее время.';
          form.reset(); delete form.dataset.date; const sd = $('#selDate'); if (sd) sd.textContent = 'не выбрана'; pricing.render();
        } else {
          // бэкенд ещё не подключён: формируем заявку, копируем и ведём в Telegram
          const priceLine = pricing.summary();
          const sum = `Заявка${data.date ? ' на ' + data.date : ''}\nИмя: ${data.name}\nКонтакт: ${data.contact}\nФормат: ${data.format || 'не указано'}${priceLine ? '\nСтоимость: ' + priceLine : ''}\nЛокация: ${data.location || 'не указано'}\nБюджет: ${data.budget || 'не указано'}\nКомментарий: ${data.comment || 'не указано'}`;
          let copied = false;
          try { await navigator.clipboard.writeText(sum); copied = true; } catch (e) {}
          status.className = 'form-status ok';
          status.innerHTML = copied
            ? 'Заявка готова и скопирована в буфер. Отправьте её мне в Telegram <a href="https://t.me/nickmenshov" target="_blank" rel="noopener">@nickmenshov</a>, отвечу лично.'
            : 'Заявка готова. Напишите мне в Telegram <a href="https://t.me/nickmenshov" target="_blank" rel="noopener">@nickmenshov</a> с деталями вечера, отвечу лично.';
        }
      } catch (err) {
        status.className = 'form-status bad';
        status.innerHTML = 'Не удалось отправить. Напишите в Telegram <a href="https://t.me/nickmenshov" target="_blank" rel="noopener">@nickmenshov</a> или позвоните.';
      } finally {
        btn.disabled = false; btn.textContent = orig;
      }
    });
  })();
})();
