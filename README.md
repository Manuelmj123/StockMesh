# StockMesh

StockMesh is a distributed inventory tracking system designed for franchise-style or multi-location businesses.

The goal of this repository is to keep everything organized from day one while letting each part of the system run independently during development.

## What this project will include

StockMesh is being set up with these main parts:

- **React Native tablet app** for local inventory updates on store devices
- **Node.js / Express API** for processing events and backend workflows
- **RabbitMQ** for event-driven messaging
- **SymmetricDS** for syncing local database changes to a central node
- **React dashboard website** for the central web UI
- **ASP.NET Core SignalR hub** for real-time dashboard updates
- **MySQL** databases for local and central data storage

At this stage, the repo is only being **initialized and organized**. Features, tables, sync rules, and dashboards will be built later.

---

## Repository structure

```text
StockMesh/
  apps/
    tablet/
    api/
    dashboard-web/
    realtime-hub/
  infrastructure/
    docker/
      api-stack/
      dashboard-stack/
  shared/
```

### Folder breakdown

#### `apps/tablet`
React Native tablet application.

This is the store-facing app that will eventually let employees update inventory locally on tablet devices.

Suggested internal structure later:

```text
src/
  api/
  application/
  components/
  hooks/
  navigation/
  screens/
  services/
  store/
  types/
  utils/
```

#### `apps/api`
Node.js / Express backend.

This will eventually consume RabbitMQ messages, run backend workflows, and save data into a central database.

Suggested internal structure:

```text
src/
  config/
  controllers/
  consumers/
  lib/
  routes/
  services/
  index.js
```

#### `apps/dashboard-web`
React web app for the dashboard UI.

This will eventually show inventory activity across all locations.

Suggested internal structure later:

```text
src/
  api/
  components/
  features/
  hooks/
  layouts/
  pages/
  services/
  store/
  utils/
```

#### `apps/realtime-hub`
ASP.NET Core app for SignalR.

This will eventually host the SignalR hub that pushes real-time updates to the web dashboard.

#### `infrastructure/docker/api-stack`
Docker setup for the backend/event-processing side.

This stack is intended to run:

- Node.js API
- RabbitMQ
- SymmetricDS

#### `infrastructure/docker/dashboard-stack`
Docker setup for the dashboard side.

This stack is intended to run:

- React dashboard web app
- MySQL database for dashboard-side development if needed
- ASP.NET Core SignalR hub

#### `shared`
Reserved for shared contracts, DTOs, event models, and cross-app constants later.

---

## Architecture direction

The architecture being targeted looks like this:

```text
React Native Tablet App
        ↓
Local MySQL Database
        ↓
SymmetricDS Replication
        ↓
Central SymmetricDS Node
        ↓
RabbitMQ
        ↓
Node.js API
     ↙           ↘
Cloud MySQL     SignalR updates
Central DB      Real-time dashboard
```

### High-level flow

1. A tablet user updates inventory locally.
2. The local database stores that change first.
3. SymmetricDS detects and syncs that database change upstream.
4. The central side publishes or forwards the change into RabbitMQ.
5. The Node.js API consumes the event.
6. The Node.js API saves data to the cloud database.
7. The dashboard receives live updates through SignalR.

---

## Why the repo is split this way

Each major app is separated so you can:

- `cd` into it and run it independently
- keep responsibilities clear
- avoid mixing mobile, backend, dashboard, and infrastructure code together
- scale the project cleanly as more features are added

The goal is to keep the monorepo neat without forcing everything into one runtime.

---

## Initialization steps

Below are the commands used to initialize each part.

---

## 1. Create the main repo folders

Run these commands where you want the repo to live:

```bash
mkdir StockMesh
cd StockMesh

mkdir apps
mkdir infrastructure
mkdir shared

mkdir apps/tablet
mkdir apps/api
mkdir apps/dashboard-web
mkdir apps/realtime-hub

mkdir infrastructure/docker
mkdir infrastructure/docker/api-stack
mkdir infrastructure/docker/dashboard-stack
```

---

## 2. Initialize the React Native tablet app

From inside `StockMesh/apps`:

```bash
cd apps
npx @react-native-community/cli@latest init tablet-temp
```

Move the generated files into `apps/tablet`.

Example:

```bash
mv tablet-temp/* tablet/
mv tablet-temp/.* tablet/ 2>/dev/null || true
rmdir tablet-temp
```

The tablet app will live here:

```text
StockMesh/apps/tablet
```

### Run the tablet app

```bash
cd StockMesh/apps/tablet
npm install
npm run android
```

If you are targeting iOS:

```bash
cd ios
pod install
cd ..
npm run ios
```

### Notes

- Android Studio / SDK setup is required for Android runs
- Xcode is required for iOS runs
- For now, this app is just initialized, not fully built

---

## 3. Initialize the Node.js API

From inside `StockMesh/apps/api`:

```bash
cd StockMesh/apps/api
npm init -y
npm install express cors dotenv amqplib mysql2
npm install -D nodemon
mkdir src
mkdir src/config src/routes src/controllers src/services src/consumers src/lib
```

