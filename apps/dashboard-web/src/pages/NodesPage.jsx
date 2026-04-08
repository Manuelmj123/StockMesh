import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const SIGNALR_BASE_URL = import.meta.env.VITE_SIGNALR_BASE_URL || "http://localhost:5001";

function StatCard({ label, value, tone = "default", index = 0 }) {
  return (
    <div className="sn-stat-card" style={{ animationDelay: `${index * 80}ms` }}>
      <div className={`sn-stat-inner sn-tone-${tone}`}>
        <div className="sn-stat-label">{label}</div>
        <div className="sn-stat-value">{value}</div>
        <div className="sn-stat-corner" />
      </div>
    </div>
  );
}

function LatencyBar({ ms, max = 300 }) {
  if (ms === null || ms === undefined) {
    return <span className="sn-na">N/A</span>;
  }

  const pct = Math.min((ms / max) * 100, 100);
  const tone = ms < 80 ? "good" : ms < 180 ? "warn" : "bad";

  return (
    <div className="sn-latency">
      <span className={`sn-latency-val sn-lat-${tone}`}>{ms} ms</span>
      <div className="sn-latency-track">
        <div className={`sn-latency-fill sn-lat-${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NodeStatus({ status }) {
  const normalizedStatus = (status || "Offline").toLowerCase();

  return (
    <span className={`sn-status sn-status-${normalizedStatus}`}>
      <span className="sn-status-dot" />
      {status || "Offline"}
    </span>
  );
}

function ActionButton({ children, onClick, disabled, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: danger ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
        color: "#f8fafc",
        borderRadius: "10px",
        padding: "8px 12px",
        fontSize: "11px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease"
      }}
    >
      {children}
    </button>
  );
}

function formatTime(value) {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatRelativeTime(value) {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 10) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getEffectiveNodeStatus(node) {
  const containerStatus = (node?.containerStatus || "").toLowerCase();
  const logicalStatus = (node?.status || "Offline").toLowerCase();

  if (containerStatus && containerStatus !== "running") {
    return "Offline";
  }

  if (logicalStatus === "warning") {
    return "Warning";
  }

  if (logicalStatus === "online") {
    return "Online";
  }

  return "Offline";
}

function ActivityItem({ item }) {
  const type = (item.type || "").toLowerCase();
  const tone = type.includes("error") ? "#ef4444" : type.includes("incoming") ? "#38bdf8" : "#f59e0b";

  return (
    <article
      style={{
        background: "#0f172a",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 14,
        display: "grid",
        gap: 8
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <strong style={{ color: "#f8fafc", fontSize: 13 }}>{item.nodeId}</strong>
          <span
            style={{
              color: tone,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase"
            }}
          >
            {item.type}
          </span>
        </div>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>{formatRelativeTime(item.createdAt)}</span>
      </div>

      <p style={{ color: "#cbd5e1", fontSize: 13, margin: 0 }}>{item.message}</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#94a3b8", fontSize: 12 }}>
        {item.direction ? <span>{item.direction}</span> : null}
        {item.batchId ? <span>Batch {item.batchId}</span> : null}
        {item.recordsAffected !== null && item.recordsAffected !== undefined ? (
          <span>{item.recordsAffected} records</span>
        ) : null}
      </div>
    </article>
  );
}

const STATUS_TONE = {
  online: "default",
  warning: "warning",
  offline: "danger"
};

function isStoppedDuringNegotiationError(error) {
  const message = String(error?.message || "");
  return (
    error?.name === "AbortError" ||
    message.includes("stopped during negotiation") ||
    message.includes("The connection was stopped during negotiation")
  );
}

export default function NodesPage() {
  const [nodes, setNodes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [restartingNodeIds, setRestartingNodeIds] = useState({});
  const [hubState, setHubState] = useState("Connecting");
  const isMountedRef = useRef(false);

  const loadNodes = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/symmetric/nodes`);
    if (!response.ok) {
      throw new Error(`Failed to load nodes: ${response.status}`);
    }

    const payload = await response.json();
    if (isMountedRef.current) {
      setNodes(Array.isArray(payload) ? payload : []);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/symmetric/activity?take=20`);
    if (!response.ok) {
      throw new Error(`Failed to load activity: ${response.status}`);
    }

    const payload = await response.json();
    if (isMountedRef.current) {
      setActivity(Array.isArray(payload) ? payload : []);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setRefreshing(true);

      const response = await fetch(`${API_BASE_URL}/api/symmetric/nodes/refresh`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh nodes: ${response.status}`);
      }

      const payload = await response.json();

      if (isMountedRef.current) {
        setNodes(Array.isArray(payload.nodes) ? payload.nodes : []);
      }

      await loadActivity();
    } catch (error) {
      console.error("Failed to refresh nodes", error);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [loadActivity]);

  const restartNode = useCallback(
    async (nodeId) => {
      try {
        setRestartingNodeIds((current) => ({
          ...current,
          [nodeId]: true
        }));

        setNodes((current) =>
          current.map((node) =>
            node.nodeId === nodeId
              ? {
                  ...node,
                  status: "Offline",
                  notes: "Restart in progress..."
                }
              : node
          )
        );

        const response = await fetch(`${API_BASE_URL}/api/symmetric/nodes/${nodeId}/restart`, {
          method: "POST"
        });

        if (!response.ok) {
          throw new Error(`Failed to restart node ${nodeId}: ${response.status}`);
        }

        const payload = await response.json();

        if (isMountedRef.current) {
          setNodes(Array.isArray(payload.nodes) ? payload.nodes : []);
        }

        await loadActivity();
      } catch (error) {
        console.error("Failed to restart node", error);

        if (isMountedRef.current) {
          setNodes((current) =>
            current.map((node) =>
              node.nodeId === nodeId
                ? {
                    ...node,
                    notes: "Restart failed. Check API and container logs."
                  }
                : node
            )
          );
        }
      } finally {
        if (isMountedRef.current) {
          setRestartingNodeIds((current) => ({
            ...current,
            [nodeId]: false
          }));
        }
      }
    },
    [loadActivity]
  );

  useEffect(() => {
    isMountedRef.current = true;

    loadNodes().catch((error) => console.error("Failed to load nodes", error));
    loadActivity().catch((error) => console.error("Failed to load activity", error));

    return () => {
      isMountedRef.current = false;
    };
  }, [loadNodes, loadActivity]);

  useEffect(() => {
    let disposed = false;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_BASE_URL}/hubs/symmetric-monitor`)
      .withAutomaticReconnect()
      .build();

    connection.on("InitialNodeSnapshot", (snapshot) => {
      if (!disposed && Array.isArray(snapshot)) {
        setNodes(snapshot);
      }
    });

    connection.on("NodeMetricsUpdated", (updatedNode) => {
      if (disposed || !updatedNode?.nodeId) {
        return;
      }

      setNodes((current) => {
        const existingIndex = current.findIndex((node) => node.nodeId === updatedNode.nodeId);

        if (existingIndex === -1) {
          return [...current, updatedNode].sort((a, b) => a.nodeId.localeCompare(b.nodeId));
        }

        const next = [...current];
        next[existingIndex] = {
          ...next[existingIndex],
          ...updatedNode
        };

        return next.sort((a, b) => a.nodeId.localeCompare(b.nodeId));
      });
    });

    connection.on("ReplicationActivityCreated", (item) => {
      if (disposed || !item?.id) {
        return;
      }

      setActivity((current) => {
        const next = [item, ...current.filter((existing) => existing.id !== item.id)];
        return next.slice(0, 20);
      });
    });

    connection.onreconnecting(() => {
      if (!disposed) {
        setHubState("Reconnecting");
      }
    });

    connection.onreconnected(() => {
      if (!disposed) {
        setHubState("Connected");
      }
    });

    connection.onclose(() => {
      if (!disposed) {
        setHubState("Disconnected");
      }
    });

    connection
      .start()
      .then(() => {
        if (!disposed) {
          setHubState("Connected");
        }
      })
      .catch((error) => {
        if (disposed || isStoppedDuringNegotiationError(error)) {
          return;
        }

        console.error("Realtime connection failed", error);
        if (!disposed) {
          setHubState("Disconnected");
        }
      });

    const fallbackInterval = setInterval(() => {
      if (disposed) {
        return;
      }

      loadNodes().catch((error) => {
        if (!disposed) {
          console.error("Fallback node refresh failed", error);
        }
      });

      loadActivity().catch((error) => {
        if (!disposed) {
          console.error("Fallback activity refresh failed", error);
        }
      });
    }, 10000);

    return () => {
      disposed = true;
      clearInterval(fallbackInterval);

      connection.stop().catch(() => {});
    };
  }, [loadNodes, loadActivity]);

  const total = nodes.length;

  const online = useMemo(
    () => nodes.filter((node) => getEffectiveNodeStatus(node) === "Online").length,
    [nodes]
  );

  const attn = useMemo(
    () =>
      nodes.filter((node) => {
        const status = getEffectiveNodeStatus(node);
        return status === "Warning" || status === "Offline";
      }).length,
    [nodes]
  );

  return (
    <div className="sn-root">
      <header className="sn-hero">
        <div>
          <span className="sn-eyebrow">SymmetricDS Monitoring</span>

          <h1 className="sn-hero-title">
            Replication
            <span className="sn-hero-accent">Node Health</span>
          </h1>

          <p className="sn-hero-sub">
            Registration state, connectivity, latency, pending batch activity, and container status
            for every node in the StockMesh network.
          </p>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ActionButton onClick={refreshAll} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh All"}
            </ActionButton>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "8px 12px",
                color: "#cbd5e1",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                background: "rgba(255,255,255,0.04)"
              }}
            >
              Hub: {hubState}
            </div>
          </div>
        </div>

        <div className="sn-hero-topology">
          <div className="sn-topo-center">
            <span className="sn-topo-ring sn-topo-ring-1" />
            <span className="sn-topo-ring sn-topo-ring-2" />
            <span className="sn-topo-ring sn-topo-ring-3" />
            <span className="sn-topo-hub">
              <span>{total}</span>
              <small>nodes</small>
            </span>
          </div>
        </div>
      </header>

      <section className="sn-stats-row">
        <StatCard index={0} label="Total Nodes" value={total} />
        <StatCard index={1} label="Online" value={online} />
        <StatCard index={2} label="Needs Attention" value={attn} tone={attn > 0 ? "danger" : "default"} />
      </section>

      <section className="sn-section">
        <div className="sn-section-head">
          <div>
            <h2 className="sn-section-title">Node Health</h2>
            <p className="sn-section-desc">Operational state of central and store replication engines</p>
          </div>

          <span className="sn-count-badge">{total} nodes</span>
        </div>

        <div className="sn-node-grid">
          {nodes.map((node, i) => {
            const effectiveStatus = getEffectiveNodeStatus(node);
            const tone = STATUS_TONE[effectiveStatus.toLowerCase()] ?? "default";

            return (
              <article
                key={node.nodeId}
                className={`sn-node-card sn-node-${tone}`}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <div className="sn-node-head">
                  <div className="sn-node-id-block">
                    <div className="sn-node-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                        <circle cx="7" cy="7" r="2.5" fill="currentColor" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="sn-node-id">{node.nodeId}</h3>
                      <p className="sn-node-host">{node.host}</p>
                    </div>
                  </div>

                  <NodeStatus status={effectiveStatus} />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 14
                  }}
                >
                  <ActionButton onClick={() => restartNode(node.nodeId)} disabled={Boolean(restartingNodeIds[node.nodeId])}>
                    {restartingNodeIds[node.nodeId] ? "Restarting..." : `Restart ${node.nodeId}`}
                  </ActionButton>

                  {node.containerStatus ? (
                    <div
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        padding: "8px 12px",
                        color: "#cbd5e1",
                        fontSize: 11,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        background: "rgba(255,255,255,0.03)"
                      }}
                    >
                      Container: {node.containerStatus}
                    </div>
                  ) : null}
                </div>

                <div className="sn-node-meta">
                  <div className="sn-meta-item">
                    <span>Group</span>
                    <strong>{node.groupId}</strong>
                  </div>

                  <div className="sn-meta-item">
                    <span>Registration</span>
                    <strong className={node.registrationStatus === "Registered" ? "sn-ok" : "sn-warn-text"}>
                      {node.registrationStatus}
                    </strong>
                  </div>

                  <div className="sn-meta-item sn-meta-wide">
                    <span>Security Token</span>
                    <strong className="sn-mono sn-token">{node.securityToken}</strong>
                  </div>

                  <div className="sn-meta-item">
                    <span>Last Seen</span>
                    <strong className="sn-mono">{formatTime(node.lastSeen)}</strong>
                  </div>

                  <div className="sn-meta-item">
                    <span>Pending Batches</span>
                    <strong className={node.pendingBatches > 0 ? "sn-warn-text" : ""}>
                      {node.pendingBatches}
                    </strong>
                  </div>
                </div>

                <div className="sn-node-latency">
                  <div className="sn-lat-row">
                    <span className="sn-lat-label">Pull</span>
                    <LatencyBar ms={node.pullMs} />
                  </div>

                  <div className="sn-lat-row">
                    <span className="sn-lat-label">Push</span>
                    <LatencyBar ms={node.pushMs} />
                  </div>
                </div>

                {node.notes && (
                  <div className="sn-node-notes">
                    <span className="sn-notes-label">Notes</span>
                    <p>{node.notes}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="sn-section"
        style={{
          marginTop: 18
        }}
      >
        <div className="sn-section-head">
          <div>
            <h2 className="sn-section-title">Live Replication Activity</h2>
            <p className="sn-section-desc">
              Recent batch movement and replication events flowing through the sync network
            </p>
          </div>

          <span className="sn-count-badge">{activity.length} events</span>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12
          }}
        >
          {activity.length > 0 ? (
            activity.map((item) => <ActivityItem key={item.id} item={item} />)
          ) : (
            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: 18,
                color: "#94a3b8",
                fontSize: 14
              }}
            >
              No activity detected yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}