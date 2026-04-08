#!/bin/sh

set -eu

export MYSQL_PWD=root

echo "Waiting for mysql-central to become available..."
until mysql -h mysql-central -uroot -e "SELECT 1" >/dev/null 2>&1; do
  sleep 2
done

echo "Waiting for SymmetricDS system tables to exist on central..."
until mysql -h mysql-central -uroot stockmesh_central -Nse "SHOW TABLES LIKE 'sym_node'" | grep -q "sym_node"; do
  sleep 2
done

echo "Applying SymmetricDS topology and inventory configuration..."
mysql -h mysql-central -uroot stockmesh_central < /bootstrap/init-symmetric-inventory.sql

echo "Verifying topology rows exist on central..."
until mysql -h mysql-central -uroot stockmesh_central -Nse "
SELECT COUNT(*)
FROM sym_trigger
WHERE trigger_id = 'inventory_trigger'
" | grep -q "^1$"; do
  sleep 2
done

until mysql -h mysql-central -uroot stockmesh_central -Nse "
SELECT COUNT(*)
FROM sym_trigger_router
WHERE trigger_id = 'inventory_trigger'
  AND router_id = 'store_to_central_inventory'
" | grep -q "^1$"; do
  sleep 2
done

until mysql -h mysql-central -uroot stockmesh_central -Nse "
SELECT COUNT(*)
FROM sym_router
WHERE router_id = 'store_to_central_inventory'
" | grep -q "^1$"; do
  sleep 2
done

echo "SymmetricDS bootstrap completed."