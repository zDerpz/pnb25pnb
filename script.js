/* script.js — overlay posicionado (auto) sobre a imagem do calendário
   - calcula posições percentuais para cada dia numa grelha COLS x ROWS
   - podes ajustar CALENDAR_COLS / CALENDAR_ROWS / OVERLAY_PADDING_PX / DAY_WIDTH_PERCENT
   - mantém modal, preload e controles de teste
*/

(() => {
  'use strict';

  /* ---------------- CONFIGURAÇÃO ---------------- */
  const TOTAL_DAYS = 25;
  const IMAGE_FOLDER = 'res';
  const IMAGE_EXT = '.jpg';
  const SANTA_IMAGE = `${IMAGE_FOLDER}/painatal.png`;

  // Grelha usada para posicionamento (ajusta conforme a imagem)
  const CALENDAR_COLS = 5;     // colunas visíveis na imagem
  const CALENDAR_ROWS = 5;     // linhas visíveis na imagem
  const OVERLAY_PADDING_PX = 130; // distância em px entre a moldura da imagem e a grelha
  const DAY_WIDTH_PERCENT = 12;  // largura do botão em % do overlay (ajusta para caber)
  // Offsets por linha/coluna se precisares de ajustes finos (em pixels)
  const ROW_Y_OFFSETS_PX = [210, 180, 150, 120, 90]; // length = CALENDAR_ROWS
  const COL_X_OFFSETS_PX = [-12, -5, 0, 5, 12]; // length = CALENDAR_COLS

  /* ---------------- SELECTORS ---------------- */
  const IDS = {
    calendarHero: '.calendar-hero',
    calendarImage: '#calendarImage',
    overlay: '#calendarOverlay',
    testInput: '#testDay',
    applyBtn: '#applyTest',
    resetBtn: '#resetTest',
    modal: '#imageModal',
    modalImg: '#modalImg',
    modalCaption: '#modalCaption',
    closeModal: '#closeModal',
    contactForm: '#contactForm',
    formStatus: '#formStatus'
  };

  /* ---------------- VARIABLES ---------------- */
  let overlayEl, calendarImgEl;
  let modalEl, modalImgEl, modalCaptionEl, closeModalEl;
  let contactFormEl, formStatusEl;
  let currentDate = getCurrentDateState();

  /* ---------------- Helpers data / test ---------------- */
  function readTestDayFromURL() {
    try {
      const u = new URL(location.href);
      const raw = u.searchParams.get('test_day');
      if (raw !== null) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) return Math.max(0, Math.min(31, n));
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function getCurrentDateState() {
    const urlVal = readTestDayFromURL();
    if (urlVal !== null) return { month: 11, day: urlVal, source: 'url' };
    const now = new Date();
    return { month: now.getMonth(), day: now.getDate(), source: 'real' };
  }

  /* ---------------- Overlay creation / wait ---------------- */
  function ensureOverlayExists() {
    overlayEl = document.querySelector(IDS.overlay);
    if (overlayEl) return overlayEl;

    const hero = document.querySelector(IDS.calendarHero);
    if (!hero) {
      console.warn('[advento] .calendar-hero não encontrado — overlay não criado.');
      return null;
    }
    overlayEl = document.createElement('div');
    overlayEl.id = 'calendarOverlay';
    overlayEl.className = 'calendar-overlay';
    hero.appendChild(overlayEl);
    console.info('[advento] #calendarOverlay criado dinamicamente dentro de .calendar-hero');
    return overlayEl;
  }

  function waitForImageThen(callback) {
    calendarImgEl = document.querySelector(IDS.calendarImage);
    if (!calendarImgEl) { callback(); return; }
    if (calendarImgEl.complete && calendarImgEl.naturalWidth !== 0) { callback(); return; }
    calendarImgEl.addEventListener('load', () => callback(), { once: true });
    calendarImgEl.addEventListener('error', () => callback(), { once: true });
  }

  /* ---------------- Criação dos botões ---------------- */
  function createOverlayDay(day, unlockedCount) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day';
    btn.setAttribute('data-day', String(day));
    btn.setAttribute('aria-label', `Dia ${day} — dezembro`);


    if (day <= unlockedCount) {
      btn.classList.add('unlocked');
      btn.title = `Abrir foto do dia ${day}`;

      const badge = document.createElement('img');
      badge.className = 'day-badge';
      badge.alt = '';
      badge.src = SANTA_IMAGE;
      badge.onerror = function () {
        badge.onerror = null;
        badge.src = `${IMAGE_FOLDER}/day${day}${IMAGE_EXT}`;
        badge.className = 'day-thumb';
        badge.onerror = function () { badge.style.display = 'none'; };
      };
      btn.appendChild(badge);

      btn.onclick = () => openImageModal(day);
    } else {
      btn.classList.add('locked');
      const lock = document.createElement('div');
      lock.className = 'lock-badge';
      btn.appendChild(lock);
      btn.onclick = () => btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(.98)' }, { transform: 'scale(1)' }], { duration: 160 });
    }
    return btn;
  }

  /* ---------------- Posicionamento automático (percentual) ---------------- */
  function renderOverlayGrid() {
  overlayEl = ensureOverlayExists();
  if (!overlayEl) return;

  overlayEl.innerHTML = '';

  const unlocked = (currentDate.month === 11) ? currentDate.day : 0;

  // Cria ou atualiza a mensagem do dia atual
  const msgId = 'todayMessage';
  let msg = document.getElementById(msgId);
  if (!msg) {
    msg = document.createElement('div');
    msg.id = msgId;
    msg.className = 'today-message';
    overlayEl.parentElement.insertBefore(msg, overlayEl);
  }

  if (currentDate.month === 11 && unlocked > 0) {
    msg.textContent = `🎄 Hoje é dia ${unlocked} de dezembro!`;
    msg.style.display = 'block';
  } else {
    msg.textContent = '';
    msg.style.display = 'none';
  }

  // Renderiza os quadradinhos do calendário
  for (let i = 1; i <= TOTAL_DAYS; i++) {
    overlayEl.appendChild(createOverlayDay(i, unlocked));
  }

  preloadUnlockedImages(unlocked);
}

  /* ---------------- Preload ---------------- */
  function preloadUnlockedImages(unlocked) {
    const limit = Math.min(unlocked, TOTAL_DAYS);
    for (let i = 1; i <= limit; i++) {
      const img = new Image();
      img.src = `${IMAGE_FOLDER}/day${i}${IMAGE_EXT}`;
    }
  }

  /* ---------------- Modal ---------------- */
  function openImageModal(day) {
    if (!modalEl || !modalImgEl) { console.warn('[advento] modal não encontrado'); return; }
    modalImgEl.src = `${IMAGE_FOLDER}/day${day}${IMAGE_EXT}`;
    modalImgEl.alt = `Foto do dia ${day}`;
    if (modalCaptionEl) modalCaptionEl.textContent = `Dia ${day} — dezembro`;
    modalEl.classList.add('show');
    modalEl.setAttribute('aria-hidden', 'false');
    if (closeModalEl) closeModalEl.focus();
  }

  function closeImageModal() {
    if (!modalEl || !modalImgEl) return;
    modalEl.classList.remove('show');
    modalEl.setAttribute('aria-hidden', 'true');
    modalImgEl.src = '';
    if (modalCaptionEl) modalCaptionEl.textContent = '';
  }

  function initModalHandlers() {
    modalEl = document.querySelector(IDS.modal);
    modalImgEl = document.querySelector(IDS.modalImg);
    modalCaptionEl = document.querySelector(IDS.modalCaption);
    closeModalEl = document.querySelector(IDS.closeModal);

    if (modalEl) {
      modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeImageModal(); });
    }
    if (closeModalEl) closeModalEl.addEventListener('click', closeImageModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalEl && modalEl.classList.contains('show')) closeImageModal(); });

    if (modalImgEl) {
      modalImgEl.addEventListener('error', () => { if (modalCaptionEl) modalCaptionEl.textContent = 'Imagem não disponível.'; });
      modalImgEl.addEventListener('load', () => { if (modalCaptionEl) {} });
    }
  }

  /* ---------------- Contact form (simples) ---------------- */
  function initContactForm() {
    contactFormEl = document.querySelector(IDS.contactForm);
    formStatusEl = document.querySelector(IDS.formStatus);
    if (!contactFormEl) return;
    contactFormEl.onsubmit = (e) => {
      e.preventDefault();
      if (formStatusEl) formStatusEl.textContent = 'Obrigado — mensagem enviada (simulada).';
      contactFormEl.reset();
    };
  }

  /* ---------------- Funções expostas para HTML ---------------- */
  window.applyTest = function applyTest() {
    const el = document.querySelector(IDS.testInput) || document.getElementById('testDay');
    const val = el ? el.value : '';
    const v = parseInt(val, 10);
    if (!Number.isInteger(v) || v <= 0) {
      currentDate = getCurrentDateState();
    } else {
      currentDate = { month: 11, day: Math.max(0, Math.min(31, v)), source: 'manual' };
    }
    renderOverlayGridPositionedSafe();
  };

  window.resetTest = function resetTest() {
    const el = document.querySelector(IDS.testInput) || document.getElementById('testDay');
    if (el) el.value = '';
    try { const u = new URL(location.href); u.searchParams.delete('test_day'); history.replaceState({}, '', u.pathname); } catch (e) {}
    currentDate = getCurrentDateState();
    renderOverlayGridPositionedSafe();
  };

  window.showDay = function showDay(day) { const n = parseInt(day, 10); if (Number.isNaN(n)) return; openImageModal(n); };

  /* ---------------- Safe render (espera imagem se necessário) ---------------- */
  function renderOverlayGridPositionedSafe() {
    waitForImageThen(() => {
      renderOverlayGridPositioned();
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    ensureOverlayExists();
    initModalHandlers();
    initContactForm();

    // liga botões Apply/Reset se existirem (conveniência)
    const applyBtn = document.querySelector(IDS.applyBtn);
    const resetBtn = document.querySelector(IDS.resetBtn);
    if (applyBtn) applyBtn.addEventListener('click', window.applyTest);
    if (resetBtn) resetBtn.addEventListener('click', window.resetTest);

    // popula input se ?test_day=
    const urlTest = readTestDayFromURL();
    const tIn = document.querySelector(IDS.testInput) || document.getElementById('testDay');
    if (urlTest !== null && tIn) tIn.value = String(urlTest);

    // render inicial
    renderOverlayGridPositionedSafe();
  }

  // util wrapper to call function named earlier
  function renderOverlayGridPositioned() {
    // this simply calls the positioned render; done to keep function name consistent
    // main implementation is above
    renderOverlayGridPositioned_impl();
  }

  // Implementation separated to avoid hoisting confusion in some environments
  function renderOverlayGridPositioned_impl() {
    // actual function defined earlier as renderOverlayGridPositioned
    // but we need the implementation body here - call the prior implementation
    // We'll simply call the earlier named function by inlining its logic:
    // (To avoid confusion, call the main renderer we wrote earlier: renderOverlayGridPositionedMain)
    renderOverlayGridPositionedMain();
  }

  // main renderer (the one that actually positions buttons)
  function renderOverlayGridPositionedMain() {
    overlayEl = ensureOverlayExists();
    if (!overlayEl) return;

    overlayEl.innerHTML = '';

    const rect = overlayEl.getBoundingClientRect();
    const contW = rect.width || (calendarImgEl ? calendarImgEl.clientWidth : 0);
    const contH = rect.height || (calendarImgEl ? calendarImgEl.clientHeight : 0);

    const pad = OVERLAY_PADDING_PX;
    const usableW = Math.max(0, contW - pad * 2);
    const usableH = Math.max(0, contH - pad * 2);

    const unlocked = (currentDate.month === 11) ? currentDate.day : 0;

    for (let day = 1; day <= TOTAL_DAYS; day++) {
      const idx = day - 1;
      const col = idx % CALENDAR_COLS;
      const row = Math.floor(idx / CALENDAR_COLS);

      const cellW = usableW / CALENDAR_COLS;
      const cellH = usableH / CALENDAR_ROWS;

      const centerXpx = pad + (col + 0.5) * cellW + (COL_X_OFFSETS_PX[col] || 0);
      const centerYpx = pad + (row + 0.5) * cellH + (ROW_Y_OFFSETS_PX[row] || 0);

      const leftPct = contW ? (centerXpx / contW) * 100 : 0;
      const topPct = contH ? (centerYpx / contH) * 100 : 0;

      const btn = createOverlayDay(day, unlocked);

      btn.style.left = `${leftPct}%`;
      btn.style.top = `${topPct}%`;
      btn.style.width = `${DAY_WIDTH_PERCENT}%`;
      btn.style.maxWidth = '96px';
      btn.style.minWidth = '40px';

      overlayEl.appendChild(btn);
    }

    preloadUnlockedImages(unlocked);
  }

  /* wrapper to maintain compatibility with earlier function name */
  function renderOverlayGridPositionedSafe() { waitForImageThen(renderOverlayGridPositionedMain); }

  /* ---------------- auto-run ---------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Small debug API
  window.__advento = {
    renderOverlayGridPositionedMain,
    openImageModal,
    closeImageModal,
    currentDate
  };

})();
