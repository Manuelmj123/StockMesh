#!/bin/sh

set -eu

echo "Waiting for central SymmetricDS engine files..."
until [ -f /opt/symmetric-ds/engines/central-000.properties ]; do
  sleep 2
done

echo "Opening registration for store node 001 on central..."
until /opt/symmetric-ds/bin/symadmin open-registration --engine central-000 store 001; do
  echo "Retrying open-registration..."
  sleep 5
done

echo "Open registration completed."