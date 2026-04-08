using MySqlConnector;
using realtime_hub.Models;

namespace realtime_hub.Services;

public sealed class DashboardInventoryWriter
{
    private readonly IConfiguration _configuration;

    public DashboardInventoryWriter(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private string BuildConnectionString()
    {
        var host = _configuration["DashboardDb:Host"] ?? "dashboard-mysql";
        var port = _configuration["DashboardDb:Port"] ?? "3306";
        var database = _configuration["DashboardDb:Database"] ?? "stockmesh_dashboard";
        var user = _configuration["DashboardDb:User"] ?? "root";
        var password = _configuration["DashboardDb:Password"] ?? "root";

        return $"Server={host};Port={port};Database={database};User ID={user};Password={password};";
    }

    public async Task<IReadOnlyCollection<InventoryItemDto>> GetAllInventoryAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(BuildConnectionString());
        await connection.OpenAsync(cancellationToken);

        const string sql = """
            SELECT
                inventory_id,
                sku,
                item_name,
                quantity_on_hand,
                unit_price,
                updated_at
            FROM inventory
            ORDER BY sku ASC
            """;

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<InventoryItemDto>();

        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new InventoryItemDto
            {
                InventoryId = reader.GetInt64("inventory_id"),
                Sku = reader.GetString("sku"),
                ItemName = reader.GetString("item_name"),
                QuantityOnHand = reader.GetInt32("quantity_on_hand"),
                UnitPrice = reader.GetDecimal("unit_price"),
                UpdatedAt = reader.IsDBNull(reader.GetOrdinal("updated_at"))
                    ? null
                    : reader.GetDateTime("updated_at")
            });
        }

        return items;
    }

    public async Task<InventoryItemDto> UpsertInventoryAsync(
        InventoryReplicationMessage message,
        CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(BuildConnectionString());
        await connection.OpenAsync(cancellationToken);

        const string upsertSql = """
            INSERT INTO inventory
            (
                sku,
                item_name,
                quantity_on_hand,
                unit_price
            )
            VALUES
            (
                @sku,
                @item_name,
                @quantity_on_hand,
                @unit_price
            )
            ON DUPLICATE KEY UPDATE
                item_name = VALUES(item_name),
                quantity_on_hand = VALUES(quantity_on_hand),
                unit_price = VALUES(unit_price),
                updated_at = CURRENT_TIMESTAMP
            """;

        await using (var command = new MySqlCommand(upsertSql, connection))
        {
            command.Parameters.AddWithValue("@sku", message.Sku);
            command.Parameters.AddWithValue("@item_name", message.ItemName);
            command.Parameters.AddWithValue("@quantity_on_hand", message.QuantityOnHand);
            command.Parameters.AddWithValue("@unit_price", message.UnitPrice);

            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        const string selectSql = """
            SELECT
                inventory_id,
                sku,
                item_name,
                quantity_on_hand,
                unit_price,
                updated_at
            FROM inventory
            WHERE sku = @sku
            LIMIT 1
            """;

        await using var selectCommand = new MySqlCommand(selectSql, connection);
        selectCommand.Parameters.AddWithValue("@sku", message.Sku);

        await using var reader = await selectCommand.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException($"Inventory record with SKU '{message.Sku}' was not found after upsert.");
        }

        return new InventoryItemDto
        {
            InventoryId = reader.GetInt64("inventory_id"),
            Sku = reader.GetString("sku"),
            ItemName = reader.GetString("item_name"),
            QuantityOnHand = reader.GetInt32("quantity_on_hand"),
            UnitPrice = reader.GetDecimal("unit_price"),
            UpdatedAt = reader.IsDBNull(reader.GetOrdinal("updated_at"))
                ? null
                : reader.GetDateTime("updated_at")
        };
    }
}