const {
    fetchNodeSnapshot,
    fetchRecentActivity,
    refreshSymmetricMonitor
  } = require("../services/symmetric.service");
  const {
    restartNodeContainer,
    getNodeContainerState
  } = require("../services/dockerNode.service");
  
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  async function getSymmetricNodes(_req, res) {
    try {
      const nodes = await fetchNodeSnapshot();
      res.json(nodes);
    } catch (error) {
      console.error("Failed to load symmetric nodes", error);
      res.status(500).json({
        message: "Failed to load symmetric nodes"
      });
    }
  }
  
  async function getSymmetricActivity(req, res) {
    try {
      const take = Number(req.query.take || 20);
      const items = await fetchRecentActivity(Math.min(Math.max(take, 1), 100));
      res.json(items);
    } catch (error) {
      console.error("Failed to load symmetric activity", error);
      res.status(500).json({
        message: "Failed to load symmetric activity"
      });
    }
  }
  
  async function refreshNodes(_req, res) {
    try {
      const result = await refreshSymmetricMonitor();
      res.json({
        ok: true,
        nodes: result.nodes
      });
    } catch (error) {
      console.error("Failed to refresh symmetric monitor", error);
      res.status(500).json({
        message: "Failed to refresh symmetric monitor"
      });
    }
  }
  
  async function restartNode(req, res) {
    try {
      const { nodeId } = req.params;
  
      const restartResult = await restartNodeContainer(nodeId);
  
      let refreshResult = null;
      let attempts = 0;
      let latestContainerState = null;
  
      while (attempts < 8) {
        await sleep(2500);
  
        latestContainerState = await getNodeContainerState(nodeId);
        refreshResult = await refreshSymmetricMonitor();
  
        const refreshedNode = Array.isArray(refreshResult?.nodes)
          ? refreshResult.nodes.find((node) => String(node.nodeId) === String(nodeId))
          : null;
  
        const containerStatus = (refreshedNode?.containerStatus || latestContainerState?.status || "").toLowerCase();
        const nodeStatus = (refreshedNode?.status || "").toLowerCase();
  
        if (containerStatus === "running" && (nodeStatus === "online" || nodeStatus === "warning")) {
          break;
        }
  
        attempts += 1;
      }
  
      res.json({
        ok: true,
        restarted: restartResult,
        containerState: latestContainerState,
        nodes: refreshResult?.nodes || []
      });
    } catch (error) {
      console.error("Failed to restart node", error);
      res.status(500).json({
        message: error.message || "Failed to restart node"
      });
    }
  }
  
  module.exports = {
    getSymmetricNodes,
    getSymmetricActivity,
    refreshNodes,
    restartNode
  };