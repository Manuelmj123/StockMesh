using System.Collections.Concurrent;
using realtime_hub.Models;

namespace realtime_hub.Services;

public sealed class MonitorState
{
    private readonly ConcurrentDictionary<string, SymmetricNodeDto> _nodes = new();
    private readonly LinkedList<ReplicationActivityDto> _activity = new();
    private readonly object _activityLock = new();

    public IReadOnlyCollection<SymmetricNodeDto> GetNodes()
    {
        return _nodes.Values
            .OrderBy(node => node.NodeId, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public IReadOnlyCollection<ReplicationActivityDto> GetActivity(int take)
    {
        lock (_activityLock)
        {
            return _activity.Take(take).ToArray();
        }
    }

    public void SetNodes(IEnumerable<SymmetricNodeDto> nodes)
    {
        var incoming = nodes.ToList();
        var incomingIds = new HashSet<string>(incoming.Select(node => node.NodeId), StringComparer.OrdinalIgnoreCase);

        foreach (var node in incoming)
        {
            _nodes[node.NodeId] = node;
        }

        foreach (var existingKey in _nodes.Keys)
        {
            if (!incomingIds.Contains(existingKey))
            {
                _nodes.TryRemove(existingKey, out _);
            }
        }
    }

    public void AddActivity(ReplicationActivityDto item)
    {
        lock (_activityLock)
        {
            var duplicate = _activity.FirstOrDefault(existing => existing.Id == item.Id);
            if (duplicate is not null)
            {
                _activity.Remove(duplicate);
            }

            _activity.AddFirst(item);

            while (_activity.Count > 150)
            {
                _activity.RemoveLast();
            }
        }
    }
}