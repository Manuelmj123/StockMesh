#!/bin/sh

set -eu

export MYSQL_PWD=root

mysql_exec_central() {
  mysql -h mysql-central -uroot stockmesh_central -Nse "$1"
}

mysql_exec_store() {
  mysql -h mysql-store-001 -uroot stockmesh_store_001 -Nse "$1"
}

echo "Waiting for store node identity to appear on central..."
until [ "$(mysql_exec_central "
SELECT COUNT(*)
FROM sym_node
WHERE external_id = '001'
  AND node_group_id = 'store'
")" -ge 1 ]; do
  sleep 3
done

echo "Waiting for store node security registration time on central..."
until [ "$(mysql_exec_central "
SELECT COUNT(*)
FROM sym_node_security sns
INNER JOIN sym_node sn
  ON sn.node_id = sns.node_id
WHERE sn.external_id = '001'
  AND sn.node_group_id = 'store'
  AND sns.registration_time IS NOT NULL
")" -ge 1 ]; do
  sleep 3
done

echo "Waiting for inventory trigger metadata on store..."
until [ "$(mysql_exec_store "
SELECT COUNT(*)
FROM sym_trigger
WHERE trigger_id = 'inventory_trigger'
")" -ge 1 ]; do
  sleep 3
done

echo "Waiting for inventory trigger-router metadata on store..."
until [ "$(mysql_exec_store "
SELECT COUNT(*)
FROM sym_trigger_router
WHERE trigger_id = 'inventory_trigger'
  AND router_id = 'store_to_central_inventory'
")" -ge 1 ]; do
  sleep 3
done

echo "Waiting for physical MySQL triggers on stockmesh_store_001.inventory..."
until [ "$(mysql_exec_store "
SELECT COUNT(*)
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'stockmesh_store_001'
  AND EVENT_OBJECT_TABLE = 'inventory'
")" -ge 3 ]; do
  sleep 3
done

echo "Waiting for reload requests for inventory to be processed..."
until [ "$(mysql_exec_central "
SELECT COUNT(*)
FROM sym_table_reload_request
WHERE trigger_id = 'inventory_trigger'
  AND router_id = 'store_to_central_inventory'
  AND processed = 0
")" -eq 0 ]; do
  sleep 3
done

echo "SymmetricDS is fully ready."