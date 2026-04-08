using Microsoft.AspNetCore.SignalR;
using realtime_hub.Services;

namespace realtime_hub.Hubs;

public sealed class InventoryMonitorHub : Hub
{
    private readonly InventoryState _inventoryState;

    public InventoryMonitorHub(InventoryState inventoryState)
    {
        _inventoryState = inventoryState;
    }

    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("InitialInventorySnapshot", _inventoryState.GetItems());
        await base.OnConnectedAsync();
    }
}