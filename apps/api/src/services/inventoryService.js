const storeInventoryDbPool = require("../config/storeInventoryDb");

async function createInventoryRecord(payload) {
  const sku = String(payload.sku || "").trim();
  const itemName = String(payload.itemName || "").trim();
  const quantityOnHand = Number(payload.quantityOnHand);
  const unitPrice = Number(payload.unitPrice);

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
    sku,
    itemName,
    quantityOnHand,
    unitPrice
  ]);

  const [rows] = await storeInventoryDbPool.execute(
    `
    SELECT *
    FROM inventory
    WHERE inventory_id = ?
    `,
    [result.insertId]
  );

  return rows[0];
}

module.exports = {
  createInventoryRecord
};