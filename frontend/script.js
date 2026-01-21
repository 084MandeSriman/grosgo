
let myOrdersCache = [];

console.log("✅ script.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("loggedUser");


    if (user) {
        document.getElementById("authPage").style.display = "none";
        document.getElementById("mainContent").style.display = "block";
    } else {
        document.getElementById("authPage").style.display = "flex";
        document.getElementById("mainContent").style.display = "none";
    }
});


/* ================= ELEMENTS ================= */
const authPage = document.getElementById("authPage");
const mainContent = document.getElementById("mainContent");


const authTitle = document.getElementById("authTitle");
const authBtn = document.getElementById("authBtn");
const toggleAuth = document.getElementById("toggleAuth");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const logoutBtn = document.getElementById("logoutBtn");

/* ================= STATE ================= */
let isLogin = false;

/* ================= AUTO LOGIN CHECK ================= */

const loggedUser = localStorage.getItem("loggedUser");

if (authPage && mainContent) {
    if (loggedUser) {
        authPage.style.display = "none";
        mainContent.style.display = "block";
    } else {
        authPage.style.display = "flex";
        mainContent.style.display = "none";
    }
}

function showMainApp() {
    document.getElementById("authPage").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
}

/* ================= TOGGLE LOGIN / REGISTER ================= */
if (toggleAuth) {
    toggleAuth.addEventListener("click", (e) => {
        e.preventDefault();
        isLogin = !isLogin;

        if (isLogin) {
            authTitle.innerText = "Login";
            authBtn.innerText = "Login";
            nameInput.style.display = "none";
            toggleAuth.innerText = "Register";
        } else {
            authTitle.innerText = "Register";
            authBtn.innerText = "Register";
            nameInput.style.display = "block";
            toggleAuth.innerText = "Login";
        }
    });
}

/* ================= REGISTER / LOGIN ================= */
/* ================= REGISTER / LOGIN ================= */
/* ================= REGISTER / LOGIN ================= */
if (authBtn) {
    authBtn.addEventListener("click", async () => {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password || (!isLogin && !name)) {
            alert("Please fill all fields");
            return;
        }

        try {
            if (!isLogin) {
                // REGISTER
                const res = await fetch("https://grosgo-backend-ohy8.onrender.com/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();
                alert(data.message);

                if (res.ok) {
                    isLogin = true;
                    authTitle.innerText = "Login";
                    authBtn.innerText = "Login";
                    nameInput.style.display = "none";
                }

            } else {
                // LOGIN
                const res = await fetch("https://grosgo-backend-ohy8.onrender.com/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.message);
                    return;
                }

                // ✅ SAVE LOGIN (THIS WAS MISSING)
                localStorage.setItem("loggedUser", data.user.email);
                // ✅ SAVE USER FOR ADMIN ANALYTICS
                const users = JSON.parse(localStorage.getItem("users")) || [];

                const exists = users.find(u => u.email === data.user.email);

                if (!exists) {
                    users.push({
                        name: data.user.name,
                        email: data.user.email,
                        joined: new Date().toLocaleString()
                    });

                    localStorage.setItem("users", JSON.stringify(users));
                }


                alert("Login successful");

                authPage.style.display = "none";
                mainContent.style.display = "block";
            }
        } catch (err) {
            alert("Server not running");
            console.error(err);
        }
    });
}



/* ================= LOGOUT ================= */
if (logoutBtn && authPage && mainContent) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("loggedUser");
        authPage.style.display = "flex";
        mainContent.style.display = "none";
        window.location.href = "index.html"; // redirect safely
    });
}


/* ================= DARK MODE ================= */

const darkModeBtn = document.getElementById("darkModeBtn");

if (darkModeBtn) {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        darkModeBtn.innerText = "☀️";
    }

    darkModeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
            darkModeBtn.innerText = "☀️";
        } else {
            localStorage.setItem("theme", "light");
            darkModeBtn.innerText = "🌙";
        }
    });
}

/* ================= PRICE SORT ================= */
const sortSelect = document.getElementById("sortPrice");

