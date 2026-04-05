using Microsoft.AspNetCore.SignalR;
using realtime_hub.Services;

namespace realtime_hub.Hubs;

public sealed class SymmetricMonitorHub : Hub
{
    private readonly MonitorState _monitorState;

    public SymmetricMonitorHub(MonitorState monitorState)
    {
        _monitorState = monitorState;
    }

    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("InitialNodeSnapshot", _monitorState.GetNodes());
        await base.OnConnectedAsync();
    }
}