// ================= CONFIG =================
const ADMIN = { email: "admin@grosgo.com", password: "admin123" };
const API_BASE = "https://grosgo-backend-ohy8.onrender.com";

// Global variables
let chartInstance = null;
let currentEditProductId = null;
let productsData = [];
let usersData = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("adminLogged") === "true") {
    showAdmin();
  } else {
    showLogin();
  }
});

// ================= AUTH =================
function adminLogin() {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;
  if (email === ADMIN.email && password === ADMIN.password) {
    localStorage.setItem("adminLogged", "true");
    showAdmin();
    showToast("Login successful", "success");
  } else {
    showToast("Invalid credentials", "error");
  }
}

function showLogin() {
  document.getElementById("adminLogin").style.display = "block";
  document.getElementById("adminPanel").style.display = "none";
}

function showAdmin() {
  document.getElementById("adminLogin").style.display = "none";
  document.getElementById("adminPanel").style.display = "flex";
  showSection("dashboard");
  loadDashboard();
  loadUsers();
}

function adminLogout() {
  localStorage.removeItem("adminLogged");
  showToast("Logged out", "info");
  location.reload();
}

// ================= NAVIGATION =================
function showSection(id) {
  document.querySelectorAll(".admin-section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
  if (id === "orders") loadOrders();
  if (id === "products") loadProducts();
  if (id === "users") loadUsers();
}

// ================= TOAST =================
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

// ================= LOADING SPINNER (simple) =================
function setLoading(elementId, isLoading) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (isLoading) {
    el.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  }
}

// ================= DASHBOARD =================
async function loadDashboard() {
  try {
    setLoading("totalUsers", true);
    // Fetch orders
    const ordersRes = await fetch(`${API_BASE}/orders`);
    const orders = await ordersRes.json();

    // Fetch users
    const usersRes = await fetch(`${API_BASE}/users`);
    const users = await usersRes.json();

    // Fetch products count
    const productsRes = await fetch(`${API_BASE}/products`);
    const products = await productsRes.json();

    // Update cards
    document.getElementById("totalOrders").innerText = orders.length;
    document.getElementById("totalUsers").innerText = users.length;
    document.getElementById("totalProducts").innerText = products.length;

    let revenue = 0;
    let pending = 0;
    orders.forEach(o => {
      revenue += Number(o.total) || 0;
      if (o.status !== "Delivered") pending++;
    });
    document.getElementById("totalRevenue").innerText = revenue.toFixed(2);
    document.getElementById("pendingOrders").innerText = pending;

    // Draw chart (orders by status)
    drawStatusChart(orders);

    // Show recent orders
    displayRecentOrders(orders.slice(0, 5));

  } catch (err) {
    console.error("Dashboard load failed", err);
    showToast("Failed to load dashboard", "error");
  }
}

function drawStatusChart(orders) {
  const statusCounts = {
    Placed: 0,
    Packed: 0,
    "Out for Delivery": 0,
    Delivered: 0
  };
  orders.forEach(o => {
    if (statusCounts.hasOwnProperty(o.status)) statusCounts[o.status]++;
    else statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const ctx = document.getElementById("ordersChart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ["#fbbf24", "#60a5fa", "#f87171", "#34d399"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Orders by Status" }
      }
    }
  });
}

function displayRecentOrders(orders) {
  const container = document.getElementById("recentOrdersList");
  container.innerHTML = orders.map(o => `
    <div class="order-preview-item">
      <span><b>${o.user_email}</b> - ₹${o.total}</span>
      <span class="order-status status-${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span>
    </div>
  `).join("");
}