if (sortSelect) {
    sortSelect.addEventListener("change", () => {
        const sortValue = sortSelect.value;

        // Works for ALL pages
        const containers = document.querySelectorAll(
            ".products-grid, .offer-products, .products, .category-products"
        );

        containers.forEach(container => {
            const items = Array.from(
                container.querySelectorAll(".product-item, .product-card")
            );

            if (items.length === 0) return;

            items.sort((a, b) => {
                const priceA = extractPrice(a);
                const priceB = extractPrice(b);

                return sortValue === "low"
                    ? priceA - priceB
                    : priceB - priceA;
            });

            items.forEach(item => container.appendChild(item));
        });
    });
}

/* Helper to extract price safely */
function extractPrice(card) {
    const priceText =
        card.querySelector(".price")?.innerText ||
        card.querySelector("p")?.innerText ||
        "";

    const num = priceText.replace(/[^\d.]/g, "");
    return Number(num) || 0;
}


/* ================= CART LOGIC ================= */

/* ================= GLOBAL CART SYNC (ALL PAGES) ================= */
document.addEventListener("DOMContentLoaded", () => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = savedCart;

    // Update UI only if elements exist
    if (document.getElementById("cart-count")) {
        updateCartUI();
    }
});


let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* CHANGE QUANTITY */
function changeQty(btn, change) {
    const qtySpan = btn.parentElement.querySelector("span");
    let qty = parseInt(qtySpan.innerText);

    qty += change;
    if (qty < 0) qty = 0;

    qtySpan.innerText = qty;
}

/* ADD TO CART */
function addToCart(name, price, qty = 1) {
    const existing = cart.find(i => i.name === name);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ name, price, qty });
    }

    updateCartUI();
    alert(`${name} added to cart`);
}


