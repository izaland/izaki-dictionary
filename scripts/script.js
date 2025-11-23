

document.getElementById("navbar").innerHTML = `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css">

    <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a class="navbar-item" href="/izaki-dictionary/">
                <img src = "/izaki-dictionary/assets/Izaland.png"/> Izaki Dictionary
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
                <a class="navbar-link">Byakuzhi</a>
                <div class="navbar-dropdown">
                    <a class="navbar-item" href = "/izaki-dictionary/pages/byakuzhi/lookup.html">
                        Lookup
                    </a>
                    <a class="navbar-item">
                        Readings
                    </a>
                </div>
            </div>
            <div class="navbar-item has-dropdown is-hoverable">
                <a class="navbar-link">Grammar</a>
                <div class="navbar-dropdown">
                    <a class="navbar-item">
                        Overview
                    </a>
                </div>
            </div>
            <div class="navbar-item has-dropdown is-hoverable">
                <a class="navbar-link">Tools</a>
                <div class="navbar-dropdown">
                    <a class="navbar-item">
                        Conjugator
                    </a>
                    <a class="navbar-item">
                        Declension
                    </a>
                </div>
            </div>
            <div class="navbar-end">
                <div class="navbar-item">Made with ❤️ and ☕</div>
            </div>
        </div>
    </nav>`

document.addEventListener('DOMContentLoaded', () => {
    // Get all "navbar-burger" elements
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    // Add a click event on each of them
    $navbarBurgers.forEach( el => {
        el.addEventListener('click', () => {

        // Get the target from the "data-target" attribute
        const target = el.dataset.target;
        const $target = document.getElementById(target);

        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

        });
    });
});