// ================= ORDERS =================
async function loadOrders() {
  const box = document.getElementById("adminOrders");
  box.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>';

  try {
    const res = await fetch(`${API_BASE}/orders`);
    const orders = await res.json();

    if (!orders.length) {
      box.innerHTML = "<p class='no-data'>No orders found.</p>";
      return;
    }

    box.innerHTML = orders.map(o => `
      <div class="cart-item">
        <div class="order-header">
          <b>${o.user_email}</b>
          <span class="order-status status-${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span>
        </div>
        <div style="margin: 10px 0;">
          ₹${o.total} | ${o.payment} | <small>${new Date(o.created_at).toLocaleString()}</small>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <label>Status:</label>
          <select onchange="updateOrderStatus(${o.id}, this.value)">
            <option ${o.status === "Placed" ? "selected" : ""}>Placed</option>
            <option ${o.status === "Packed" ? "selected" : ""}>Packed</option>
            <option ${o.status === "Out for Delivery" ? "selected" : ""}>Out for Delivery</option>
            <option ${o.status === "Delivered" ? "selected" : ""}>Delivered</option>
          </select>
          <button class="order-details-btn" onclick="viewOrderDetails(${o.id})"><i class="fas fa-eye"></i> View Items</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    box.innerHTML = "<p class='error'>Failed to load orders.</p>";
    console.error(err);
    showToast("Error loading orders", "error");
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Update failed");
    showToast("Status updated ✅", "success");
    loadOrders(); // refresh
    loadDashboard(); // update pending count
  } catch (err) {
    showToast("Failed to update status", "error");
    console.error(err);
  }
}

async function viewOrderDetails(orderId) {
  try {
    // Assuming backend has /orders/:id/items or includes items in order
    // For demonstration, we'll show a static message. Replace with actual fetch if available.
    const res = await fetch(`${API_BASE}/orders/${orderId}`);
    const order = await res.json();
    // If items are in order.items, use them. Otherwise show dummy.
    let itemsHtml = "<p>Order items not available in this demo.</p>";
    if (order.items && order.items.length) {
      itemsHtml = order.items.map(item => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
          <span>${item.name} x ${item.quantity}</span>
          <span>₹${item.price * item.quantity}</span>
        </div>
      `).join("");
    }

    document.getElementById("orderDetails").innerHTML = `
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Customer:</strong> ${order.user_email}</p>
      <p><strong>Total:</strong> ₹${order.total}</p>
      <p><strong>Payment:</strong> ${order.payment}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <h4>Items</h4>
      ${itemsHtml}
    `;
    document.getElementById("orderModal").style.display = "flex";
  } catch (err) {
    showToast("Could not load order details", "error");
  }
}

function closeModal() {
  document.getElementById("orderModal").style.display = "none";
}

// ================= PRODUCTS =================
async function loadProducts() {
  const box = document.getElementById("adminProducts");
  box.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';

  try {
    const res = await fetch(`${API_BASE}/products`);
    productsData = await res.json();

    if (!productsData.length) {
      box.innerHTML = "<p class='no-data'>No products found.</p>";
      return;
    }

    displayProducts(productsData);
  } catch (err) {
    box.innerHTML = "<p class='error'>Error loading products.</p>";
    console.error(err);
    showToast("Failed to load products", "error");
  }
}

function displayProducts(products) {
  const box = document.getElementById("adminProducts");
  box.innerHTML = products.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-image">
        <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/150'">
      </div>
      <div class="product-info">
        <h4>${p.name}</h4>
        <div class="category">
          <span class="category-tag">${p.category}</span>
          ${p.home_section ? `<span class="section-tag">${p.home_section}</span>` : ''}
        </div>
        <div class="price">₹${p.price}</div>
        <div class="stock">Stock: ${p.stock}</div>
        <div class="product-actions">
          <button class="edit-btn" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="delete-btn" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

function filterProducts() {
  const search = document.getElementById("productSearch").value.toLowerCase();
  const filtered = productsData.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.category.toLowerCase().includes(search)
  );
  displayProducts(filtered);
}

