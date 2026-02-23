document.getElementById("navbar").innerHTML = `
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css">

<nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <a class="navbar-item" href="/izaki-dictionary/">
      <img src="/izaki-dictionary/assets/Izaland.png"/> Izaki Dictionary 華邦語辞典
    </a>
    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarexpand">
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
  </div>

  <div id="navbarexpand" class="navbar-menu">
    <div class="navbar-item has-dropdown is-hoverable">
      <a class="navbar-link">Byakuzhi 百字</a>
      <div class="navbar-dropdown">
        <a class="navbar-item" href="/izaki-dictionary/pages/byakuzhi/lookup.html">
          Lookup 百字検索
        </a>
        <a class="navbar-item" href="/izaki-dictionary/pages/byakuzhi/readings.html">
          Readings 百字読方
        </a>
      </div>
    </div>

    <a class="navbar-item" href="/izaki-dictionary/pages/dictionary/dictionary.html">
      Dictionary 辞典
    </a>

    <div class="navbar-item has-dropdown is-hoverable">
      <a class="navbar-link">Grammar 文法</a>
      <div class="navbar-dropdown">
        <a class="navbar-item" href="/izaki-dictionary/pages/grammar/overview.html">
          Overview
        </a>
      </div>
    </div>

    <div class="navbar-item has-dropdown is-hoverable">
      <a class="navbar-link">Linguistic Tools 言語道具</a>
      <div class="navbar-dropdown">
        <a class="navbar-item" href="/izaki-dictionary/pages/tools/conjugator.html">
          Conjugator 活用
        </a>
        <a class="navbar-item" href="/izaki-dictionary/pages/tools/declensor.html">
          Declension 曲用
        </a>
        <a class="navbar-item" href="/izaki-dictionary/pages/tools/askaoza.html">
          Askaoza converter
        </a>
      </div>
    </div>

    <div class="navbar-end">
      <!-- Theme toggle -->
      <div class="navbar-item">
        <div class="buttons">
          <button id="themeToggle" class="button is-small">
            <!-- testo/icona impostati via JS -->
            Loading…
          </button>
        </div>
      </div>

      <div class="navbar-item">Made with ❤️ and ☕</div>
    </div>
  </div>
</nav>
`;

document.addEventListener('DOMContentLoaded', () => {
  // Burger menu
  const $navbarBurgers = Array.prototype.slice.call(
    document.querySelectorAll('.navbar-burger'),
    0
  );
  $navbarBurgers.forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.target;
      const $target = document.getElementById(target);
      el.classList.toggle('is-active');
      $target.classList.toggle('is-active');
    });
  });

  // Theme toggle
  const root = document.documentElement; // <html>
  const toggle = document.getElementById('themeToggle');

  function getStoredTheme() {
    const t = localStorage.getItem('izaki-theme');
    return t === 'dark' || t === 'light' ? t : null;
  }

  function currentTheme() {
    const attr = root.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    return 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('izaki-theme', theme);
  }

  function applyToggleLabel() {
    if (!toggle) return;
    const theme = currentTheme();
    if (theme === 'dark') {
      // Dark attivo → mostra opzione Light
      toggle.innerHTML = `
        <span class="icon"><i class="fas fa-sun" aria-hidden="true"></i></span>
        <span>Light/明</span>
      `;
    } else {
      // Light attivo → mostra opzione Dark
      toggle.innerHTML = `
        <span class="icon"><i class="fas fa-moon" aria-hidden="true"></i></span>
        <span>Dark/暗</span>
      `;
    }
  }

  // Inizializzazione tema: localStorage → prefers-color-scheme → default light
  const stored = getStoredTheme();
  if (stored) {
    applyTheme(stored);
  } else if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  applyToggleLabel();

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      applyToggleLabel();
    });
  }
});
