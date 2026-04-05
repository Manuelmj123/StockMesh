const inventoryService = require("../services/inventoryService");

async function createInventoryRecord(req, res) {
  try {
    const record = await inventoryService.createInventoryRecord(req.body);

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  createInventoryRecord
};