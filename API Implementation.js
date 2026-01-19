const express = require("express");
const router = express.Router();
const { Product, Inventory, Warehouse, Supplier, sequelize } = require("../models");

//Example thresholds (assumption)
const LOW_STOCK_THRESHOLD = {
  electronics: 20,
  grocery: 50,
  default: 10
};

router.get("/api/companies/:companyId/alerts/low-stock", async (req, res) => {
  const { companyId } = req.params;

  try {
    // Fetch low-stock inventory with product & warehouse
    const lowStockItems = await Inventory.findAll({
      include: [
        {
          model: Product,
          where: { company_id: companyId }
        },
        {
          model: Warehouse
        }
      ]
    });

    const alerts = [];

    for (let item of lowStockItems) {
      const product = item.Product;
      const threshold =
        LOW_STOCK_THRESHOLD[product.product_type] ||
        LOW_STOCK_THRESHOLD.default;

      //Check low stock condition
      if (item.quantity < threshold) {

        //Fetch supplier info (simplified)
        const supplier = await Supplier.findOne({
          include: {
            model: Product,
            where: { id: product.id }
          }
        });

        alerts.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          warehouse_id: item.warehouse_id,
          warehouse_name: item.Warehouse.name,
          current_stock: item.quantity,
          threshold,
          days_until_stockout: Math.floor(item.quantity / 2), // assumption
          supplier: supplier
            ? {
                id: supplier.id,
                name: supplier.name,
                contact_email: supplier.contact_email
              }
            : null
        });
      }
    }

    return res.status(200).json({
      alerts,
      total_alerts: alerts.length
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

module.exports = router;
