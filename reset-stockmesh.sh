#!/bin/sh

set -eu

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_STACK_DIR="$ROOT_DIR/infrastructure/docker/api-stack"
DASHBOARD_STACK_DIR="$ROOT_DIR/infrastructure/docker/dashboard-stack"
NETWORK_NAME="stockmesh-shared"

echo "Stopping stacks and removing volumes..."
docker compose -f "$API_STACK_DIR/docker-compose.yml" down -v --remove-orphans || true
docker compose -f "$DASHBOARD_STACK_DIR/docker-compose.yml" down -v --remove-orphans || true

echo "Recreating shared network..."
docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
docker network create "$NETWORK_NAME"

echo "Starting dashboard stack..."
docker compose -f "$DASHBOARD_STACK_DIR/docker-compose.yml" up --build -d

echo "Starting api stack..."
docker compose -f "$API_STACK_DIR/docker-compose.yml" up --build -d

echo "Reset complete."