Update `package.json` scripts to:

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  }
}
```

### Run the Node.js API

```bash
cd StockMesh/apps/api
npm install
npm run dev
```

For production-style start:

```bash
npm start
```

---

## 4. Initialize the React dashboard website

From inside `StockMesh/apps`:

```bash
cd StockMesh/apps
npm create vite@latest dashboard-web -- --template react
cd dashboard-web
npm install
```

### Run the dashboard web app

```bash
cd StockMesh/apps/dashboard-web
npm install
npm run dev
```

By default, Vite will usually start on:

```text
http://localhost:5173
```

---

## 5. Initialize the SignalR hub

From inside `StockMesh/apps/realtime-hub`:

```bash
cd StockMesh/apps/realtime-hub
dotnet new web
```

This creates a minimal ASP.NET Core web app that will later host SignalR.

### Run the SignalR hub

```bash
cd StockMesh/apps/realtime-hub
dotnet run
```

By default, ASP.NET Core will print the local URL when it starts.

---

## 6. API-side Docker stack

Create this file:

```text
StockMesh/infrastructure/docker/api-stack/docker-compose.yml
```

Starter content:

```yaml
services:
  api:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - ../../../apps/api:/app
    command: sh -c "npm install && npm run dev"
    ports:
      - "3000:3000"
    depends_on:
      - rabbitmq
      - symmetricds

  rabbitmq:
    image: rabbitmq:management
    ports:
      - "5672:5672"
      - "15672:15672"

  symmetricds:
    image: jumpmind/symmetricds
    ports:
      - "31415:31415"
```

### Run the API-side Docker stack

```bash
cd StockMesh/infrastructure/docker/api-stack
docker compose up
```

To run it detached:

```bash
docker compose up -d
```

To stop it:

```bash
docker compose down
```

### What this stack starts

- Node.js API
- RabbitMQ
- SymmetricDS

---

## 7. Dashboard-side Docker stack

Create this file:

```text
StockMesh/infrastructure/docker/dashboard-stack/docker-compose.yml
```

Starter content:

```yaml
services:
  dashboard-web:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - ../../../apps/dashboard-web:/app
    command: sh -c "npm install && npm run dev -- --host"
    ports:
      - "5173:5173"
    depends_on:
      - dashboard-mysql

  dashboard-mysql:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: stockmesh_dashboard
    ports:
      - "3308:3306"

  realtime-hub:
    image: mcr.microsoft.com/dotnet/sdk:10.0
    working_dir: /app
    volumes:
      - ../../../apps/realtime-hub:/app
    command: sh -c "dotnet restore && dotnet run"
    ports:
      - "5001:5000"
```

### Run the dashboard-side Docker stack

```bash
cd StockMesh/infrastructure/docker/dashboard-stack
docker compose up
```

To run it detached:

```bash
docker compose up -d
```

To stop it:

```bash
docker compose down
```

### What this stack starts

- React dashboard web app
- MySQL for dashboard-side development
- ASP.NET Core SignalR hub

---

## Running everything individually

If you want to run each piece on its own without Docker:

### Tablet app

```bash
cd StockMesh/apps/tablet
npm install
npm run android
```

### Node.js API

```bash
cd StockMesh/apps/api
npm install
npm run dev
```

### React dashboard website

```bash
cd StockMesh/apps/dashboard-web
npm install
npm run dev
```

### SignalR hub

```bash
cd StockMesh/apps/realtime-hub
dotnet run
```

---

## Running the infrastructure with Docker

### API-side stack

```bash
cd StockMesh/infrastructure/docker/api-stack
docker compose up
```

### Dashboard-side stack

```bash
cd StockMesh/infrastructure/docker/dashboard-stack
docker compose up
```

---

## Recommended order to start the project during development

If you are working locally and just want the basics up:

1. Start the API-side Docker stack
2. Start the dashboard-side Docker stack
3. Start the SignalR hub if not already running in Docker
4. Start the React dashboard web app if not already running in Docker
5. Start the tablet app

Simple working order:

```bash
cd StockMesh/infrastructure/docker/api-stack
docker compose up
```

Then in another terminal:

```bash
cd StockMesh/infrastructure/docker/dashboard-stack
docker compose up
```

Then in another terminal:

```bash
cd StockMesh/apps/tablet
npm install
npm run android
```

---

## Current scope

Right now, the repo is only being initialized.

That means:

- no inventory tables yet
- no sync rules yet
- no RabbitMQ consumers yet
- no SignalR hubs yet
- no dashboard features yet
- no authentication yet

The goal right now is only to:

- initialize each app
- organize the repo cleanly
- make sure each piece can be run independently
- prepare the foundation for the real build later

---

## Future work

Later phases will include:

- inventory table design
- local and central MySQL schema
- SymmetricDS node configuration
- RabbitMQ event contracts
- Node.js consumer implementation
- SignalR hub implementation
- dashboard UI
- reporting views
- offline sync scenarios
- franchise-wide inventory rollups

---

## Suggested next steps

After initialization, the next logical steps are:

1. Create the basic starter files for each app
2. Add minimal health-check routes
3. Add Dockerfiles where needed
4. Create the first local and central MySQL databases
5. Define the first inventory tables
6. Configure SymmetricDS nodes
7. Add RabbitMQ publisher and consumer flow
8. Connect the SignalR dashboard

---

## Summary

StockMesh is being organized as a clean multi-app repository for a distributed inventory tracking platform.

It includes:

- a React Native tablet app
- a Node.js API
- a React dashboard web app
- an ASP.NET Core SignalR hub
- RabbitMQ
- SymmetricDS
- MySQL

Each app is kept separate so it can be developed and run independently while still fitting into one organized repository.

## Commands to start apps via docker 

cd infrastructure/docker/api-stack
docker compose up --build

cd infrastructure/docker/dashboard-stack
docker compose up --build
