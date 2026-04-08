using System.Collections.Concurrent;
using realtime_hub.Models;

namespace realtime_hub.Services;

public sealed class InventoryState
{
    private readonly ConcurrentDictionary<string, InventoryItemDto> _items = new(StringComparer.OrdinalIgnoreCase);

    public IReadOnlyCollection<InventoryItemDto> GetItems()
    {
        return _items.Values
            .OrderBy(item => item.Sku, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public void SetItems(IEnumerable<InventoryItemDto> items)
    {
        var incomingItems = items.ToList();
        var incomingKeys = new HashSet<string>(
            incomingItems.Select(item => item.Sku),
            StringComparer.OrdinalIgnoreCase
        );

        foreach (var item in incomingItems)
        {
            _items[item.Sku] = item;
        }

        foreach (var existingKey in _items.Keys)
        {
            if (!incomingKeys.Contains(existingKey))
            {
                _items.TryRemove(existingKey, out _);
            }
        }
    }

    public void UpsertItem(InventoryItemDto item)
    {
        _items[item.Sku] = item;
    }
}