/* UPDATE CART UI */
function updateCartUI() {
    localStorage.setItem("cart", JSON.stringify(cart));

    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");

    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        count += item.qty;
    });

    if (cartCount) cartCount.innerText = count;
    if (cartTotal) cartTotal.innerText = total;

    if (!cartItems) return;   // 👈 THIS LINE FIXES OTHER PAGES

    cartItems.innerHTML = "";

    cart.forEach((item, index) => {
        cartItems.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    ₹${item.price} × ${item.qty}
                </div>
                <button class="cart-item-remove" onclick="removeItem(${index})">X</button>
            </div>
        `;
    });
}


function syncCartFromStorage() {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = savedCart;

    let count = 0;
    let total = 0;

    cart.forEach(item => {
        count += item.qty;
        total += item.qty * item.price;
    });

    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");

    if (cartCount) cartCount.innerText = count;
    if (cartTotal) cartTotal.innerText = total;
}


function addToCartFromCategory(e, name, price) {
    e.stopPropagation(); // 🚫 stops redirect
    addToCart(name, price, 1);
}


/* REMOVE ITEM */
function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

/* TOGGLE CART MODAL */
function toggleCart() {
    const modal = document.getElementById("cart-modal");
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}
/* ================= SEARCH FILTER ================= */
const searchInput = document.getElementById("searchInput");

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();

        const allProducts = document.querySelectorAll(
            ".offer-card, .product-item, .combo-card, .product-card"
        );

        allProducts.forEach(card => {
            const title =
                card.querySelector("h3")?.innerText ||
                card.querySelector("h4")?.innerText ||
                "";

            card.style.display =
                title.toLowerCase().includes(query) ? "block" : "none";
        });
    });
}


/* ================= HEADER MENU TOGGLE ================= */
/* ================= HEADER MENU TOGGLE ================= */

/* ================= HEADER MENU TOGGLE ================= */

/* ================= LANGUAGE SUPPORT ================= */

const languageSelect = document.getElementById("languageSelect");

/* Language Data */
const translations = {
    en: {
        home: "Home",
        categories: "Categories",
        search: "Search",
        about: "About Us",
        contact: "Contact Us",
        cart: "Your Cart",
        checkout: "Checkout",
        logout: "Logout",
        total: "Total",
        shopNow: "Shop Now",
        myOrders: "My Orders",
        payment: "Payment Method",
        placeOrder: "Place Order"
    },
    te: {
        home: "హోమ్",
        categories: "వర్గాలు",
        search: "శోధన",
        about: "మా గురించి",
        contact: "సంప్రదించండి",
        cart: "మీ కార్ట్",
        checkout: "చెకౌట్",
        logout: "లాగ్ అవుట్",
        total: "మొత్తం",
        shopNow: "ఇప్పుడే కొనండి",
        myOrders: "నా ఆర్డర్లు",
        payment: "చెల్లింపు విధానం",
        placeOrder: "ఆర్డర్ చేయండి"
    },
    hi: {
        home: "होम",
        categories: "श्रेणियाँ",
        search: "खोज",
        about: "हमारे बारे में",
        contact: "संपर्क करें",
        cart: "आपकी कार्ट",
        checkout: "चेकआउट",
        logout: "लॉग आउट",
        total: "कुल",
        shopNow: "अभी खरीदें",
        myOrders: "मेरे ऑर्डर",
        payment: "भुगतान विधि",
        placeOrder: "ऑर्डर करें"
    }
};


/* Apply Language */
function applyLanguage(lang) {
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.getAttribute("data-lang");
        el.innerText = translations[lang][key];
    });

    localStorage.setItem("language", lang);
}

/* Load Saved Language */
const savedLang = localStorage.getItem("language") || "en";
languageSelect.value = savedLang;
applyLanguage(savedLang);

/* Change Language */
languageSelect.addEventListener("change", () => {
    applyLanguage(languageSelect.value);
});
/* ================= IMAGE SLIDER ================= */

window.addEventListener("load", () => {
    const slidesContainer = document.getElementById("slides");
    const slides = document.querySelectorAll(".slide");
    let index = 0;

    if (!slidesContainer || slides.length === 0) {
        console.error("Slider elements not found");
        return;
    }

    setInterval(() => {
        index = (index + 1) % slides.length;
        slidesContainer.style.transform =
            `translateX(-${index * 100}%)`;
    }, 3000);
});
/* ================= CHECKOUT LOGIC ================= */



/* Open checkout */
document.querySelector(".checkout-btn").addEventListener("click", () => {
    if (cart.length === 0) {
        alert("Cart is empty");
        return;
    }
    toggleCart();
    showCheckout();
});

function showCheckout() {
    const modal = document.getElementById("checkout-modal");
    const itemsDiv = document.getElementById("checkout-items");
    const totalSpan = document.getElementById("checkout-total");

    itemsDiv.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        itemsDiv.innerHTML += `
            <div class="cart-item">
                <div>
                    ${item.name} × ${item.qty}
                </div>
                <div>₹${item.price * item.qty}</div>
            </div>
        `;
    });

    totalSpan.innerText = total;
    modal.style.display = "flex";
}

function toggleCheckout() {
    document.getElementById("checkout-modal").style.display = "none";
}

function togglePaymentUI() {
    const method = document.getElementById("paymentMethod").value;

    document.getElementById("upiBox").style.display =
        method === "UPI" ? "block" : "none";

    document.getElementById("cardBox").style.display =
        method === "Card" ? "block" : "none";
}


/* Place Order */
function placeOrder() {
    const payment = document.getElementById("paymentMethod").value;
    const userEmail = localStorage.getItem("loggedUser");

    if (!userEmail) {
        alert("Please login");
        return;
    }

    fetch("https://grosgo-backend-ohy8.onrender.com/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_email: userEmail,
            items: cart,
            total: document.getElementById("checkout-total").innerText,
            payment: payment
        })
    })
        .then(res => res.json())
        .then(data => {
            alert("✅ Order placed successfully");

            cart = [];
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartUI();
            toggleCheckout();
            updateDashboard();
        })
        .catch(err => {
            console.error(err);
            alert("Order failed");
        });
}




/* ================= ORDER HISTORY ================= */

/* ================= USER DASHBOARD ================= */


/* ================= BAR CHART LOGIC ================= */


/* ================= CATEGORY FILTER ================= */

function filterCategory(category) {
    const products = getAdminProducts();
    const container = document.getElementById("productList");
    if (!container) return;

    container.innerHTML = "";

    products
        .filter(p => category === "" || p.category === category)
        .forEach(p => {
            container.innerHTML += `
        <div class="product-card">
          <img src="${p.image}">
          <h3>${p.name}</h3>
          <p>₹${p.price}</p>
          <button onclick="addToCart('${p.name}', ${p.price}, 1)">Add to Cart</button>
        </div>
      `;
        });
}

let selectedProduct = {};
let detailQty = 1;

function openProductDetails(card) {
    selectedProduct = {
        name: card.dataset.name,
        price: Number(card.dataset.price),
        image: card.dataset.image
    };

    document.getElementById("detailName").innerText = selectedProduct.name;
    document.getElementById("detailPrice").innerText = selectedProduct.price;
    document.getElementById("detailImage").src = selectedProduct.image;

    detailQty = 1;
    document.getElementById("detailQty").innerText = detailQty;

    document.getElementById("productDetailsModal").style.display = "flex";
}

function closeProductDetails() {
    document.getElementById("productDetailsModal").style.display = "none";
}

function changeDetailQty(value) {
    detailQty = Math.max(1, detailQty + value);
    document.getElementById("detailQty").innerText = detailQty;
}

function addDetailToCart() {
    cart.push({
        name: selectedProduct.name,
        price: selectedProduct.price,
        qty: detailQty
    });

    updateCartUI();
    closeProductDetails();
    alert("Product added to cart");
}



function openProductPage(card) {
    const name = card.dataset.name;
    const price = card.dataset.price;
    const image = card.dataset.image;

    const url =
        `product.html?name=${encodeURIComponent(name)}&price=${price}&image=${encodeURIComponent(image)}`;

    window.location.href = url;
}



/* ================= SIDE MENU LOGIC ================= */




const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("menuOverlay");

if (menuBtn && sideMenu && overlay) {
    menuBtn.onclick = () => {
        sideMenu.classList.add("open");
        overlay.style.display = "block";
    };
}



function closeMenu() {
    if (sideMenu) sideMenu.classList.remove("open");
    if (overlay) overlay.style.display = "none";
}
function goHome() {
    closeMenu();
    window.location.href = "index.html#home";
}

function openCategories() {
    closeMenu();
    window.location.href = "category.html?type=Vegetables";
}

function goSearch() {
    closeMenu();
    const search = document.getElementById("searchInput");
    if (search) {
        search.focus();
    } else {
        window.location.href = "index.html#search";
    }
}

function goAbout() {
    closeMenu();
    window.location.href = "index.html#footer";
}

function goContact() {
    closeMenu();
    window.location.href = "index.html#footer";
}

/* ================= CHATBOT LOGIC ================= */

document.addEventListener("DOMContentLoaded", () => {
    const chatbotToggle = document.getElementById("chatbot-toggle");
    const chatbot = document.getElementById("chatbot");
    const sendBtn = document.getElementById("sendBtn");
    const userInput = document.getElementById("user-input");
    const chatBody = document.getElementById("chat-body");

    if (!chatbotToggle || !chatbot) {
        console.warn("Chatbot elements not found");
        return;
    }

    // Toggle chatbot open/close
    chatbotToggle.addEventListener("click", () => {
        chatbot.style.display =
            chatbot.style.display === "flex" ? "none" : "flex";
    });

    // Send message
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // User message
        const userDiv = document.createElement("div");
        userDiv.className = "user";
        userDiv.innerText = message;
        chatBody.appendChild(userDiv);

        userInput.value = "";

        // Bot reply (basic logic)
        setTimeout(() => {
            const botDiv = document.createElement("div");
            botDiv.className = "bot";
            botDiv.innerText = getBotReply(message);
            chatBody.appendChild(botDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 500);
    }

    // Send button click
    sendBtn.addEventListener("click", sendMessage);

    // Enter key send
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
});

/* ================= BOT RESPONSES ================= */

function getBotReply(msg) {
    msg = msg.toLowerCase();

    if (msg.includes("hello") || msg.includes("hi")) {
        return "Hello 👋 How can I help you today?";
    }
    if (msg.includes("order")) {
        return "You can view your orders from the menu → My Orders.";
    }
    if (msg.includes("cart")) {
        return "You can open your cart by clicking the 🛒 icon.";
    }
    if (msg.includes("delivery")) {
        return "Delivery usually takes 1–2 business days 🚚";
    }
    if (msg.includes("payment")) {
        return "We support UPI, Card and Cash on Delivery.";
    }
    if (msg.includes("contact")) {
        return "You can contact us via support@grosgo.com";
    }

    return "Sorry 😅 I didn’t understand that. Please try again.";
}
/* ================= WISHLIST LOGIC ================= */

function getWishlistKey() {
    const user = localStorage.getItem("loggedUser");
    return user ? `wishlist_${user}` : null;
}

function getWishlist() {
    const key = getWishlistKey();
    return key ? JSON.parse(localStorage.getItem(key)) || [] : [];
}

function saveWishlist(list) {
    const key = getWishlistKey();
    if (key) localStorage.setItem(key, JSON.stringify(list));
}

/* ADD TO WISHLIST */
function addToWishlist(name, price, image) {
    const user = localStorage.getItem("loggedUser");
    if (!user) {
        alert("Please login to use wishlist");
        return;
    }

    const wishlist = getWishlist();
    const exists = wishlist.find(i => i.name === name);

    if (exists) {
        alert("Already in wishlist ❤️");
        return;
    }

    wishlist.push({ name, price, image });
    saveWishlist(wishlist);

    alert(`${name} added to wishlist ❤️`);
}

/* OPEN WISHLIST */
function openWishlist() {
    const modal = document.getElementById("wishlist-modal");
    const itemsDiv = document.getElementById("wishlist-items");

    if (!modal || !itemsDiv) return;

    const wishlist = getWishlist();
    itemsDiv.innerHTML = "";

    if (wishlist.length === 0) {
        itemsDiv.innerHTML = "<p>Your wishlist is empty</p>";
    } else {
        wishlist.forEach((item, index) => {
            itemsDiv.innerHTML += `
                <div class="cart-item">
                    <div>
                        <strong>${item.name}</strong><br>
                        ₹${item.price}
                    </div>
                    <div>
                        <button onclick="moveWishlistToCart(${index})">🛒</button>
                        <button onclick="removeFromWishlist(${index})">❌</button>
                    </div>
                </div>
            `;
        });
    }

    modal.style.display = "flex";
}

/* CLOSE WISHLIST */
function closeWishlist() {
    document.getElementById("wishlist-modal").style.display = "none";
}

/* REMOVE ITEM */
function removeFromWishlist(index) {
    const wishlist = getWishlist();
    wishlist.splice(index, 1);
    saveWishlist(wishlist);
    openWishlist();
}

/* MOVE TO CART */
function moveWishlistToCart(index) {
    const wishlist = getWishlist();
    const item = wishlist[index];

    addToCart(item.name, item.price, 1);
    wishlist.splice(index, 1);
    saveWishlist(wishlist);
    openWishlist();
}



/* ================= MY ORDERS (MYSQL) ================= */

async function openOrders() {
    const modal = document.getElementById("orders-modal");
    const ordersList = document.getElementById("orders-list");

    if (!modal || !ordersList) {
        alert("Orders modal not found");
        return;
    }

    const userEmail = localStorage.getItem("loggedUser");
    if (!userEmail) {
        alert("Please login first");
        return;
    }

    ordersList.innerHTML = "<p>Loading...</p>";
    modal.style.display = "flex";

    try {
        const res = await fetch(
            `https://grosgo-backend-ohy8.onrender.com/orders/${userEmail}`
        );
        const orders = await res.json();
        myOrdersCache = orders;

        ordersList.innerHTML = "";

        if (orders.length === 0) {
            ordersList.innerHTML = "<p>No orders found.</p>";
            return;
        }

        orders.forEach((order, index) => {
            const itemsHTML = order.items
                .map(i => `<li>${i.name} × ${i.qty}</li>`)
                .join("");

            ordersList.innerHTML += `
        <div class="cart-item order-card">
          <div class="order-info">
            <strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}<br>
            <strong>Status:</strong> ${order.status}<br>
            <strong>Payment:</strong> ${order.payment}<br>
            <strong>Total:</strong> ₹${order.total}

            <h4>Items:</h4>
            <ul>${itemsHTML}</ul>
          </div>

          <div class="order-actions">
            ${order.status === "Placed"
                    ? `<button onclick="cancelOrder(${order.id})" class="cancel-btn">Cancel ❌</button>`
                    : `<button disabled class="cancel-btn disabled">Cannot Cancel</button>`
                }

            <button onclick="trackOrder('${order.status}')" class="track-btn">Track 🚚</button>
            <button onclick="downloadBillMySQL(${index})" class="download-btn">Download 🧾</button>
          </div>
        </div>
      `;
        });

    } catch (err) {
        console.error(err);
        ordersList.innerHTML = "<p>Server error</p>";
    }
}


