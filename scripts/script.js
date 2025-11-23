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
                    Lookup
                </a>
                <a class="navbar-item" href="/izaki-dictionary/pages/byakuzhi/readings.html">
                    Readings
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
            <a class="navbar-link">Tools 道具</a>
            <div class="navbar-dropdown">
                <a class="navbar-item" href="/izaki-dictionary/pages/tools/conjugator.html">
                    Conjugator 活用
                </a>
                <a class="navbar-item" href="/izaki-dictionary/pages/tools/declension.html">
                    Declension
                </a>
            </div>
        </div>

        <div class="navbar-end">
            <div class="navbar-item">Made with ❤️ and ☕</div>
        </div>
    </div>
</nav>
`;

document.addEventListener('DOMContentLoaded', () => {
    // Attiva il burger menu
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
    $navbarBurgers.forEach(el => {
        el.addEventListener('click', () => {
            const target = el.dataset.target;
            const $target = document.getElementById(target);
            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');
        });
    });
});
