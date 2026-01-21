console.log("✅ header.js loaded");

document.addEventListener("DOMContentLoaded", () => {

    /* ================= DARK MODE ================= */
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        const btn = document.getElementById("darkModeBtn");
        if (btn) btn.innerText = "☀️";
    }

    /* ================= LOGOUT ================= */
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("loggedUser");
            window.location.href = "index.html";
        });
    }

    /* ================= SIDE MENU ================= */
    const menuBtn = document.getElementById("menuBtn");
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("menuOverlay");

    if (menuBtn && sideMenu && overlay) {
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sideMenu.classList.add("open");
            overlay.style.display = "block";
        });

        overlay.addEventListener("click", closeMenu);
    }
});

/* ================= MENU HELPERS ================= */
function closeMenu() {
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("menuOverlay");

    if (sideMenu) sideMenu.classList.remove("open");
    if (overlay) overlay.style.display = "none";
}

function goHome() {
    closeMenu();
    window.location.href = "index.html#home";
}

function openCategories() {
    closeMenu();
    window.location.href = "index.html#categories";
}

function goSearch() {
    closeMenu();
    const search = document.getElementById("searchInput");
    if (search) search.focus();
    else window.location.href = "index.html#search";
}

function goAbout() {
    closeMenu();
    window.location.href = "index.html#footer";
}

function goContact() {
    closeMenu();
    window.location.href = "index.html#footer";
}