// Add or Update Product
async function addProduct() {
  const name = document.getElementById("pName").value.trim();
  const price = parseFloat(document.getElementById("pPrice").value);
  const stock = parseInt(document.getElementById("pStock").value);
  const category = document.getElementById("pCategory").value;
  const homeSection = document.getElementById("pHomeSection").value;
  const image = document.getElementById("pImage").value.trim();

  if (!name || !price || !stock || !category || !image) {
    showToast("Please fill all required fields", "error");
    return;
  }

  const productData = { name, price, stock, category, image };
  if (homeSection) productData.home_section = homeSection;

  try {
    let url = `${API_BASE}/admin/products`;
    let method = "POST";
    if (currentEditProductId) {
      url = `${API_BASE}/admin/products/${currentEditProductId}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Operation failed");

    showToast(currentEditProductId ? "Product updated ✅" : "Product added ✅", "success");
    cancelEdit();
    loadProducts();
    loadDashboard(); // update product count
  } catch (err) {
    showToast(err.message, "error");
    console.error(err);
  }
}

function editProduct(id) {
  const product = productsData.find(p => p.id === id);
  if (!product) return;

  currentEditProductId = id;
  document.getElementById("formTitle").innerText = "Edit Product";
  document.getElementById("pName").value = product.name;
  document.getElementById("pPrice").value = product.price;
  document.getElementById("pStock").value = product.stock;
  document.getElementById("pCategory").value = product.category;
  document.getElementById("pHomeSection").value = product.home_section || "";
  document.getElementById("pImage").value = product.image || "";
  document.getElementById("imagePreview").src = product.image || "#";
  document.getElementById("imagePreview").style.display = product.image ? "block" : "none";
  document.getElementById("submitProductBtn").innerHTML = '<i class="fas fa-save"></i> Update Product';
  document.getElementById("cancelEditBtn").style.display = "inline-block";
}

function cancelEdit() {
  currentEditProductId = null;
  document.getElementById("formTitle").innerText = "Add New Product";
  document.getElementById("pName").value = "";
  document.getElementById("pPrice").value = "";
  document.getElementById("pStock").value = "";
  document.getElementById("pCategory").value = "";
  document.getElementById("pHomeSection").value = "";
  document.getElementById("pImage").value = "";
  document.getElementById("imagePreview").style.display = "none";
  document.getElementById("submitProductBtn").innerHTML = '<i class="fas fa-plus"></i> Add Product';
  document.getElementById("cancelEditBtn").style.display = "none";
}

function previewImage() {
  const url = document.getElementById("pImage").value;
  const preview = document.getElementById("imagePreview");
  if (url) {
    preview.src = url;
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showToast("Product deleted", "success");
    loadProducts();
    loadDashboard();
  } catch (err) {
    showToast("Delete failed", "error");
    console.error(err);
  }
}

// ================= USERS =================
async function loadUsers() {
  const box = document.getElementById("adminUsers");
  box.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';

  try {
    const res = await fetch(`${API_BASE}/users`);
    usersData = await res.json();

    if (!usersData.length) {
      box.innerHTML = "<p class='no-data'>No users found.</p>";
      return;
    }

    displayUsers(usersData);
  } catch (err) {
    box.innerHTML = "<p class='error'>Server not running</p>";
    console.error(err);
    showToast("Failed to load users", "error");
  }
}

function displayUsers(users) {
  const box = document.getElementById("adminUsers");
  box.innerHTML = users.map(u => `
    <div class="user-item" data-email="${u.email}">
      <div class="user-info">
        <strong>${u.name}</strong>
        <p>${u.email}</p>
      </div>
      <div class="user-actions">
        <button onclick="deleteUser('${u.email}')"><i class="fas fa-trash"></i> Delete</button>
      </div>
    </div>
  `).join("");
}

function filterUsers() {
  const search = document.getElementById("userSearch").value.toLowerCase();
  const filtered = usersData.filter(u =>
    u.name.toLowerCase().includes(search) ||
    u.email.toLowerCase().includes(search)
  );
  displayUsers(filtered);
}

async function deleteUser(email) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`${API_BASE}/users/${email}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showToast("User deleted", "success");
    loadUsers();
    loadDashboard(); // update user count
  } catch (err) {
    showToast("Failed to delete user", "error");
    console.error(err);
  }
}