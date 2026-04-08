namespace realtime_hub.Models;

public sealed class InventoryItemDto
{
    public long InventoryId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime? UpdatedAt { get; set; }
}