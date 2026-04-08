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

    public async Task UpsertInventoryAsync(InventoryReplicationMessage message, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(BuildConnectionString());
        await connection.OpenAsync(cancellationToken);

        const string sql = """
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

        await using var command = new MySqlCommand(sql, connection);

        command.Parameters.AddWithValue("@sku", message.Sku);
        command.Parameters.AddWithValue("@item_name", message.ItemName);
        command.Parameters.AddWithValue("@quantity_on_hand", message.QuantityOnHand);
        command.Parameters.AddWithValue("@unit_price", message.UnitPrice);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}