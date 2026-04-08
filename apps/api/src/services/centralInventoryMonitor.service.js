const centralInventoryDbPool = require("../config/centralInventoryDb");
const { publishInventoryUpdate } = require("./rabbitPublisher.service");

const pollIntervalMs = Number(process.env.CENTRAL_INVENTORY_POLL_INTERVAL_MS || 2000);

let intervalHandle = null;
let isPolling = false;
let cursor = {
  updatedAt: "1970-01-01 00:00:00",
  inventoryId: 0
};

async function loadChangedRows() {
  const [rows] = await centralInventoryDbPool.execute(
    `
      SELECT
        inventory_id,
        sku,
        item_name,
        quantity_on_hand,
        unit_price,
        updated_at
      FROM inventory
      WHERE
        updated_at > ?
        OR (updated_at = ? AND inventory_id > ?)
      ORDER BY updated_at ASC, inventory_id ASC
      LIMIT 500
    `,
    [cursor.updatedAt, cursor.updatedAt, cursor.inventoryId]
  );

  return rows;
}

async function publishChangedRows() {
  const rows = await loadChangedRows();

  for (const row of rows) {
    await publishInventoryUpdate({
      inventory_id: row.inventory_id,
      sku: row.sku,
      item_name: row.item_name,
      quantity_on_hand: row.quantity_on_hand,
      unit_price: row.unit_price,
      updated_at: row.updated_at
    });

    const updatedAt =
      row.updated_at instanceof Date
        ? row.updated_at.toISOString().slice(0, 19).replace("T", " ")
        : String(row.updated_at);

    cursor = {
      updatedAt,
      inventoryId: Number(row.inventory_id)
    };
  }
}

async function pollCentralInventory() {
  if (isPolling) {
    return;
  }

  isPolling = true;

  try {
    await publishChangedRows();
  } catch (error) {
    console.error("Central inventory monitor error", error);
  } finally {
    isPolling = false;
  }
}

async function startCentralInventoryMonitor() {
  if (intervalHandle) {
    return;
  }

  await pollCentralInventory();

  intervalHandle = setInterval(async () => {
    await pollCentralInventory();
  }, pollIntervalMs);
}

module.exports = {
  startCentralInventoryMonitor
};