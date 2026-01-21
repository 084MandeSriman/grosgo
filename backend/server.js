require("dotenv").config();
const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});


db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL Connected");
});



/* ================= ADD PRODUCT (ADMIN) ================= */
app.post("/admin/products", (req, res) => {
  const { name, price, stock, category,home_section, image } = req.body;
  if (!name || !price || !stock || !category ||!home_section ||!image) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql = `
    INSERT INTO products (name, price, stock, category,home_section, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, price, stock, category,home_section, image], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Product added successfully" });
  });
});

/* ================= GET PRODUCTS ================= */

app.get("/products", (req, res) => {
  const category = req.query.category;

  const sql = category
    ? "SELECT * FROM products WHERE category=?"
    : "SELECT * FROM products";

  db.query(sql, category ? [category] : [], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

/* ================= PLACE ORDER ================= */
app.post("/orders", (req, res) => {
  const { user_email, items, total, payment } = req.body;

  if (!user_email || !items || !total || !payment) {
    return res.status(400).json({ message: "Missing order data" });
  }

  const sql = `
    INSERT INTO orders (user_email, items, total, payment, status)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [user_email, JSON.stringify(items), total, payment, "Placed"],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ message: "Order placed successfully" });
    }
  );
});



/* ================= ORDER STATUS ================= */
app.get("/order-status/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT status FROM orders WHERE id=?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (result.length === 0)
        return res.status(404).json({ message: "Order not found" });

      res.json({ status: result[0].status });
    }
  );
});


/* ================= GET USER ORDERS ================= */
app.get("/orders/:email", (req, res) => {
  const email = req.params.email;

  const sql = `
    SELECT * FROM orders
    WHERE user_email = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [email], (err, orders) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    // Parse items JSON
    const formatted = orders.map(o => ({
  ...o,
  items: typeof o.items === "string" ? JSON.parse(o.items) : o.items
}));


    res.json(formatted);
  });
});



/* ================= USER DASHBOARD ================= */
app.get("/dashboard/:email", (req, res) => {
  const email = req.params.email;

  const sql = `
    SELECT 
      COUNT(*) AS totalOrders,
      IFNULL(SUM(total), 0) AS totalSpent,
      MAX(created_at) AS lastOrder
    FROM orders
    WHERE user_email = ?
  `;

  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(result[0]);
  });
});

/* ================= CANCEL ORDER ================= */
app.put("/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = "UPDATE orders SET status=? WHERE id=?";

  db.query(sql, [status, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Order updated" });
  });
});


/* ================= GET ORDERS (ADMIN) ================= */
app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders ORDER BY created_at DESC", (err, orders) => {
    if (err) return res.status(500).json(err);
    res.json(orders);
  });
});


/* REGISTER */
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

  db.query(sql, [name, email, password], (err) => {
    if (err) {
      return res.status(400).json({ message: "User already exists" });
    }
    res.json({ message: "Registration successful" });
  });
});


/* LOGIN */
app.post("/login", (req, res) => {
  const sql = "SELECT * FROM users WHERE email=? AND password=?";

  db.query(sql, [req.body.email, req.body.password], (err, result) => {
    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: { email: result[0].email, name: result[0].name }
    });
  });
});




/* GET ALL USERS (FOR ADMIN) */
app.get("/users", (req, res) => {
  db.query("SELECT id, name, email, created_at FROM users", (err, users) => {
    res.json(users);
  });
});
/* DELETE USER (ADMIN) */
app.delete("/users/:email", (req, res) => {
  const email = req.params.email;

  db.query(
    "DELETE FROM users WHERE email = ?",
    [email],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    }
  );
});

app.get("/products/suggestions", (req, res) => {
  const { home_section, category, exclude } = req.query;

  const sql = `
    SELECT id, name, price, image, home_section, category
    FROM products
    WHERE (home_section = ? OR category = ?)
      AND name != ?
    ORDER BY RAND()
    LIMIT 5
  `;

  db.query(
    sql,
    [home_section, category, exclude],
    (err, rows) => {
      if (err) {
        console.error("Suggestions DB error:", err);
        return res.status(500).json({ message: "Suggestion fetch failed" });
      }

      res.json(rows);
    }
  );
});



/* DELETE PRODUCT (ADMIN) */
app.delete("/admin/products/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM products WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    }
  );
});




app.listen(3000, () => {
    console.log("✅ Server running at http://localhost:3000");
});


