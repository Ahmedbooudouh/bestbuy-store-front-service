// src/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// CORS + JSON
app.use(cors());
app.use(express.json());

// Statics (HTML, JS, CSS, images…)
app.use(express.static(path.join(__dirname, "..", "public")));

// Internal API targets 
const PRODUCT_API_BASE =
  process.env.PRODUCT_API_BASE || "http://product-service:4000/api/products";
const ORDER_API_BASE =
  process.env.ORDER_API_BASE || "http://order-service:4001/api/orders";

// ---- Proxy /api/products ----
app.get("/api/products", async (req, res) => {
  try {
    const upstreamRes = await fetch(PRODUCT_API_BASE);
    const data = await upstreamRes.json();
    res.status(upstreamRes.status).json(data);
  } catch (err) {
    console.error("Error proxying /api/products:", err);
    res.status(500).json({ message: "Error retrieving products" });
  }
});

// ---- Proxy /api/orders (POST) ----
app.post("/api/orders", async (req, res) => {
  try {
    const upstreamRes = await fetch(ORDER_API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    res.status(upstreamRes.status).send(data);
  } catch (err) {
    console.error("Error proxying /api/orders:", err);
    res.status(500).json({ message: "Error sending order" });
  }
});

// ---- Boot du serveur ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`store-front is running on port ${PORT}`);
  console.log(`Proxying products from: ${PRODUCT_API_BASE}`);
  console.log(`Proxying orders   from: ${ORDER_API_BASE}`);
});
