import { symmetricNodes } from "../data/mockData";

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
  if (!ms) return <span className="sn-na">N/A</span>;
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
  const s = status.toLowerCase();
  return (
    <span className={`sn-status sn-status-${s}`}>
      <span className="sn-status-dot" />
      {status}
    </span>
  );
}

const STATUS_TONE = { online: "default", warning: "warning", offline: "danger" };

export default function NodesPage() {
  const total   = symmetricNodes.length;
  const online  = symmetricNodes.filter(n => n.status === "Online").length;
  const attn    = symmetricNodes.filter(n => n.status === "Warning" || n.status === "Offline").length;

  return (
    <div className="sn-root">

      {/* ── Hero ── */}
      <header className="sn-hero">
        <div>
          <span className="sn-eyebrow">SymmetricDS Monitoring</span>
          <h1 className="sn-hero-title">
            Replication <span className="sn-hero-accent">Node Health</span>
          </h1>
          <p className="sn-hero-sub">
            Registration state, connectivity, latency, and pending batch activity
            for every node in the StockMesh network.
          </p>
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

      {/* ── Stat Row ── */}
      <section className="sn-stats-row">
        <StatCard index={0} label="Total Nodes"           value={total}  />
        <StatCard index={1} label="Online"                value={online} tone="default" />
        <StatCard index={2} label="Needs Attention"       value={attn}   tone={attn > 0 ? "danger" : "default"} />
      </section>

      {/* ── Node Grid ── */}
      <section className="sn-section">
        <div className="sn-section-head">
          <div>
            <h2 className="sn-section-title">Node Health</h2>
            <p className="sn-section-desc">Operational state of central and store replication engines</p>
          </div>
          <span className="sn-count-badge">{total} nodes</span>
        </div>

        <div className="sn-node-grid">
          {symmetricNodes.map((node, i) => {
            const tone = STATUS_TONE[node.status.toLowerCase()] ?? "default";
            return (
              <article
                key={node.nodeId}
                className={`sn-node-card sn-node-${tone}`}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                {/* Card Header */}
                <div className="sn-node-head">
                  <div className="sn-node-id-block">
                    <div className="sn-node-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="7" cy="7" r="2.5" fill="currentColor"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="sn-node-id">{node.nodeId}</h3>
                      <p className="sn-node-host">{node.host}</p>
                    </div>
                  </div>
                  <NodeStatus status={node.status} />
                </div>

                {/* Meta Grid */}
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
                    <strong className="sn-mono">{node.lastSeen}</strong>
                  </div>
                  <div className="sn-meta-item">
                    <span>Pending Batches</span>
                    <strong className={node.pendingBatches > 0 ? "sn-warn-text" : ""}>
                      {node.pendingBatches}
                    </strong>
                  </div>
                </div>

                {/* Latency */}
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

                {/* Notes */}
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
    </div>
  );
}