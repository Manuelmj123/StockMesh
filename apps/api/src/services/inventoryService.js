const storeInventoryDbPool = require("../config/storeInventoryDb");

function normalizeInventoryRecord(payload) {
  const sku = String(payload?.sku || "").trim();
  const itemName = String(payload?.itemName || "").trim();
  const quantityOnHand = Number(payload?.quantityOnHand);
  const unitPrice = Number(payload?.unitPrice);

  if (!sku) {
    throw new Error("sku is required");
  }

  if (!itemName) {
    throw new Error("itemName is required");
  }

  if (!Number.isFinite(quantityOnHand)) {
    throw new Error("quantityOnHand must be numeric");
  }

  if (!Number.isFinite(unitPrice)) {
    throw new Error("unitPrice must be numeric");
  }

  return {
    sku,
    itemName,
    quantityOnHand,
    unitPrice
  };
}

async function createInventoryRecord(payload) {
  const normalized = normalizeInventoryRecord(payload);

  const insertSql = `
    INSERT INTO inventory
    (
      sku,
      item_name,
      quantity_on_hand,
      unit_price
    )
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await storeInventoryDbPool.execute(insertSql, [
    normalized.sku,
    normalized.itemName,
    normalized.quantityOnHand,
    normalized.unitPrice
  ]);

  const [rows] = await storeInventoryDbPool.execute(
    `
      SELECT *
      FROM inventory
      WHERE inventory_id = ?
      LIMIT 1
    `,
    [result.insertId]
  );

  return rows[0];
}

async function createInventoryRecords(payload) {
  const items = Array.isArray(payload) ? payload : [payload];

  if (items.length === 0) {
    throw new Error("At least one inventory record is required");
  }

  const normalizedItems = items.map(normalizeInventoryRecord);

  const connection = await storeInventoryDbPool.getConnection();

  try {
    await connection.beginTransaction();

    const insertSql = `
      INSERT INTO inventory
      (
        sku,
        item_name,
        quantity_on_hand,
        unit_price
      )
      VALUES (?, ?, ?, ?)
    `;

    const insertedIds = [];

    for (const item of normalizedItems) {
      const [result] = await connection.execute(insertSql, [
        item.sku,
        item.itemName,
        item.quantityOnHand,
        item.unitPrice
      ]);

      insertedIds.push(result.insertId);
    }

    await connection.commit();

    const placeholders = insertedIds.map(() => "?").join(", ");

    const [rows] = await storeInventoryDbPool.execute(
      `
        SELECT *
        FROM inventory
        WHERE inventory_id IN (${placeholders})
        ORDER BY inventory_id ASC
      `,
      insertedIds
    );

    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getInventoryRecords() {
  const [rows] = await storeInventoryDbPool.execute(`
    SELECT *
    FROM inventory
    ORDER BY inventory_id DESC
  `);

  return rows;
}

async function getInventoryRecordById(inventoryId) {
  const normalizedInventoryId = Number(inventoryId);

  if (!Number.isInteger(normalizedInventoryId) || normalizedInventoryId <= 0) {
    throw new Error("inventoryId must be a valid numeric id");
  }

  const [rows] = await storeInventoryDbPool.execute(
    `
      SELECT *
      FROM inventory
      WHERE inventory_id = ?
      LIMIT 1
    `,
    [normalizedInventoryId]
  );

  if (rows.length === 0) {
    throw new Error("Inventory record not found");
  }

  return rows[0];
}

module.exports = {
  createInventoryRecord,
  createInventoryRecords,
  getInventoryRecords,
  getInventoryRecordById
};