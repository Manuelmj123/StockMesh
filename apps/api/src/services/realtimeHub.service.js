const realtimeHubBaseUrl = (process.env.REALTIME_HUB_BASE_URL || "http://realtime-hub:5000").replace(/\/$/, "");
const internalApiKey = process.env.REALTIME_HUB_INTERNAL_API_KEY || "stockmesh-dev-key";

async function postToRealtimeHub(path, payload) {
  const response = await fetch(`${realtimeHubBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Api-Key": internalApiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Realtime hub call failed: ${response.status} ${text}`);
  }
}

async function pushNodeSnapshot(nodes) {
  try {
    await postToRealtimeHub("/internal/symmetric/nodes/snapshot", nodes);
  } catch (error) {
    console.error("Failed to push node snapshot to realtime hub", error);
  }
}

async function pushActivity(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  try {
    await postToRealtimeHub("/internal/symmetric/activity", items);
  } catch (error) {
    console.error("Failed to push activity to realtime hub", error);
  }
}

module.exports = {
  pushNodeSnapshot,
  pushActivity
};