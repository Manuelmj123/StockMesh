const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function getArg(name, fallback = null) {
  const prefix = `--${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function requireArg(name) {
  const value = getArg(name);
  if (!value) {
    throw new Error(`Missing required argument: --${name}=value`);
  }
  return value;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function createStoreEngineContents({
  engineName,
  dbHost,
  dbPort,
  dbName,
  dbUser,
  dbPassword,
  groupId,
  externalId,
  centralHost,
  centralPort
}) {
  return `engine.name=${engineName}

db.driver=com.mysql.cj.jdbc.Driver
db.url=jdbc:mysql://${dbHost}:${dbPort}/${dbName}
db.user=${dbUser}
db.password=${dbPassword}

group.id=${groupId}
external.id=${externalId}

registration.url=http://${centralHost}:${centralPort}/sync/central-000
sync.url=http://${engineName}:31415/sync/${engineName}

job.routing.period.time.ms=5000
job.push.period.time.ms=5000
job.pull.period.time.ms=5000
`;
}

function createStoreComposeService({
  serviceName,
  mysqlServiceName,
  mysqlPort,
  symmetricPort,
  dbName
}) {
  return `${serviceName}:
    image: jumpmind/symmetricds
    ports:
      - "${symmetricPort}:31415"
    volumes:
      - ../../symmetricds/${serviceName}/engines:/opt/symmetric-ds/engines
      - ../../symmetricds/${serviceName}/logs:/opt/symmetric-ds/logs
    depends_on:
      - ${mysqlServiceName}

  ${mysqlServiceName}:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ${dbName}
    ports:
      - "${mysqlPort}:3306"
    volumes:
      - ${mysqlServiceName}-data:/var/lib/mysql
`;
}

async function createDatabase({
  host,
  port,
  user,
  password,
  database
}) {
  const connection = await mysql.createConnection({
    host,
    port: Number(port),
    user,
    password,
    multipleStatements: true
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();
}

async function registerNodeInCentral({
  host,
  port,
  user,
  password,
  database,
  nodeId,
  externalId,
  nodePassword,
  nodeGroupId
}) {
  const connection = await mysql.createConnection({
    host,
    port: Number(port),
    user,
    password,
    database,
    multipleStatements: true
  });

  await connection.query(
    `
    INSERT INTO sym_node (node_id, node_group_id, external_id, sync_enabled)
    VALUES (?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
      node_group_id = VALUES(node_group_id),
      external_id = VALUES(external_id),
      sync_enabled = VALUES(sync_enabled);
    `,
    [nodeId, nodeGroupId, externalId]
  );

  await connection.query(
    `
    INSERT INTO sym_node_security (node_id, node_password, registration_enabled, initial_load_enabled)
    VALUES (?, ?, 1, 1)
    ON DUPLICATE KEY UPDATE
      node_password = VALUES(node_password),
      registration_enabled = VALUES(registration_enabled),
      initial_load_enabled = VALUES(initial_load_enabled);
    `,
    [nodeId, nodePassword]
  );

  await connection.end();
}

function getRepoRoot() {
  return path.resolve(__dirname, "../../../../");
}

async function main() {
  const storeCode = requireArg("storeCode");
  const nodeId = requireArg("nodeId");
  const mysqlPort = requireArg("mysqlPort");
  const symmetricPort = requireArg("symmetricPort");

  const storeName = getArg("storeName", `store-${storeCode}`);
  const dbName = getArg("dbName", `stockmesh_store_${storeCode}`);
  const dbUser = getArg("dbUser", "root");
  const dbPassword = getArg("dbPassword", "root");
  const nodePassword = getArg("nodePassword", "password");
  const nodeGroupId = getArg("nodeGroupId", "store");
  const centralHost = getArg("centralHost", "symmetricds-central");
  const centralPort = getArg("centralPort", "31415");

  const centralMysqlHost = getArg("centralMysqlHost", "127.0.0.1");
  const centralMysqlPort = getArg("centralMysqlPort", "3307");
  const centralMysqlUser = getArg("centralMysqlUser", "root");
  const centralMysqlPassword = getArg("centralMysqlPassword", "root");
  const centralMysqlDatabase = getArg("centralMysqlDatabase", "stockmesh_central");

  const engineName = `store-${storeCode}`;
  const serviceName = `symmetricds-store-${storeCode}`;
  const mysqlServiceName = `mysql-store-${storeCode}`;

  const repoRoot = getRepoRoot();
  const symmetricBasePath = path.join(repoRoot, "infrastructure", "symmetricds", `store-${storeCode}`);
  const enginesPath = path.join(symmetricBasePath, "engines");
  const logsPath = path.join(symmetricBasePath, "logs");
  const engineFilePath = path.join(enginesPath, `${engineName}.properties`);
  const composeSnippetPath = path.join(
    repoRoot,
    "infrastructure",
    "docker",
    "api-stack",
    `store-${storeCode}.compose.snippet.yml`
  );

  ensureDir(enginesPath);
  ensureDir(logsPath);

  const engineContents = createStoreEngineContents({
    engineName,
    dbHost: mysqlServiceName,
    dbPort: "3306",
    dbName,
    dbUser,
    dbPassword,
    groupId: nodeGroupId,
    externalId: nodeId,
    centralHost,
    centralPort
  });

  writeFile(engineFilePath, engineContents);

  const composeSnippet = createStoreComposeService({
    serviceName,
    mysqlServiceName,
    mysqlPort,
    symmetricPort,
    dbName
  });

  writeFile(composeSnippetPath, composeSnippet);

  await createDatabase({
    host: centralMysqlHost,
    port: centralMysqlPort,
    user: centralMysqlUser,
    password: centralMysqlPassword,
    database: dbName
  });

  await registerNodeInCentral({
    host: centralMysqlHost,
    port: centralMysqlPort,
    user: centralMysqlUser,
    password: centralMysqlPassword,
    database: centralMysqlDatabase,
    nodeId,
    externalId: nodeId,
    nodePassword,
    nodeGroupId
  });

  console.log("");
  console.log("Store node scaffold created successfully.");
  console.log("");
  console.log(`Engine file: ${engineFilePath}`);
  console.log(`Compose snippet: ${composeSnippetPath}`);
  console.log("");
  console.log("Next steps:");
  console.log(`1. Merge ${path.basename(composeSnippetPath)} into infrastructure/docker/api-stack/docker-compose.yml`);
  console.log("2. Run docker compose down -v");
  console.log("3. Run docker compose up --build");
  console.log("");
  console.log("Example command:");
  console.log(
    "node src/scripts/registerStoreNode.js --storeCode=002 --nodeId=002 --mysqlPort=3310 --symmetricPort=31417"
  );
}

main().catch(error => {
  console.error("");
  console.error("Failed to create store node scaffold.");
  console.error(error.message);
  process.exit(1);
});