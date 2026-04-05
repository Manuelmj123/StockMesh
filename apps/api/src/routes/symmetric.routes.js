const express = require("express");
const {
  getSymmetricNodes,
  getSymmetricActivity,
  refreshNodes,
  restartNode
} = require("../controllers/symmetric.controller");

const router = express.Router();

router.get("/nodes", getSymmetricNodes);
router.get("/activity", getSymmetricActivity);
router.post("/nodes/refresh", refreshNodes);
router.post("/nodes/:nodeId/restart", restartNode);

module.exports = router;