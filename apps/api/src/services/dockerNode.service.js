const fs = require("fs");
const Docker = require("dockerode");

const docker = fs.existsSync("/var/run/docker.sock")
  ? new Docker({ socketPath: "/var/run/docker.sock" })
  : null;

function getContainerMap() {
  try {
    return JSON.parse(
      process.env.SYMMETRIC_NODE_CONTAINERS ||
        '{"000":"api-stack-symmetricds-central-1","001":"api-stack-symmetricds-store-001-1"}'
    );
  } catch (error) {
    console.error("Failed to parse SYMMETRIC_NODE_CONTAINERS", error);
    return {
      "000": "api-stack-symmetricds-central-1",
      "001": "api-stack-symmetricds-store-001-1"
    };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function inspectContainerByName(containerName) {
  if (!docker) {
    throw new Error("Docker socket is not available inside the API container");
  }

  const container = docker.getContainer(containerName);
  const inspect = await container.inspect();

  return {
    container,
    inspect
  };
}

function mapInspectToState(containerName, inspect) {
  return {
    containerName,
    exists: true,
    isRunning: Boolean(inspect?.State?.Running),
    status: inspect?.State?.Status || "unknown",
    exitCode: inspect?.State?.ExitCode ?? null,
    startedAt: inspect?.State?.StartedAt || null,
    finishedAt: inspect?.State?.FinishedAt || null,
    error: inspect?.State?.Error || null
  };
}

async function getNodeContainerState(nodeId) {
  const containerMap = getContainerMap();
  const containerName = containerMap[String(nodeId)];

  if (!containerName) {
    return {
      containerName: null,
      exists: false,
      isRunning: false,
      status: "unmapped",
      exitCode: null,
      startedAt: null,
      finishedAt: null,
      error: null
    };
  }

  if (!docker) {
    return {
      containerName,
      exists: false,
      isRunning: false,
      status: "docker-unavailable",
      exitCode: null,
      startedAt: null,
      finishedAt: null,
      error: "Docker socket is not available inside the API container"
    };
  }

  try {
    const { inspect } = await inspectContainerByName(containerName);
    return mapInspectToState(containerName, inspect);
  } catch (error) {
    return {
      containerName,
      exists: false,
      isRunning: false,
      status: "not-found",
      exitCode: null,
      startedAt: null,
      finishedAt: null,
      error: error?.reason || error?.message || "Container not found"
    };
  }
}

async function waitForContainerRunning(containerName, options = {}) {
  const {
    maxAttempts = 12,
    delayMs = 2000
  } = options;

  let lastState = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const { inspect } = await inspectContainerByName(containerName);
      lastState = mapInspectToState(containerName, inspect);

      if (lastState.isRunning) {
        return lastState;
      }
    } catch (error) {
      lastState = {
        containerName,
        exists: false,
        isRunning: false,
        status: "not-found",
        exitCode: null,
        startedAt: null,
        finishedAt: null,
        error: error?.reason || error?.message || "Container not found"
      };
    }

    await sleep(delayMs);
  }

  return lastState;
}

async function restartNodeContainer(nodeId) {
  const containerMap = getContainerMap();
  const normalizedNodeId = String(nodeId);
  const containerName = containerMap[normalizedNodeId];

  if (!containerName) {
    throw new Error(`No container mapping found for node ${normalizedNodeId}`);
  }

  if (!docker) {
    throw new Error("Docker socket is not available inside the API container");
  }

  const before = await getNodeContainerState(normalizedNodeId);

  if (!before.exists) {
    throw new Error(`Container ${containerName} was not found for node ${normalizedNodeId}`);
  }

  const container = docker.getContainer(containerName);

  try {
    await container.restart({ t: 10 });
  } catch (error) {
    throw new Error(
      `Failed to restart container ${containerName}: ${error?.reason || error?.message || "Unknown Docker error"}`
    );
  }

  const after = await waitForContainerRunning(containerName, {
    maxAttempts: 15,
    delayMs: 2000
  });

  return {
    nodeId: normalizedNodeId,
    containerName,
    before,
    after,
    restarted: Boolean(after?.isRunning)
  };
}

module.exports = {
  getNodeContainerState,
  restartNodeContainer
};