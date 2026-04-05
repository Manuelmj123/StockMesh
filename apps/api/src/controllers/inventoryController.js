const inventoryService = require("../services/inventoryService");

async function createInventoryRecord(req, res) {
  try {
    const isBulkRequest = Array.isArray(req.body);

    if (isBulkRequest) {
      const records = await inventoryService.createInventoryRecords(req.body);

      return res.status(201).json({
        success: true,
        count: records.length,
        data: records
      });
    }

    const record = await inventoryService.createInventoryRecord(req.body);

    return res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error("Failed to create inventory record", {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlMessage: error?.sqlMessage,
      sqlState: error?.sqlState,
      stack: error?.stack
    });

    return res.status(400).json({
      success: false,
      message: error?.message || error?.sqlMessage || "Failed to create inventory record",
      code: error?.code || null
    });
  }
}

async function getInventoryRecords(_req, res) {
  try {
    const records = await inventoryService.getInventoryRecords();

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error("Failed to retrieve inventory records", {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlMessage: error?.sqlMessage,
      sqlState: error?.sqlState,
      stack: error?.stack
    });

    return res.status(500).json({
      success: false,
      message: error?.message || error?.sqlMessage || "Failed to retrieve inventory records",
      code: error?.code || null
    });
  }
}

async function getInventoryRecordById(req, res) {
  try {
    const { id } = req.params;

    const record = await inventoryService.getInventoryRecordById(id);

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    const isNotFound = error?.message === "Inventory record not found";
    const statusCode = isNotFound ? 404 : 400;

    console.error("Failed to retrieve inventory record", {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlMessage: error?.sqlMessage,
      sqlState: error?.sqlState,
      stack: error?.stack
    });

    return res.status(statusCode).json({
      success: false,
      message: error?.message || error?.sqlMessage || "Failed to retrieve inventory record",
      code: error?.code || null
    });
  }
}

module.exports = {
  createInventoryRecord,
  getInventoryRecords,
  getInventoryRecordById
};