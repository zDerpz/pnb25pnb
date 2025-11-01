/* ===================================================
   ❄️ Snowfall final — reinicia corretamente (clone + replace)
   Cole no fim de script.js, substitui versões anteriores
   =================================================== */
(function () {
  'use strict';

  const MAX_FLAKES_DESKTOP = 28;
  const MAX_FLAKES_MOBILE = 12;
  const FLAKE_CHARS = ['❅','❆'];

  let container = null;
  let lastIsMobile = null;
  let resizeTimer = null;

  // cria / recria toda a neve
  window.createSnowfall = function createSnowfall() {
    const isMobile = window.matchMedia('(max-width: 600px)').matches;
    const NUM_FLAKES = isMobile ? MAX_FLAKES_MOBILE : MAX_FLAKES_DESKTOP;
    lastIsMobile = isMobile;

    // cria container se não existir
    container = document.getElementById('snowfall');
    if (!container) {
      container = document.createElement('div');
      container.id = 'snowfall';
      document.body.appendChild(container);
    }

    // limpar antigos
    container.innerHTML = '';

    const rand = (min, max) => Math.random() * (max - min) + min;

    for (let i = 0; i < NUM_FLAKES; i++) {
      const node = makeFlake(isMobile);
      container.appendChild(node);
    }

    // Delegated listener: reage apenas à animação 'snowFall'
    // Remove listener anterior para evitar duplicados
    container.removeEventListener('animationend', onContainerAnimationEnd);
    container.addEventListener('animationend', onContainerAnimationEnd, false);

    return container;
  };

  // cria um único floco DOM com propriedades aleatórias
  function makeFlake(isMobile) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';

    // conteúdo: carácter
    flake.textContent = FLAKE_CHARS[Math.floor(Math.random() * FLAKE_CHARS.length)];

    const size = Math.round(randRange(isMobile ? 12 : 16, isMobile ? 18 : 28));
    flake.style.setProperty('--flake-size', `${size}px`);
    flake.style.fontSize = `var(--flake-size)`;

    flake.style.left = `${randRange(0, 100)}%`;

    const fallDuration = randRange(isMobile ? 6 : 8, isMobile ? 12 : 24);
    const fallDelay = randRange(-8, 0);
    const driftDuration = randRange(4, 10);
    const driftDelay = randRange(0, 3);

    flake.style.setProperty('--fall-dur', `${fallDuration}s`);
    flake.style.setProperty('--fall-delay', `${fallDelay}s`);
    flake.style.setProperty('--drift-dur', `${driftDuration}s`);
    flake.style.setProperty('--drift-delay', `${driftDelay}s`);

    const variant = Math.random();
    if (variant < 0.36) flake.classList.add('s-low');
    else flake.classList.add('s-drift');
    if (Math.random() < 0.18) flake.classList.add('s-fade');

    flake.style.opacity = String(randRange(0.6, 0.98).toFixed(2));
    flake.style.transform = `translateY(-10vh) rotate(${Math.floor(randRange(0,360))}deg)`;

    return flake;
  }

  // handler delegado — só processa quando a animação que terminou for 'snowFall'
  function onContainerAnimationEnd(ev) {
    if (!ev || !ev.animationName) return;
    if (ev.animationName !== 'snowFall') return; // importante: só reagir ao snowFall

    const node = ev.target;
    if (!node || !node.classList || !node.classList.contains('snowflake')) return;

    // substitui o node por um clone novo com novas propriedades
    const isMobile = window.matchMedia('(max-width: 600px)').matches;
    const newNode = makeFlake(isMobile);

    // tenta manter classes de variante para consistência visual (opcional)
    // aqui já randomizamos no makeFlake então não é preciso copiar.

    // Replace: isto reinicia animação no novo elemento
    try {
      node.parentNode && node.parentNode.replaceChild(newNode, node);
    } catch (e) {
      // fallback: se replace falhar, resetamos propriedades do próprio node
      resetFlakeNode(node, isMobile);
    }
  }

  // fallback — reiniciar propriedades do próprio node (menos robusto)
  function resetFlakeNode(node, isMobile) {
    node.style.left = `${randRange(0, 100)}%`;
    const newSize = Math.round(randRange(isMobile ? 12 : 16, isMobile ? 18 : 28));
    node.style.setProperty('--flake-size', `${newSize}px`);
    node.style.fontSize = `var(--flake-size)`;
    node.style.opacity = String(randRange(0.6, 0.98).toFixed(2));
    node.style.setProperty('--fall-dur', `${randRange(isMobile ? 6 : 8, isMobile ? 12 : 24)}s`);
    node.style.setProperty('--fall-delay', `${randRange(-3, 0)}s`);
    node.style.setProperty('--drift-dur', `${randRange(4, 10)}s`);
    node.style.setProperty('--drift-delay', `${randRange(0, 3)}s`);

    // forçar reflow e reiniciar animação (remove & re-add classes)
    void node.offsetWidth;
    const classes = Array.from(node.classList);
    node.className = 'snowflake';
    classes.forEach(c => node.classList.add(c));
  }

  // util helpers
  function randRange(min, max) { return Math.random() * (max - min) + min; }

  // inicia automaticamente quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.createSnowfall());
  } else {
    window.createSnowfall();
  }

  // re-cria flakes se cruzarmos o breakpoint mobile/desktop (debounce)
  window.addEventListener('resize', () => {
    const nowMobile = window.matchMedia('(max-width: 600px)').matches;
    if (lastIsMobile === null) lastIsMobile = nowMobile;
    if (nowMobile !== lastIsMobile) {
      lastIsMobile = nowMobile;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        try { window.createSnowfall(); } catch (e) { /* ignore */ }
      }, 200);
    }
  }, { passive: true });

})();
