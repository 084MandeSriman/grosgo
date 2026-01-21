const ADMIN = { email:"admin@grosgo.com", password:"admin123" };

document.addEventListener("DOMContentLoaded", () => {
  localStorage.getItem("adminLogged")==="true" ? showAdmin() : showLogin();
});

function adminLogin(){
  if(adminEmail.value===ADMIN.email && adminPassword.value===ADMIN.password){
    localStorage.setItem("adminLogged","true");
    showAdmin();
  } else alert("Invalid credentials");
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


function adminLogout(){
  localStorage.removeItem("adminLogged");
  location.reload();
}

function showSection(id){
  document.querySelectorAll(".admin-section").forEach(s=>s.style.display="none");
  document.getElementById(id).style.display="block";
  if(id==="orders") loadOrders();
  if(id==="products") loadProducts();
}

async function loadDashboard() {
  try {
    // ✅ GET ORDERS FROM MYSQL
    const res = await fetch("https://grosgo-backend-ohy8.onrender.com/orders");
    const orders = await res.json();

    document.getElementById("totalOrders").innerText = orders.length;

    let revenue = 0;
    let pending = 0;

    orders.forEach(o => {
      revenue += Number(o.total);
      if (o.status !== "Delivered") pending++;
    });

    document.getElementById("totalRevenue").innerText = revenue;
    document.getElementById("pendingOrders").innerText = pending;

    drawChart(orders);

    // ✅ USERS COUNT (MYSQL)
    const userRes = await fetch("https://grosgo-backend-ohy8.onrender.com/users");
    const users = await userRes.json();
    document.getElementById("totalUsers").innerText = users.length;

  } catch (err) {
    console.error("Dashboard load failed", err);
  }
}



function drawChart(orders){
  new Chart(ordersChart,{
    type:"bar",
    data:{
      labels:orders.map((_,i)=>`Order ${i+1}`),
      datasets:[{label:"Revenue",data:orders.map(o=>o.total),backgroundColor:"#1f2a7c"}]
    }
  });
}


async function loadOrders() {
  const box = document.getElementById("adminOrders");

  const res = await fetch("https://grosgo-backend-ohy8.onrender.com/orders");
  const orders = await res.json();

  box.innerHTML = "";

  orders.forEach(o => {
    box.innerHTML += `
      <div class="cart-item">
        <b>${o.user_email}</b><br>
        ₹${o.total} | ${o.payment}<br>

        <label>Status:</label>
        <select onchange="updateOrderStatus(${o.id}, this.value)">
          <option ${o.status==="Placed"?"selected":""}>Placed</option>
          <option ${o.status==="Packed"?"selected":""}>Packed</option>
          <option ${o.status==="Out for Delivery"?"selected":""}>Out for Delivery</option>
          <option ${o.status==="Delivered"?"selected":""}>Delivered</option>
        </select>

        <br><small>${o.created_at}</small>
      </div>
    `;
  });
}
async function updateOrderStatus(orderId, status) {
  try {
    await fetch(`https://grosgo-backend-ohy8.onrender.com/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    alert("Status updated ✅");
  } catch (err) {
    alert("Failed to update status");
    console.error(err);
  }
}


async function addProduct() {
  const name = pName.value.trim();
  const price = Number(pPrice.value);
  const stock = Number(pStock.value);
  const category = pCategory.value;
  const homeSection = pCategory.value;
  const image = pImage.value.trim();

  if (!name || !price || !stock || !category || !image) {
    alert("Fill all fields");
    return;
  }

  try {
    const res = await fetch("https://grosgo-backend-ohy8.onrender.com/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price, stock, category,home_section: homeSection, image })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("✅ Product added to database");

    // clear form
    pName.value = "";
    pPrice.value = "";
    pStock.value = "";
    pCategory.value = "";
    pImage.value = "";

    loadProducts(); // refresh list

  } catch (err) {
    alert("Server not running");
    console.error(err);
  }
}



async function loadProducts() {
  const box = document.getElementById("adminProducts");
  if (!box) return;

  try {
    const res = await fetch("https://grosgo-backend-ohy8.onrender.com/products");
    const products = await res.json();

    box.innerHTML = "";

    products.forEach(p => {
  box.innerHTML += `
    <div class="cart-item">
      <strong>${p.name}</strong><br>
      ${p.category}<br>
      ₹${p.price} | Stock: ${p.stock}<br><br>

      <button
        onclick="deleteProduct(${p.id})"
        style="
          background:#e53935;
          color:white;
          border:none;
          padding:6px 12px;
          border-radius:6px;
          cursor:pointer
        ">
        ❌ Delete
      </button>
    </div>
  `;
});


  } catch (err) {
    box.innerHTML = "<p>Error loading products</p>";
    console.error(err);
  }
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  try {
    const res = await fetch(
      `https://grosgo-backend-ohy8.onrender.com/admin/products/${id}`,
      { method: "DELETE" }
    );

    const data = await res.json();
    alert(data.message);

    loadProducts(); // refresh list
  } catch (err) {
    alert("Delete failed");
    console.error(err);
  }
}

async function loadUsers() {
    const box = document.getElementById("adminUsers");
    if (!box) return;

    try {
        const res = await fetch("https://grosgo-backend-ohy8.onrender.com/users");
        const users = await res.json();

        box.innerHTML = "";

        if (users.length === 0) {
            box.innerHTML = "<p>No users found</p>";
            return;
        }

        users.forEach(u => {
            box.innerHTML += `
              <div class="cart-item">
                <div>
                  <strong>${u.name}</strong><br>
                  ${u.email}
                </div>

                <button onclick="deleteUser('${u.email}')" style="background:#e53935;color:white;border:none;padding:6px 10px;border-radius:6px;cursor:pointer">
                  ❌ Delete
                </button>
              </div>
            `;
        });

    } catch (err) {
        box.innerHTML = "<p>Server not running</p>";
        console.error(err);
    }
}
async function deleteUser(email) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
        const res = await fetch(`https://grosgo-backend-ohy8.onrender.com/users/${email}`, {
            method: "DELETE"
        });

        const data = await res.json();
        alert(data.message);

        loadUsers();        // refresh users list
        loadDashboard();    // update user count

    } catch (err) {
        alert("Failed to delete user");
        console.error(err);
    }
}




