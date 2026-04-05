namespace realtime_hub.Models;

public sealed class ReplicationActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string NodeId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? CreatedAt { get; set; }
    public string? Direction { get; set; }
    public string? BatchId { get; set; }
    public int? RecordsAffected { get; set; }
}