import {
    inventoryAlerts,
    inventoryOverview,
    locationInventory,
    topMovingInventory,
  } from "../data/mockData";
  
  function OverviewCard({ title, value, meta, tone = "default", index = 0 }) {
    return (
      <div
        className={`sm-overview-card sm-tone-${tone}`}
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="sm-overview-card-inner">
          <div className="sm-overview-label">{title}</div>
          <div className="sm-overview-value">{value}</div>
          <div className="sm-overview-meta">{meta}</div>
          <div className="sm-overview-corner" />
        </div>
      </div>
    );
  }
  
  function SyncDot({ status }) {
    const s = status.toLowerCase();
    return (
      <span className={`sm-sync-dot-wrap sm-sync-${s}`}>
        <span className="sm-sync-dot" />
        {status}
      </span>
    );
  }
  
  export default function DashboardPage() {
    return (
      <div className="sm-root">
        {/* ── Hero ── */}
        <header className="sm-hero">
          <div className="sm-hero-left">
            <span className="sm-eyebrow">Central Inventory View</span>
            <h1 className="sm-hero-title">
              Full-Spectrum <br />
              <span className="sm-hero-accent">Inventory Intelligence</span>
            </h1>
            <p className="sm-hero-sub">
              Monitor volume, low-stock risk, replication health, and store-level
              behavior — unified across every connected location.
            </p>
          </div>
  
          <div className="sm-hero-panel">
            <div className="sm-panel-sync">
              <span className="sm-pulse-ring" />
              <span className="sm-pulse-dot" />
              <span>Last Sync — {inventoryOverview.lastSyncTime}</span>
            </div>
            <div className="sm-panel-metrics">
              <div className="sm-panel-metric">
                <strong>{inventoryOverview.syncingLocations}</strong>
                <span>Healthy</span>
              </div>
              <div className="sm-panel-divider" />
              <div className="sm-panel-metric">
                <strong>{inventoryOverview.totalLocations}</strong>
                <span>Total</span>
              </div>
            </div>
            <div className="sm-panel-label">LOCATIONS</div>
          </div>
        </header>
  
        {/* ── Overview Cards ── */}
        <section className="sm-cards-grid">
          <OverviewCard
            index={0}
            title="Total Inventory Units"
            value={inventoryOverview.totalUnits.toLocaleString()}
            meta="Across all stores"
          />
          <OverviewCard
            index={1}
            title="Tracked SKUs"
            value={inventoryOverview.totalSkuCount.toLocaleString()}
            meta="Unique products"
          />
          <OverviewCard
            index={2}
            title="Low Stock Items"
            value={inventoryOverview.lowStockItems}
            meta="Need replenishment"
            tone="warning"
          />
          <OverviewCard
            index={3}
            title="Out of Stock"
            value={inventoryOverview.outOfStockItems}
            meta="Immediate attention"
            tone="danger"
          />
        </section>
  
        {/* ── Main Content ── */}
        <section className="sm-main-grid">
  
          {/* Inventory Table */}
          <div className="sm-card sm-card-table">
            <div className="sm-card-head">
              <div>
                <h2 className="sm-card-title">Inventory by Location</h2>
                <p className="sm-card-desc">Store-level breakdown of inventory and sync health</p>
              </div>
              <span className="sm-badge">{locationInventory.length} Stores</span>
            </div>
  
            <div className="sm-table-scroll">
              <table className="sm-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Store ID</th>
                    <th>City</th>
                    <th>SKUs</th>
                    <th>Units</th>
                    <th>Low Stock</th>
                    <th>Out</th>
                    <th>Sync</th>
                    <th>Last Replication</th>
                  </tr>
                </thead>
                <tbody>
                  {locationInventory.map((loc, i) => (
                    <tr key={loc.locationId} style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="sm-td-name">{loc.locationName}</td>
                      <td className="sm-td-mono">{loc.locationId}</td>
                      <td>{loc.city}</td>
                      <td>{loc.totalSkus}</td>
                      <td>{loc.totalUnits.toLocaleString()}</td>
                      <td>
                        <span className={loc.lowStock > 0 ? "sm-num-warn" : ""}>{loc.lowStock}</span>
                      </td>
                      <td>
                        <span className={loc.outOfStock > 0 ? "sm-num-danger" : ""}>{loc.outOfStock}</span>
                      </td>
                      <td>
                        <SyncDot status={loc.syncStatus} />
                      </td>
                      <td className="sm-td-time">{loc.lastReplication}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
  
          {/* Sidebar */}
          <aside className="sm-sidebar">
  
            {/* Alerts */}
            <div className="sm-card sm-card-alerts">
              <div className="sm-card-head">
                <div>
                  <h2 className="sm-card-title">Active Alerts</h2>
                  <p className="sm-card-desc">Replication &amp; inventory issues</p>
                </div>
                <span className="sm-badge sm-badge-alert">{inventoryAlerts.length}</span>
              </div>
  
              <ul className="sm-alert-list">
                {inventoryAlerts.map((alert, i) => (
                  <li
                    key={alert.id}
                    className={`sm-alert-item sm-alert-${alert.severity}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="sm-alert-icon">
                      <span className="sm-alert-glyph" />
                    </div>
                    <div className="sm-alert-body">
                      <strong>{alert.title}</strong>
                      <p>{alert.description}</p>
                      <time>{alert.time}</time>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
  
            {/* Top Moving */}
            <div className="sm-card sm-card-movers">
              <div className="sm-card-head">
                <div>
                  <h2 className="sm-card-title">Top Moving</h2>
                  <p className="sm-card-desc">Volume trends across locations</p>
                </div>
              </div>
  
              <ul className="sm-movers-list">
                {topMovingInventory.map((item, i) => (
                  <li
                    key={item.sku}
                    className="sm-mover-item"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="sm-mover-rank">{String(i + 1).padStart(2, "0")}</div>
                    <div className="sm-mover-info">
                      <strong>{item.name}</strong>
                      <span>{item.sku} · {item.category}</span>
                    </div>
                    <div className="sm-mover-stats">
                      <strong>{item.totalUnits}</strong>
                      <span className={item.trend?.startsWith("+") ? "sm-up" : "sm-down"}>
                        {item.trend}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
  
          </aside>
        </section>
      </div>
    );
  }