function updateDeliveryMap(status) {
    const map = document.getElementById("delivery-map");
    if (!map) return;

    let location = "";

    switch (status) {
        case "Placed":
            location = "Warehouse India";
            break;
        case "Packed":
            location = "GROSGO Warehouse India";
            break;
        case "Out for Delivery":
            location = "Nearest Delivery Hub India";
            break;
        case "Delivered":
            location = "Customer Location India";
            break;
        default:
            location = "India";
    }

    map.src =
        "https://www.google.com/maps?q=" +
        encodeURIComponent(location) +
        "&output=embed";
}
function animateRider(status) {
    const rider = document.getElementById("delivery-rider");
    if (!rider) return;

    let position = "10%";

    switch (status) {
        case "Placed":
            position = "10%";
            break;
        case "Packed":
            position = "35%";
            break;
        case "Out for Delivery":
            position = "65%";
            break;
        case "Delivered":
            position = "90%";
            break;
    }

    rider.style.left = position;
}


function trackOrder(status) {
    const modal = document.getElementById("delivery-modal");
    const steps = document.querySelectorAll(".delivery-steps .step");

    modal.style.display = "flex";

    steps.forEach(step => {
        step.classList.remove("active", "completed");

        if (step.dataset.step === status) {
            step.classList.add("active");
        }

        if (
            step.dataset.step === "Placed" &&
            ["Packed", "Out for Delivery", "Delivered"].includes(status) ||
            step.dataset.step === "Packed" &&
            ["Out for Delivery", "Delivered"].includes(status) ||
            step.dataset.step === "Out for Delivery" &&
            status === "Delivered"
        ) {
            step.classList.add("completed");
        }
    });

    // ✅ THIS WAS MISSING
    updateDeliveryMap(status);
    animateRider(status);

}


