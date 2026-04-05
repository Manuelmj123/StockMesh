const express = require("express");
const cors = require("cors");

const symmetricRoutes = require("./src/routes/symmetric.routes");

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "stockmesh-api" });
});

app.use("/api/symmetric", symmetricRoutes);

module.exports = app;