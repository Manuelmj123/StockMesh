USE stockmesh_central;

INSERT INTO sym_node_group (
    node_group_id,
    description
)
SELECT
    'central',
    'Central node group'
FROM dual
WHERE NOT EXISTS (
    SELECT 1
    FROM sym_node_group
    WHERE node_group_id = 'central'
);

INSERT INTO sym_node_group (
    node_group_id,
    description
)
SELECT
    'store',
    'Store node group'
FROM dual
WHERE NOT EXISTS (
    SELECT 1
    FROM sym_node_group
    WHERE node_group_id = 'store'
);

INSERT INTO sym_node_group_link (
    source_node_group_id,
    target_node_group_id,
    data_event_action
)
SELECT
    'store',
    'central',
    'P'
FROM dual
WHERE NOT EXISTS (
    SELECT 1
    FROM sym_node_group_link
    WHERE source_node_group_id = 'store'
      AND target_node_group_id = 'central'
);

INSERT INTO sym_node_group_link (
    source_node_group_id,
    target_node_group_id,
    data_event_action
)
SELECT
    'central',
    'store',
    'W'
FROM dual
WHERE NOT EXISTS (
    SELECT 1
    FROM sym_node_group_link
    WHERE source_node_group_id = 'central'
      AND target_node_group_id = 'store'
);

INSERT INTO sym_channel (
    channel_id,
    processing_order,
    max_batch_size,
    enabled,
    description
)
SELECT
    'inventory',
    1,
    100000,
    1,
    'Inventory replication channel'
FROM dual
WHERE NOT EXISTS (
    SELECT 1
    FROM sym_channel
    WHERE channel_id = 'inventory'
);

INSERT INTO sym_router (
    router_id,
    source_node_group_id,
    target_node_group_id,
    router_type,
    create_time,
    last_update_time
)
SELECT
    'store_to_central_inventory',
    'store',
    'central',
    'default',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM dual
WHERE NOT EXISTS (
    SELECT 1
    FROM sym_router
    WHERE router_id = 'store_to_central_inventory'
);

INSERT INTO sym_trigger (
    trigger_id,
    source_table_name,
    channel_id,
    sync_on_insert,
    sync_on_update,
    sync_on_delete,
    sync_on_incoming_batch,
    use_stream_lobs,
    create_time,
    last_update_time
)
SELECT
    'inventory_trigger',
    'inventory',
    'inventory',
    1,
    1,
    1,
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM dual
WHERE NOT EXISTS (
    SELECT 1
    FROM sym_trigger
    WHERE trigger_id = 'inventory_trigger'
);

INSERT INTO sym_trigger_router (
    trigger_id,
    router_id,
    initial_load_order,
    initial_load_select,
    ping_back_enabled,
    enabled,
    create_time,
    last_update_time
)
SELECT
    'inventory_trigger',
    'store_to_central_inventory',
    100,
    NULL,
    0,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM dual
WHERE NOT EXISTS (
    SELECT 1
    FROM sym_trigger_router
    WHERE trigger_id = 'inventory_trigger'
      AND router_id = 'store_to_central_inventory'
);

UPDATE sym_trigger
SET channel_id = 'inventory',
    sync_on_insert = 1,
    sync_on_update = 1,
    sync_on_delete = 1,
    sync_on_incoming_batch = 0,
    use_stream_lobs = 0,
    last_update_time = CURRENT_TIMESTAMP
WHERE trigger_id = 'inventory_trigger';

UPDATE sym_trigger_router
SET enabled = 1,
    ping_back_enabled = 0,
    initial_load_order = 100,
    last_update_time = CURRENT_TIMESTAMP
WHERE trigger_id = 'inventory_trigger'
  AND router_id = 'store_to_central_inventory';

INSERT INTO sym_table_reload_request (
    target_node_id,
    router_id,
    trigger_id,
    source_node_id,
    create_time,
    last_update_time
)
SELECT
    '001',
    'store_to_central_inventory',
    'inventory_trigger',
    '000',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM dual
WHERE NOT EXISTS (
    SELECT 1
    FROM sym_table_reload_request
    WHERE target_node_id = '001'
      AND trigger_id = 'inventory_trigger'
      AND router_id = 'store_to_central_inventory'
      AND processed = 0
);