function closeDelivery() {
    document.getElementById("delivery-modal").style.display = "none";
}



async function cancelOrder(orderId) {
    if (!confirm("Cancel this order?")) return;

    try {
        await fetch(`https://grosgo-backend-ohy8.onrender.com/orders/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Cancelled" })
        });

        alert("Order cancelled ❌");
        openOrders();

    } catch (err) {
        alert("Cancel failed");
    }
}


function downloadBillMySQL(index) {
    const order = myOrdersCache[index];

    if (!order) {
        alert("Order not found");
        return;
    }

    // ✅ SAFE ITEMS PARSING (NO DOUBLE JSON PARSE)
    const items =
        typeof order.items === "string"
            ? JSON.parse(order.items)
            : order.items;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // ✅ USE SAFE FONT (VERY IMPORTANT)
    doc.setFont("courier", "normal");

    let y = 20;

    /* ================= HEADER ================= */
    doc.setFontSize(18);
    doc.text("GROSGO", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.text("Online Indian Grocery Store", 105, y, { align: "center" });
    y += 6;

    doc.text("Email: support@grosgo.com | Phone: +91 12345 67890", 105, y, {
        align: "center"
    });
    y += 8;

    doc.line(10, y, 200, y);
    y += 8;

    /* ================= ORDER DETAILS ================= */
    doc.setFontSize(12);
    doc.text(`Invoice No: INV-${order.id}`, 14, y);
    y += 6;

    doc.text(`Order ID: ${order.id}`, 14, y);
    y += 6;

    doc.text(
        `Order Date: ${new Date(order.created_at).toLocaleString()}`,
        14,
        y
    );
    y += 6;

    doc.text(`Payment Method: ${order.payment}`, 14, y);
    y += 6;

    doc.text(`Order Status: ${order.status}`, 14, y);
    y += 10;

    doc.line(10, y, 200, y);
    y += 8;

    /* ================= ITEMS TABLE HEADER ================= */
    doc.setFontSize(12);
    doc.text("Items", 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.text("No", 14, y);
    doc.text("Item Name", 25, y);
    doc.text("Qty", 120, y);
    doc.text("Price", 140, y);
    doc.text("Total", 170, y);
    y += 4;

    doc.line(10, y, 200, y);
    y += 6;

    /* ================= ITEMS LIST ================= */
    let grandTotal = 0;

    items.forEach((item, i) => {
        const name = String(item.name);
        const qty = Number(item.qty);
        const price = Number(item.price);
        const lineTotal = qty * price;
        grandTotal += lineTotal;

        doc.text(String(i + 1), 14, y);
        doc.text(name, 25, y);
        doc.text(String(qty), 120, y);
        doc.text(`${price}`, 140, y);
        doc.text(`${lineTotal}`, 170, y);

        y += 6;

        // Page break protection
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    y += 6;
    doc.line(10, y, 200, y);
    y += 8;

    /* ================= TOTAL ================= */
    doc.setFontSize(14);
    doc.text(`Grand Total: ${order.total}`, 140, y);
    y += 12;

    /* ================= FOOTER ================= */
    doc.setFontSize(10);
    doc.text(
        "Thank you for shopping with GROSGO!",
        105,
        y,
        { align: "center" }
    );
    y += 6;

    doc.text(
        "This is a system generated invoice.",
        105,
        y,
        { align: "center" }
    );

    /* ================= SAVE PDF ================= */
    doc.save(`GROSGO_Order_${order.id}.pdf`);
}



function closeOrders() {
    document.getElementById("orders-modal").style.display = "none";
}

/* ================= DASHBOARD (MYSQL) ================= */
async function updateDashboard() {
    const userEmail = localStorage.getItem("loggedUser");
    if (!userEmail) return;

    try {
        const res = await fetch(
            `https://grosgo-backend-ohy8.onrender.com/dashboard/${userEmail}`
        );

        const data = await res.json();

        document.getElementById("dash-orders").innerText =
            data.totalOrders || 0;

        document.getElementById("dash-revenue").innerText =
            data.totalSpent || 0;

        document.getElementById("dash-last").innerText =
            data.lastOrder
                ? new Date(data.lastOrder).toLocaleString()
                : "N/A";

    } catch (err) {
        console.error("Dashboard fetch failed", err);
    }
}
document.addEventListener("DOMContentLoaded", updateDashboard);

