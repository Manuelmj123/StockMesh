const internalApiKey = process.env.REALTIME_HUB_INTERNAL_API_KEY || "stockmesh-dev-key";

const realtimeHubBaseUrls = [
  process.env.REALTIME_HUB_BASE_URL,
  "http://realtime-hub:5000",
  "http://api-stack-realtime-hub-1:5000"
]
  .filter(Boolean)
  .map((value) => value.replace(/\/$/, ""));

let mutedUntil = 0;
let lastHealthyBaseUrl = null;

function isDnsResolutionError(error) {
  return (
    error?.cause?.code === "ENOTFOUND" ||
    error?.code === "ENOTFOUND" ||
    String(error?.message || "").includes("ENOTFOUND")
  );
}

async function postToRealtimeHub(path, payload) {
  const now = Date.now();

  if (now < mutedUntil) {
    return false;
  }

  const orderedBaseUrls = lastHealthyBaseUrl
    ? [lastHealthyBaseUrl, ...realtimeHubBaseUrls.filter((url) => url !== lastHealthyBaseUrl)]
    : realtimeHubBaseUrls;

  let lastError = null;

  for (const baseUrl of orderedBaseUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
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

      lastHealthyBaseUrl = baseUrl;
      return true;
    } catch (error) {
      lastError = error;
    }
  }

  if (isDnsResolutionError(lastError)) {
    mutedUntil = Date.now() + 60000;
    console.warn("Realtime hub hostname could not be resolved. Muting hub push logs for 60 seconds.");
    return false;
  }

  throw lastError;
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