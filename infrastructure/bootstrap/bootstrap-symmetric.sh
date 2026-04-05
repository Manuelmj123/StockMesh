#!/bin/sh

set -eu

echo "Waiting for mysql-central to become available..."
until mysql -h mysql-central -uroot -proot -e "SELECT 1" >/dev/null 2>&1; do
  sleep 2
done

echo "Waiting for SymmetricDS system tables to exist..."
until mysql -h mysql-central -uroot -proot stockmesh_central -e "SHOW TABLES LIKE 'sym_node'" | grep -q "sym_node"; do
  sleep 2
done

echo "Applying SymmetricDS topology and inventory configuration..."
mysql -h mysql-central -uroot -proot stockmesh_central < /bootstrap/init-symmetric-inventory.sql

echo "SymmetricDS bootstrap completed."