/* ================= GRAPH (MYSQL) ================= */
async function updateGraph() {
    const userEmail = localStorage.getItem("loggedUser");
    if (!userEmail) return;

    try {
        const res = await fetch(
            `https://grosgo-backend-ohy8.onrender.com/dashboard/${userEmail}`
        );

        const data = await res.json();

        const totalOrders = data.totalOrders || 0;
        const totalSpent = data.totalSpent || 0;

        // Scale values
        const ordersHeight = Math.min(totalOrders * 40, 200);
        const revenueHeight = Math.min(totalSpent / 10, 200);

        document.getElementById("ordersBar").style.height =
            ordersHeight + "px";

        document.getElementById("revenueBar").style.height =
            revenueHeight + "px";

    } catch (err) {
        console.error("Graph fetch failed", err);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    updateGraph();
});


document.querySelectorAll(".shop-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document
            .querySelector(".products-section")
            ?.scrollIntoView({ behavior: "smooth" });
    });
});







function renderOfferProduct(p) {
    return `
    <div class="offer-card"
      onclick="goToProduct(
        '${p.name}',
        ${p.price},
        '${p.image}',
        '${p.home_section}',
        '${p.category}'
      )">
      <img src="${p.image}">
      <h4>${p.name}</h4>
      <p class="brand">GROSGO</p>
      <p class="price">
        <span class="new">£${p.price}</span>
      </p>
      <button>Choose options</button>
    </div>
  `;
}

