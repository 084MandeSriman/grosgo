

/* ================= LOAD SELECTED PRODUCT ================= */

const params = new URLSearchParams(window.location.search);

const currentName = params.get("name");
const currentPrice = params.get("price");
const currentImage = params.get("image");

document.getElementById("productName").innerText = currentName;
document.getElementById("productPrice").innerText = currentPrice;
document.getElementById("productImage").src = currentImage;

/* ================= QUANTITY ================= */

let qty = 1;
function changeQty(val) {
    qty = Math.max(1, qty + val);
    document.getElementById("qty").innerText = qty;
}

/* ================= RENDER RECOMMENDED PRODUCTS ================= */



/* ================= NAVIGATE TO PRODUCT PAGE ================= */





function addProductPageToCart() {
  if (!currentName || !currentPrice) {
    alert("Product data missing");
    return;
  }

  addToCart(currentName, Number(currentPrice), qty);
}

function addProductPageToWishlist() {
  if (!currentName || !currentPrice || !currentImage) {
    alert("Product data missing");
    return;
  }

  addToWishlist(currentName, Number(currentPrice), currentImage);
}

function getCurrentProduct() {
  let product = sessionStorage.getItem("currentProduct");

  if (product) {
    return JSON.parse(product);
  }

  // 🔁 FALLBACK FROM URL (CRITICAL FIX)
  const params = new URLSearchParams(window.location.search);

  const fallback = {
    name: params.get("name"),
    price: Number(params.get("price")),
    image: params.get("image"),
    home_section: params.get("home_section") || "",
    category: params.get("category") || ""
  };

  // Save fallback for future clicks
  sessionStorage.setItem("currentProduct", JSON.stringify(fallback));

  return fallback;
}
async function loadSuggestions() {
  const product = getCurrentProduct();

  console.log("🔍 Suggestion base product:", product);

  if (!product || !product.home_section || !product.category) {
    console.warn("❌ Missing section data, cannot load suggestions");
    return;
  }

  try {
    const url = `https://grosgo-backend-ohy8.onrender.com
/products/suggestions?home_section=${product.home_section}&category=${product.category}&exclude=${product.name}`;

    console.log("➡️ Fetching:", url);

    const res = await fetch(url);
    const data = await res.json();

    const container = document.getElementById("recommendProducts");
    container.innerHTML = "";

    if (!data.length) {
      container.innerHTML = "<p>No suggestions found</p>";
      return;
    }

    data.forEach(p => {
      container.innerHTML += `
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
          <p class="price">£${p.price}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error("🔥 Suggestions failed", err);
  }
}

document.addEventListener("DOMContentLoaded", loadSuggestions);


