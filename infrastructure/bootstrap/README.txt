This bootstrap folder is mounted into the one-shot symmetric-bootstrap container.

bootstrap-symmetric.sh waits for:
1. mysql-central
2. SymmetricDS system tables in stockmesh_central

Then it applies init-symmetric-inventory.sql to register:
- channel
- router
- trigger
- trigger_router

This setup assumes:
- source node group id = store
- target node group id = central
- the business table is named inventory

symmetric-prepare:
- creates SymmetricDS system tables for central-000 and store-001
- opens registration for store node 001 on central-000

symmetric-bootstrap:
- waits for the sym_node table to exist
- loads node groups, node group links, channel, router, trigger, and trigger-router config

This keeps first boot deterministic and removes the need for manual create-sym-tables or open-registration commands.