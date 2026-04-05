const mysql = require("mysql2/promise");
const { pushNodeSnapshot, pushActivity } = require("./realtimeHub.service");
const { getNodeContainerState } = require("./dockerNode.service");

const pool = mysql.createPool({
  host: process.env.SYMMETRIC_DB_HOST || "localhost",
  port: Number(process.env.SYMMETRIC_DB_PORT || 3306),
  user: process.env.SYMMETRIC_DB_USER || "root",
  password: process.env.SYMMETRIC_DB_PASSWORD || "",
  database: process.env.SYMMETRIC_DB_NAME || "symmetricds",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const pollIntervalMs = Number(process.env.SYMMETRIC_POLL_INTERVAL_MS || 5000);

let lastActivitySignature = "";

function buildNodeStatus({ isRunning, pendingBatches }) {
  if (!isRunning) return "Offline";
  if ((pendingBatches || 0) > 0) return "Warning";
  return "Online";
}

function inferRole(nodeId, groupId, externalId) {
  const value = `${nodeId} ${groupId || ""} ${externalId || ""}`.toLowerCase();

  if (
    nodeId === "000" ||
    value.includes("central") ||
    value.includes("corp") ||
    value.includes("hub")
  ) {
    return "Hub";
  }

  return "Store";
}

function formatDate(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

async function runQuery(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function safeQuery(sql, params = [], label = "query") {
  try {
    return await runQuery(sql, params);
  } catch (error) {
    console.error(`[symmetric] ${label} failed:`, error.message);
    return [];
  }
}

function buildLatestHostMap(rows) {
  const map = new Map();

  for (const row of rows) {
    const existing = map.get(row.nodeId);

    if (!existing) {
      map.set(row.nodeId, row);
      continue;
    }

    const existingTime = existing.heartbeatTime ? new Date(existing.heartbeatTime).getTime() : 0;
    const incomingTime = row.heartbeatTime ? new Date(row.heartbeatTime).getTime() : 0;

    if (incomingTime >= existingTime) {
      map.set(row.nodeId, row);
    }
  }

  return map;
}

async function fetchNodeSnapshot() {
  const nodes = await safeQuery(
    `
    SELECT
      node_id AS nodeId,
      node_group_id AS groupId,
      external_id AS externalId
    FROM sym_node
    ORDER BY node_id
    `,
    [],
    "fetch sym_node"
  );

  const nodeSecurityRows = await safeQuery(
    `
    SELECT
      node_id AS nodeId,
      node_password AS securityToken,
      registration_enabled AS registrationEnabled,
      registration_time AS registrationTime
    FROM sym_node_security
    `,
    [],
    "fetch sym_node_security"
  );

  const nodeHostRows = await safeQuery(
    `
    SELECT
      node_id AS nodeId,
      host_name AS hostName,
      ip_address AS ipAddress,
      heartbeat_time AS heartbeatTime
    FROM sym_node_host
    ORDER BY heartbeat_time DESC
    `,
    [],
    "fetch sym_node_host"
  );

  const pendingOutgoingRows = await safeQuery(
    `
    SELECT
      node_id AS nodeId,
      COUNT(*) AS pendingOutgoing
    FROM sym_outgoing_batch
    WHERE status NOT IN ('OK', 'IG')
    GROUP BY node_id
    `,
    [],
    "fetch sym_outgoing_batch"
  );

  const pendingIncomingRows = await safeQuery(
    `
    SELECT
      node_id AS nodeId,
      COUNT(*) AS pendingIncoming
    FROM sym_incoming_batch
    WHERE status NOT IN ('OK', 'IG')
    GROUP BY node_id
    `,
    [],
    "fetch sym_incoming_batch"
  );

  const pullLatencyRows = await safeQuery(
    `
    SELECT
      node_id AS nodeId,
      ROUND(AVG(TIMESTAMPDIFF(MICROSECOND, create_time, last_update_time) / 1000), 0) AS pullMs
    FROM sym_incoming_batch
    WHERE create_time >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 MINUTE)
      AND last_update_time IS NOT NULL
    GROUP BY node_id
    `,
    [],
    "fetch incoming latency"
  );

  const pushLatencyRows = await safeQuery(
    `
    SELECT
      node_id AS nodeId,
      ROUND(AVG(TIMESTAMPDIFF(MICROSECOND, create_time, last_update_time) / 1000), 0) AS pushMs
    FROM sym_outgoing_batch
    WHERE create_time >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 MINUTE)
      AND last_update_time IS NOT NULL
    GROUP BY node_id
    `,
    [],
    "fetch outgoing latency"
  );

  const securityMap = new Map(nodeSecurityRows.map((row) => [row.nodeId, row]));
  const hostMap = buildLatestHostMap(nodeHostRows);
  const pendingOutgoingMap = new Map(
    pendingOutgoingRows.map((row) => [row.nodeId, Number(row.pendingOutgoing || 0)])
  );
  const pendingIncomingMap = new Map(
    pendingIncomingRows.map((row) => [row.nodeId, Number(row.pendingIncoming || 0)])
  );
  const pullLatencyMap = new Map(
    pullLatencyRows.map((row) => [row.nodeId, row.pullMs === null ? null : Number(row.pullMs)])
  );
  const pushLatencyMap = new Map(
    pushLatencyRows.map((row) => [row.nodeId, row.pushMs === null ? null : Number(row.pushMs)])
  );

  const containerStates = await Promise.all(
    nodes.map((node) => getNodeContainerState(node.nodeId))
  );

  const containerStateMap = new Map(
    nodes.map((node, index) => [node.nodeId, containerStates[index]])
  );

  return nodes.map((node) => {
    const security = securityMap.get(node.nodeId) || {};
    const host = hostMap.get(node.nodeId) || {};
    const containerState = containerStateMap.get(node.nodeId) || {
      containerName: null,
      exists: false,
      isRunning: false,
      status: "unknown"
    };

    const pendingBatches =
      (pendingOutgoingMap.get(node.nodeId) || 0) +
      (pendingIncomingMap.get(node.nodeId) || 0);

    const registrationStatus =
      security.registrationEnabled || security.registrationTime ? "Registered" : "Pending";

    let notes = "Heartbeat is stale or unavailable.";

    if (!containerState.exists) {
      notes = "Mapped container was not found.";
    } else if (!containerState.isRunning) {
      notes = "Container is stopped.";
    } else if (pendingBatches > 0) {
      notes = "Connected with replication work pending.";
    } else {
      notes = "Connected and healthy.";
    }

    return {
      nodeId: node.nodeId,
      host: host.hostName || host.ipAddress || node.externalId || "Unknown Host",
      groupId: node.groupId || "unknown",
      registrationStatus,
      securityToken: security.securityToken || "N/A",
      lastSeen: formatDate(host.heartbeatTime),
      pendingBatches,
      pullMs: pullLatencyMap.get(node.nodeId) ?? null,
      pushMs: pushLatencyMap.get(node.nodeId) ?? null,
      status: buildNodeStatus({
        isRunning: containerState.isRunning,
        pendingBatches
      }),
      notes,
      isConnected: containerState.isRunning,
      role: inferRole(node.nodeId, node.groupId, node.externalId),
      externalId: node.externalId || null,
      containerName: containerState.containerName,
      containerStatus: containerState.status
    };
  });
}

async function fetchRecentActivity(take = 20) {
  const outgoing = await safeQuery(
    `
    SELECT
      CONCAT('out-', CAST(batch_id AS CHAR), '-', node_id) AS id,
      node_id AS nodeId,
      batch_id AS batchId,
      channel_id AS channelId,
      status,
      error_flag AS errorFlag,
      create_time AS createdAt,
      last_update_time AS updatedAt
    FROM sym_outgoing_batch
    ORDER BY COALESCE(last_update_time, create_time) DESC
    LIMIT ?
    `,
    [take],
    "fetch outgoing activity"
  );

  const incoming = await safeQuery(
    `
    SELECT
      CONCAT('in-', CAST(batch_id AS CHAR), '-', node_id) AS id,
      node_id AS nodeId,
      batch_id AS batchId,
      channel_id AS channelId,
      status,
      error_flag AS errorFlag,
      create_time AS createdAt,
      last_update_time AS updatedAt
    FROM sym_incoming_batch
    ORDER BY COALESCE(last_update_time, create_time) DESC
    LIMIT ?
    `,
    [take],
    "fetch incoming activity"
  );

  const items = [
    ...outgoing.map((row) => ({
      id: row.id,
      nodeId: row.nodeId,
      type: row.errorFlag ? "Outgoing Batch Error" : "Outgoing Batch",
      message: `Outgoing batch ${row.batchId} on channel ${row.channelId || "default"} is ${row.status}.`,
      createdAt: formatDate(row.updatedAt || row.createdAt),
      direction: "Push",
      batchId: String(row.batchId),
      recordsAffected: null
    })),
    ...incoming.map((row) => ({
      id: row.id,
      nodeId: row.nodeId,
      type: row.errorFlag ? "Incoming Batch Error" : "Incoming Batch",
      message: `Incoming batch ${row.batchId} on channel ${row.channelId || "default"} is ${row.status}.`,
      createdAt: formatDate(row.updatedAt || row.createdAt),
      direction: "Pull",
      batchId: String(row.batchId),
      recordsAffected: null
    }))
  ]
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, take);

  return items;
}

async function publishCurrentSnapshot() {
  const nodes = await fetchNodeSnapshot();
  const activity = await fetchRecentActivity(20);

  await pushNodeSnapshot(nodes);

  const signature = JSON.stringify(activity.map((item) => item.id));
  if (signature !== lastActivitySignature) {
    lastActivitySignature = signature;
    await pushActivity(activity);
  }

  return { nodes, activity };
}

async function refreshSymmetricMonitor() {
  return publishCurrentSnapshot();
}

async function startSymmetricMonitor() {
  await publishCurrentSnapshot();

  setInterval(async () => {
    try {
      await publishCurrentSnapshot();
    } catch (error) {
      console.error("Symmetric polling cycle failed", error);
    }
  }, pollIntervalMs);
}

module.exports = {
  fetchNodeSnapshot,
  fetchRecentActivity,
  refreshSymmetricMonitor,
  startSymmetricMonitor
};