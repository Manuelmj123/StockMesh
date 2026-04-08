#!/bin/sh

set -eu

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_STACK_DIR="$ROOT_DIR/infrastructure/docker/api-stack"
DASHBOARD_STACK_DIR="$ROOT_DIR/infrastructure/docker/dashboard-stack"

echo "Stopping api stack..."
docker compose -f "$API_STACK_DIR/docker-compose.yml" down

echo "Stopping dashboard stack..."
docker compose -f "$DASHBOARD_STACK_DIR/docker-compose.yml" down

echo "StockMesh stacks stopped."