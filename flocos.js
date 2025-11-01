/* Snowfall generator — versão atualizada (flocos Unicode, reiniciável, responsivo) */
(function () {
  'use strict';

  // valores ajustáveis
  const MAX_FLAKES_DESKTOP = 32;
  const MAX_FLAKES_MOBILE = 14;
  const FLAKE_CHARS = ['❅', '❆'];

  // estado global para debounce / re-criação
  let lastIsMobile = null;
  let resizeTimer = null;
  let container = null;

  // função pública para criar/recriar snowfall
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

    // limpar flakes antigos
    container.innerHTML = '';

    const rand = (min, max) => Math.random() * (max - min) + min;

    for (let i = 0; i < NUM_FLAKES; i++) {
      const flake = document.createElement('div');
      flake.className = 'snowflake';

      // conteúdo: carácter de floco aleatório
      flake.textContent = FLAKE_CHARS[Math.floor(Math.random() * FLAKE_CHARS.length)];

      // tamanho (usamos CSS var --flake-size para poder escalar no CSS)
      const size = Math.round(rand(isMobile ? 12 : 16, isMobile ? 18 : 28));
      flake.style.setProperty('--flake-size', `${size}px`);
      flake.style.fontSize = `var(--flake-size)`;

      // posição horizontal inicial (percent)
      flake.style.left = `${rand(0, 100)}%`;

      // tempos: queda e deslocamento lateral
      const fallDuration = rand(isMobile ? 6 : 8, isMobile ? 12 : 24); // segundos
      const fallDelay = rand(-8, 0); // início escalonado
      const driftDuration = rand(4, 10);
      const driftDelay = rand(0, 3);

      flake.style.setProperty('--fall-dur', `${fallDuration}s`);
      flake.style.setProperty('--fall-delay', `${fallDelay}s`);
      flake.style.setProperty('--drift-dur', `${driftDuration}s`);
      flake.style.setProperty('--drift-delay', `${driftDelay}s`);

      // variantes de animação para variedade
      const variant = Math.random();
      if (variant < 0.36) flake.classList.add('s-low');   // queda simples
      else flake.classList.add('s-drift');                // queda + drift
      if (Math.random() < 0.18) flake.classList.add('s-fade'); // ligeira fade

      // opacidade e rotação inicial
      flake.style.opacity = String(rand(0.6, 0.98).toFixed(2));
      flake.style.transform = `translateY(-10vh) rotate(${Math.floor(rand(0, 360))}deg)`;

      container.appendChild(flake);
    }

    // reciclar flakes ao terminar animação (delegated listener)
    // remove listener antigo (se existir) para evitar múltiplos handlers
    container.removeEventListener('animationend', handleAnimationEnd);
    container.addEventListener('animationend', handleAnimationEnd, false);

    return container;
  };

  // função que trata o fim da animação de um floco e o "reinicia"
  function handleAnimationEnd(ev) {
    const node = ev.target;
    if (!node || !node.classList || !node.classList.contains('snowflake')) return;

    // reposiciona e atualiza propriedades para reiniciar animação
    const isMobile = window.matchMedia('(max-width: 600px)').matches;
    const rand = (min, max) => Math.random() * (max - min) + min;

    node.style.left = `${rand(0, 100)}%`;
    const newSize = Math.round(rand(isMobile ? 12 : 16, isMobile ? 18 : 28));
    node.style.setProperty('--flake-size', `${newSize}px`);
    node.style.fontSize = `var(--flake-size)`;
    node.style.opacity = String(rand(0.6, 0.98).toFixed(2));
    node.style.setProperty('--fall-dur', `${rand(isMobile ? 6 : 8, isMobile ? 12 : 24)}s`);
    node.style.setProperty('--fall-delay', `${rand(-3, 0)}s`);
    node.style.setProperty('--drift-dur', `${rand(4, 10)}s`);
    node.style.setProperty('--drift-delay', `${rand(0, 3)}s`);

    // forçar reflow e reiniciar classes/animation
    void node.offsetWidth;
    const classes = Array.from(node.classList);
    node.className = 'snowflake';
    classes.forEach(c => node.classList.add(c));
  }

  // inicia automaticamente quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.createSnowfall());
  } else {
    window.createSnowfall();
  }

  // re-cria flakes ao cruzar breakpoint mobile/desktop (debounced)
  window.addEventListener('resize', () => {
    const nowMobile = window.matchMedia('(max-width: 600px)').matches;
    if (lastIsMobile === null) lastIsMobile = nowMobile;
    if (nowMobile !== lastIsMobile) {
      lastIsMobile = nowMobile;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        try { window.createSnowfall(); } catch (e) { /* ignore */ }
      }, 220);
    }
  }, { passive: true });

})();
