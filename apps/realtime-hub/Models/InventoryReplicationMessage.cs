using System.Text.Json.Serialization;

namespace realtime_hub.Models;

public sealed class InventoryReplicationMessage
{
    [JsonPropertyName("inventory_id")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public long InventoryId { get; set; }

    [JsonPropertyName("sku")]
    public string Sku { get; set; } = string.Empty;

    [JsonPropertyName("item_name")]
    public string ItemName { get; set; } = string.Empty;

    [JsonPropertyName("quantity_on_hand")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public int QuantityOnHand { get; set; }

    [JsonPropertyName("unit_price")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public decimal UnitPrice { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}