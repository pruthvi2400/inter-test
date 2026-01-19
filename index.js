const express = require("express");
const router = express.Router();
const { Product, Inventory, sequelize } = require("../models");

router.post("/api/products", async (req, res) => {
  const {
    name,
    sku,
    price,
    warehouse_id,
    initial_quantity = 0
  } = req.body;

  // Input validation
  if (!name || !sku || !price || !warehouse_id) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  // Use transaction to avoid partial writes
  const transaction = await sequelize.transaction();

  try {
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ where: { sku } });

    if (existingProduct) {
      await transaction.rollback();
      return res.status(409).json({
        message: "SKU already exists"
      });
    }

    // Create product
    const product = await Product.create(
      {
        name,
        sku,
        price: parseFloat(price)
      },
      { transaction }
    );

    // Create inventory entry
    await Inventory.create(
      {
        product_id: product.id,
        warehouse_id,
        quantity: initial_quantity
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    return res.status(201).json({
      message: "Product created successfully",
      product_id: product.id
    });

  } catch (error) {
    // Rollback on error
    await transaction.rollback();

    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

module.exports = router;