function renderBestSeller(p) {
    return `
    <div class="offer-card"
      onclick="goToProduct(
        '${p.name}',
        ${p.price},
        '${p.image}',
        '${p.home_section}',
        '${p.category}'
      )">
      <img src="${p.image}">
      <h4>${p.name}</h4>
      <p class="brand">GROSGO</p>
      <p class="price">
        <span class="new">£${p.price}</span>
      </p>
      <button>Choose options</button>
    </div>
  `;
}

function renderCombo(p) {
    return `
    <div class="combo-card"
      onclick="goToProduct(
        '${p.name}',
        ${p.price},
        '${p.image}',
        '${p.home_section}',
        '${p.category}'
      )">

      <img src="${p.image}">
      <h4>${p.name}</h4>
      <p class="price">£${p.price}</p>

      <!-- ✅ qty box -->
      <div class="qty-box" onclick="event.stopPropagation()">
        <button onclick="changeComboQty(this, -1)">−</button>
        <span>0</span>
        <button onclick="changeComboQty(this, 1)">+</button>
      </div>

    </div>
  `;
}
function renderFestivalCombo(p) {
    const discountedPrice = Math.round(p.price * 0.55); // 45% OFF

    return `
    <div class="combo-card"
      onclick="goToProduct(
  '${p.name}',
  ${discountedPrice},
  '${p.image}',
  '${p.home_section}',
  '${p.category}'
)"

>

      <div class="discount-badge">45% OFF</div>

      <img src="${p.image}">
      <h4>${p.name}</h4>

      <p class="price">
        <span class="old">₹${p.price}</span>
        <strong>₹${discountedPrice}</strong>
      </p>

      <!-- ✅ qty box -->
      <div class="qty-box" onclick="event.stopPropagation()">
        <button onclick="changeComboQty(this, -1)">−</button>
        <span>0</span>
        <button onclick="changeComboQty(this, 1)">+</button>
      </div>
    </div>
  `;
}



