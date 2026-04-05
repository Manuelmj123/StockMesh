require("dotenv").config();

const app = require("./app");
const { startSymmetricMonitor } = require("./src/services/symmetric.service");

const port = Number(process.env.PORT || 3001);

app.listen(port, async () => {
  console.log(`StockMesh API listening on port ${port}`);

  try {
    await startSymmetricMonitor();
    console.log("Symmetric monitor started");
  } catch (error) {
    console.error("Failed to start Symmetric monitor", error);
  }
});