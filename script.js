(() => {
  'use strict';

  const IMAGE_FOLDER = 'res';
  const IMAGE_BASENAME = 'cal'; // cal0..cal25, calf
  const IMAGE_FINAL_NAME = 'calf';
  const TOTAL_DAYS = 25;

  let state = getCurrentDateState();

  const calendarImg = document.getElementById('calendarImage');
  const msgParent = document.querySelector('.calendar-hero');

  let modalEl, modalImg, closeModalBtn, modalCaption;

  // --- Data helpers ---
  function readTestDayFromURL() {
    try {
      const u = new URL(location.href);
      const raw = u.searchParams.get('test_day');
      if (raw !== null) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) return Math.max(0, Math.min(31, n));
      }
    } catch (e) {}
    return null;
  }

  function getCurrentDateState() {
    const urlVal = readTestDayFromURL();
    if (urlVal !== null) return { month: 11, day: urlVal, source: 'url' };
    const now = new Date();
    return { month: now.getMonth(), day: now.getDate(), source: 'real' };
  }

  function imageKeyForState(stateObj) {
    if (!stateObj) stateObj = getCurrentDateState();
    if (stateObj.month !== 11) return `${IMAGE_BASENAME}0`;
    const d = stateObj.day;
    if (d <= 0) return `${IMAGE_BASENAME}0`;
    if (d >= 1 && d <= TOTAL_DAYS) return `${IMAGE_BASENAME}${d}`;
    return IMAGE_FINAL_NAME; // depois do dia 25
  }

  // --- Calendar image loader ---
  function setCalendarImageByKey(key) {
    if (!calendarImg) return;
    const tryPng = `${IMAGE_FOLDER}/${key}.png`;
    const tryJpg = `${IMAGE_FOLDER}/${key}.jpg`;

    calendarImg.onerror = null;
    calendarImg.src = tryPng;
    calendarImg.dataset.currentKey = key;
    calendarImg.onerror = function () {
      calendarImg.onerror = null;
      calendarImg.src = tryJpg;
      calendarImg.onerror = function () {
        console.warn(`[advento] Não foi possível carregar imagem ${tryPng} nem ${tryJpg}`);
      };
    };
  }

  function renderCalendar() {
    const key = imageKeyForState(state);
    setCalendarImageByKey(key);
  }

  // --- Modal handlers ---
  function initModal() {
    modalEl = document.getElementById('imageModal');
    modalImg = document.getElementById('modalImg');
    modalCaption = document.getElementById('modalCaption');
    closeModalBtn = document.getElementById('closeModal');

    if (!modalEl || !modalImg) return;

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) hideModal();
    });
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideModal(); });
  }

  function showModalImage(pngSrc, jpgSrc, keyLabel) {
    if (!modalEl || !modalImg) return;
    modalImg.src = pngSrc;
    modalImg.onerror = function () {
      modalImg.onerror = null;
      modalImg.src = jpgSrc;
      modalImg.onerror = function () {
        modalImg.onerror = null;
        console.warn(`[advento] Modal: não foi possível carregar ${pngSrc} nem ${jpgSrc}`);
      };
    };
    if (modalCaption) modalCaption.textContent = keyLabel;
    modalEl.classList.add('show');
    modalEl.setAttribute('aria-hidden', 'false');
    if (closeModalBtn) closeModalBtn.focus();
  }

  function hideModal() {
    if (!modalEl || !modalImg) return;
    modalEl.classList.remove('show');
    modalEl.setAttribute('aria-hidden', 'true');
    modalImg.src = '';
    if (modalCaption) modalCaption.textContent = '';
  }

  // --- Daily Gift ---
  function initDailyGift() {
    const giftBtn = document.getElementById('dailyGiftButton');
    if (!giftBtn) return;

    giftBtn.addEventListener('click', () => {
      const now = new Date();
      const isDecember = now.getMonth() === 11;
      const day = now.getDate();

      if (!isDecember) {
        alert('🎅 O presente diário só está disponível durante dezembro!');
        return;
      }

      if (day >= 1 && day <= TOTAL_DAYS) {
        const png = `${IMAGE_FOLDER}/day${day}.png`;
        const jpg = `${IMAGE_FOLDER}/day${day}.jpg`;
        showModalImage(png, jpg, `Dia ${day}`);
      } else if (day > TOTAL_DAYS) {
        const finalPng = `${IMAGE_FOLDER}/calf.png`;
        const finalJpg = `${IMAGE_FOLDER}/calf.jpg`;
        showModalImage(finalPng, finalJpg, 'Calendário completo 🎄');
      } else {
        alert('O calendário ainda não começou!');
      }
    });
  }

  // --- Test controls (para debug) ---
  window.applyTest = function applyTest() {
    const el = document.getElementById('testDay');
    const val = el ? el.value : '';
    const v = parseInt(val, 10);
    if (!Number.isInteger(v) || v <= 0) {
      state = getCurrentDateState();
    } else {
      state = { month: 11, day: Math.max(0, Math.min(31, v)), source: 'manual' };
    }
    renderCalendar();
  };

  window.resetTest = function resetTest() {
    const el = document.getElementById('testDay');
    if (el) el.value = '';
    try {
      const u = new URL(location.href);
      u.searchParams.delete('test_day');
      history.replaceState({}, '', u.pathname);
    } catch (e) {}
    state = getCurrentDateState();
    renderCalendar();
  };

  // --- Init ---
  function init() {
    const urlVal = readTestDayFromURL();
    const inp = document.getElementById('testDay');
    if (urlVal !== null && inp) inp.value = String(urlVal);

    initModal();
    renderCalendar();
    initDailyGift();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for debugging
  window.__advento_simple = {
    renderCalendar,
    state,
    imageKeyForState
  };
})();
