const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());

// MongoDB connection

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Product schema

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  description: { type: String }
});

// Inventory schema

const inventorySchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  warehouse_id: { type: String, required: true },
  quantity: { type: Number, required: true }
});

const Product = mongoose.model("Product", productSchema);
const Inventory = mongoose.model("Inventory", inventorySchema);

// API: Create product + inventory

app.post("/api/products", async (req, res) => {
  try {
    const data = req.body;

    // SKU uniqueness check

    const existing = await Product.findOne({ sku: data.sku });
    if (existing) {
      return res.status(409).json({ message: "SKU already exists" });
    }

    // Create product

    const product = await Product.create({
      name: data.name,
      sku: data.sku,
      price: data.price,
      description: data.description
    });

    // Create inventory (supports multiple warehouses)

    await Inventory.create({
      product_id: product._id,
      warehouse_id: data.warehouse_id,
      quantity: data.initial_quantity
    });

    res.status(201).json({
      message: "Product created",
      product_id: product._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
