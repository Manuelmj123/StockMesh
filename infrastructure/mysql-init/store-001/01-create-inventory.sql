USE stockmesh_store_001;

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id BIGINT NOT NULL AUTO_INCREMENT,
    sku VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (inventory_id),
    UNIQUE KEY uq_inventory_sku (sku)
);