#!/bin/sh

set -eu

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_STACK_DIR="$ROOT_DIR/infrastructure/docker/api-stack"
DASHBOARD_STACK_DIR="$ROOT_DIR/infrastructure/docker/dashboard-stack"
NETWORK_NAME="stockmesh-shared"

echo "Ensuring Docker network exists: $NETWORK_NAME"
docker network inspect "$NETWORK_NAME" >/dev/null 2>&1 || docker network create "$NETWORK_NAME"

echo "Starting dashboard stack..."
docker compose -f "$DASHBOARD_STACK_DIR/docker-compose.yml" up --build -d

echo "Starting api stack..."
docker compose -f "$API_STACK_DIR/docker-compose.yml" up --build -d

echo "StockMesh stacks started successfully."

echo "Verifying container DNS..."
docker exec api-stack-api-1 getent hosts realtime-hub || true
docker exec api-stack-realtime-hub-1 getent hosts dashboard-mysql || true
docker exec api-stack-realtime-hub-1 getent hosts rabbitmq || true

echo "Done."