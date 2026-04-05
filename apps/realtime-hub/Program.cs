using Microsoft.AspNetCore.SignalR;
using realtime_hub.Hubs;
using realtime_hub.Models;
using realtime_hub.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddSingleton<MonitorState>();

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? new[]
{
    "http://localhost:5173"
};

builder.Services.AddCors(options =>
{
    options.AddPolicy("DashboardCors", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("DashboardCors");

app.MapGet("/", () => Results.Ok(new
{
    ok = true,
    service = "realtime-hub"
}));

app.MapGet("/api/monitor/nodes", (MonitorState state) =>
{
    return Results.Ok(state.GetNodes());
});

app.MapGet("/api/monitor/activity", (int? take, MonitorState state) =>
{
    var size = Math.Clamp(take ?? 20, 1, 100);
    return Results.Ok(state.GetActivity(size));
});

app.MapPost("/internal/symmetric/nodes/snapshot", async (
    HttpRequest request,
    IEnumerable<SymmetricNodeDto> nodes,
    MonitorState state,
    IHubContext<SymmetricMonitorHub> hubContext,
    IConfiguration configuration) =>
{
    var apiKey = configuration["MonitorSettings:InternalApiKey"] ?? "stockmesh-dev-key";
    var incomingApiKey = request.Headers["X-Internal-Api-Key"].FirstOrDefault();

    if (!string.Equals(apiKey, incomingApiKey, StringComparison.Ordinal))
    {
        return Results.Unauthorized();
    }

    var nodeList = nodes.ToList();

    state.SetNodes(nodeList);

    await hubContext.Clients.All.SendAsync("InitialNodeSnapshot", nodeList);

    foreach (var node in nodeList)
    {
        await hubContext.Clients.All.SendAsync("NodeMetricsUpdated", node);
    }

    return Results.Ok(new { ok = true, count = nodeList.Count });
});

app.MapPost("/internal/symmetric/activity", async (
    HttpRequest request,
    IEnumerable<ReplicationActivityDto> items,
    MonitorState state,
    IHubContext<SymmetricMonitorHub> hubContext,
    IConfiguration configuration) =>
{
    var apiKey = configuration["MonitorSettings:InternalApiKey"] ?? "stockmesh-dev-key";
    var incomingApiKey = request.Headers["X-Internal-Api-Key"].FirstOrDefault();

    if (!string.Equals(apiKey, incomingApiKey, StringComparison.Ordinal))
    {
        return Results.Unauthorized();
    }

    var activityItems = items.ToList();

    foreach (var item in activityItems)
    {
        state.AddActivity(item);
        await hubContext.Clients.All.SendAsync("ReplicationActivityCreated", item);
    }

    return Results.Ok(new { ok = true, count = activityItems.Count });
});

app.MapHub<SymmetricMonitorHub>("/hubs/symmetric-monitor");

app.Run();