const express = require("express");
const router = express.Router();

const inventoryController = require("../controllers/inventoryController");

// Retrieve all inventory records
router.get("/", inventoryController.getInventoryRecords);

// Retrieve a single inventory record by id
router.get("/:id", inventoryController.getInventoryRecordById);

// Create inventory record (single or bulk)
router.post("/", inventoryController.createInventoryRecord);

module.exports = router;