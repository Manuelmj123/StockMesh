#!/bin/sh

set -eu

run_until_success() {
  description="$1"
  shift

  echo "Preparing: $description"

  until "$@"; do
    echo "Retrying: $description"
    sleep 5
  done
}

run_until_success \
  "create SymmetricDS tables for central-000" \
  /opt/symmetric-ds/bin/symadmin --engine central-000 create-sym-tables

run_until_success \
  "create SymmetricDS tables for store-001" \
  /opt/symmetric-ds/bin/symadmin --engine store-001 create-sym-tables

run_until_success \
  "open registration for store node 001 on central-000" \
  /opt/symmetric-ds/bin/symadmin open-registration --engine central-000 store 001

echo "SymmetricDS preparation completed."