function changeComboQty(btn, change) {
    const span = btn.parentElement.querySelector("span");
    let qty = parseInt(span.innerText);
    qty = Math.max(0, qty + change);
    span.innerText = qty;
}

function renderProduct(p) {
    return `
    <div class="product-item"
      onclick="goToProduct(
        '${p.name}',
        ${p.price},
        '${p.image}',
        '${p.home_section}',
        '${p.category}'
      )">
      <img src="${p.image}">
      <h4>${p.name}</h4>
      <span class="brand">GROSGO</span>
      <p class="price">£${p.price}</p>
      <button class="choose-btn">Choose options</button>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", loadHomeSections);

async function loadHomeSections() {
    const res = await fetch("https://grosgo-backend-ohy8.onrender.com/products");
    const products = await res.json();

    products.forEach(p => {
        if (p.category === "offer") {
            offerProducts.innerHTML += renderOfferProduct(p);
        }
        if (p.category === "best_seller") {
            bestSellerProducts.innerHTML += renderBestSeller(p);
        }
        if (p.category === "combo") {
            comboProducts.innerHTML += renderCombo(p);
        }
        if (p.category === "featured") {
            featuredProducts.innerHTML += renderProduct(p);
        }
        // ✅ NEW FESTIVAL COMBO SECTIO
        if (p.home_section === "festival_combo") {
            festivalComboProducts.innerHTML += renderFestivalCombo(p);
        }


    });
}

// ✅ SINGLE SOURCE OF TRUTH
function goToProduct(name, price, image, homeSection = "", category = "") {

    sessionStorage.setItem(
        "currentProduct",
        JSON.stringify({
            name,
            price,
            image,
            home_section: homeSection,   // ✅ IMPORTANT
            category
        })
    );

    window.location.href =
        `product.html?name=${encodeURIComponent(name)}&price=${price}&image=${encodeURIComponent(image)}`;
}


