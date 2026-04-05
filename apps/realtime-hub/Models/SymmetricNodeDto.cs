namespace realtime_hub.Models;

public sealed class SymmetricNodeDto
{
    public string NodeId { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
    public string GroupId { get; set; } = string.Empty;
    public string RegistrationStatus { get; set; } = string.Empty;
    public string SecurityToken { get; set; } = string.Empty;
    public string? LastSeen { get; set; }
    public int PendingBatches { get; set; }
    public int? PullMs { get; set; }
    public int? PushMs { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public bool IsConnected { get; set; }
    public string Role { get; set; } = string.Empty;
    public string? ExternalId { get; set; }
}