import { useMemo, useState } from "react";
import { locationInventory } from "../data/mockData";

function MiniBar({ value, max, tone = "default" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="ir-minibar">
      <div className={`ir-minibar-fill ir-minibar-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const SAMPLE_INVENTORY_ITEMS = [
  { id: "itm-001", name: "Shirt", category: "Apparel", sku: "APP-1001", locationId: "store-001", locationName: "Fort Lauderdale East", city: "Fort Lauderdale, FL", quantity: 180, lowStockThreshold: 35, unitPrice: 18.99 },
  { id: "itm-002", name: "Chips", category: "Snacks", sku: "SNK-2001", locationId: "store-001", locationName: "Fort Lauderdale East", city: "Fort Lauderdale, FL", quantity: 64, lowStockThreshold: 24, unitPrice: 2.49 },
  { id: "itm-003", name: "Soda", category: "Beverages", sku: "BEV-3001", locationId: "store-001", locationName: "Fort Lauderdale East", city: "Fort Lauderdale, FL", quantity: 92, lowStockThreshold: 20, unitPrice: 1.99 },

  { id: "itm-004", name: "Shirt", category: "Apparel", sku: "APP-1001", locationId: "store-002", locationName: "Miami Central", city: "Miami, FL", quantity: 128, lowStockThreshold: 35, unitPrice: 18.99 },
  { id: "itm-005", name: "Chips", category: "Snacks", sku: "SNK-2001", locationId: "store-002", locationName: "Miami Central", city: "Miami, FL", quantity: 18, lowStockThreshold: 24, unitPrice: 2.49 },
  { id: "itm-006", name: "Soda", category: "Beverages", sku: "BEV-3001", locationId: "store-002", locationName: "Miami Central", city: "Miami, FL", quantity: 0, lowStockThreshold: 20, unitPrice: 1.99 },

  { id: "itm-007", name: "Shirt", category: "Apparel", sku: "APP-1001", locationId: "store-003", locationName: "Orlando North", city: "Orlando, FL", quantity: 76, lowStockThreshold: 35, unitPrice: 18.99 },
  { id: "itm-008", name: "Chips", category: "Snacks", sku: "SNK-2001", locationId: "store-003", locationName: "Orlando North", city: "Orlando, FL", quantity: 42, lowStockThreshold: 24, unitPrice: 2.49 },
  { id: "itm-009", name: "Soda", category: "Beverages", sku: "BEV-3001", locationId: "store-003", locationName: "Orlando North", city: "Orlando, FL", quantity: 14, lowStockThreshold: 20, unitPrice: 1.99 },

  { id: "itm-010", name: "Shirt", category: "Apparel", sku: "APP-1001", locationId: "store-004", locationName: "Tampa South", city: "Tampa, FL", quantity: 210, lowStockThreshold: 35, unitPrice: 18.99 },
  { id: "itm-011", name: "Chips", category: "Snacks", sku: "SNK-2001", locationId: "store-004", locationName: "Tampa South", city: "Tampa, FL", quantity: 27, lowStockThreshold: 24, unitPrice: 2.49 },
  { id: "itm-012", name: "Soda", category: "Beverages", sku: "BEV-3001", locationId: "store-004", locationName: "Tampa South", city: "Tampa, FL", quantity: 58, lowStockThreshold: 20, unitPrice: 1.99 },
];

export default function InventoryReportPage() {
  const [selectedLocation, setSelectedLocation] = useState("all");

  const locationOptions = useMemo(() => {
    const fromMock = locationInventory.map((loc) => ({
      locationId: loc.locationId,
      locationName: loc.locationName,
      city: loc.city,
    }));

    const merged = new Map();

    fromMock.forEach((loc) => {
      merged.set(loc.locationId, loc);
    });

    SAMPLE_INVENTORY_ITEMS.forEach((item) => {
      if (!merged.has(item.locationId)) {
        merged.set(item.locationId, {
          locationId: item.locationId,
          locationName: item.locationName,
          city: item.city,
        });
      }
    });

    return Array.from(merged.values());
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedLocation === "all") return SAMPLE_INVENTORY_ITEMS;
    return SAMPLE_INVENTORY_ITEMS.filter((item) => item.locationId === selectedLocation);
  }, [selectedLocation]);

  const totalUnits = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalSkus = new Set(filteredItems.map((item) => item.sku)).size;
  const totalLow = filteredItems.filter(
    (item) => item.quantity > 0 && item.quantity <= item.lowStockThreshold
  ).length;
  const totalOut = filteredItems.filter((item) => item.quantity === 0).length;
  const totalLocations =
    selectedLocation === "all"
      ? new Set(filteredItems.map((item) => item.locationId)).size
      : filteredItems.length > 0
      ? 1
      : 0;
  const maxUnits = Math.max(...filteredItems.map((item) => item.quantity), 0);

  const now = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="ir-root">
      <header className="ir-hero">
        <div className="ir-hero-left">
          <span className="ir-eyebrow">Inventory Reporting</span>
          <h1 className="ir-hero-title">
            Master Inventory
            <span className="ir-hero-accent"> Report</span>
          </h1>
          <p className="ir-hero-sub">
            Complete inventory visibility across all connected locations.
            Export-ready overview for operational and executive reporting.
          </p>
        </div>

        <div className="ir-hero-right">
          <div className="ir-hero-panel">
            <div className="ir-panel-row">
              <div className="ir-panel-metric">
                <strong>{totalLocations}</strong>
                <span>Locations</span>
              </div>
              <div className="ir-panel-divider" />
              <div className="ir-panel-metric">
                <strong>{totalSkus.toLocaleString()}</strong>
                <span>SKUs</span>
              </div>
              <div className="ir-panel-divider" />
              <div className="ir-panel-metric">
                <strong>{totalUnits.toLocaleString()}</strong>
                <span>Units</span>
              </div>
            </div>
            <div className="ir-panel-label">Report Summary</div>
          </div>

          <div className="ir-export-row">
            <button className="ir-btn ir-btn-ghost">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v8M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 10.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Export CSV
            </button>
            <button className="ir-btn ir-btn-gold">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1.5" y="1.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 5h5M4 7h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Print Report
            </button>
            <div className="ir-timestamp">Generated {now}</div>
          </div>
        </div>
      </header>

      <section className="ir-stats">
        {[
          { label: "Total Units", value: totalUnits.toLocaleString(), meta: "Across selected locations", tone: "default" },
          { label: "Tracked SKUs", value: totalSkus.toLocaleString(), meta: "Unique products", tone: "default" },
          { label: "Low Stock", value: totalLow, meta: "Need replenishment", tone: "warning" },
          { label: "Out of Stock", value: totalOut, meta: "Immediate action", tone: "danger" },
        ].map(({ label, value, meta, tone }, i) => (
          <div key={label} className={`ir-stat ir-tone-${tone}`} style={{ animationDelay: `${i * 70}ms` }}>
            <div className="ir-stat-label">{label}</div>
            <div className="ir-stat-value">{value}</div>
            <div className="ir-stat-meta">{meta}</div>
            <div className="ir-stat-corner" />
          </div>
        ))}
      </section>

      <section className="ir-card">
        <div className="ir-card-head">
          <div>
            <h2 className="ir-card-title">Inventory Report</h2>
            <p className="ir-card-desc">Consolidated item-level dataset across all nodes</p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <span className="ir-badge">{filteredItems.length} items</span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-mid)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Location
              </span>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  background: "var(--bg-4)",
                  color: "var(--text-hi)",
                  border: "1px solid var(--border-hi)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  minWidth: "230px",
                  outline: "none",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                }}
              >
                <option value="all">All Locations</option>
                {locationOptions.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {loc.locationName} — {loc.city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="ir-table-scroll">
          <table className="ir-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Location</th>
                <th>City</th>
                <th>Units</th>
                <th>Distribution</th>
                <th>Low Threshold</th>
                <th>Status</th>
                <th>Unit Price</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((item, i) => {
                const isOut = item.quantity === 0;
                const isLow = item.quantity > 0 && item.quantity <= item.lowStockThreshold;

                return (
                  <tr key={item.id} style={{ animationDelay: `${i * 35}ms` }}>
                    <td className="ir-td-idx">{String(i + 1).padStart(2, "0")}</td>
                    <td className="ir-td-name">{item.name}</td>
                    <td>{item.category}</td>
                    <td className="ir-td-mono">{item.sku}</td>
                    <td>{item.locationName}</td>
                    <td>{item.city}</td>
                    <td className="ir-td-units">{item.quantity.toLocaleString()}</td>
                    <td className="ir-td-bar">
                      <MiniBar
                        value={item.quantity}
                        max={maxUnits}
                        tone={isOut ? "danger" : isLow ? "warning" : "gold"}
                      />
                    </td>
                    <td>{item.lowStockThreshold}</td>
                    <td>
                      <span
                        className={
                          isOut ? "ir-num-danger" : isLow ? "ir-num-warn" : "ir-num-zero"
                        }
                      >
                        {isOut ? "Out" : isLow ? "Low" : "Healthy"}
                      </span>
                    </td>
                    <td className="ir-td-mono">${item.unitPrice.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="ir-totals-row">
                <td />
                <td className="ir-totals-label">Totals</td>
                <td />
                <td>{totalSkus.toLocaleString()}</td>
                <td>{selectedLocation === "all" ? `${totalLocations} locations` : "Filtered"}</td>
                <td />
                <td className="ir-td-units">{totalUnits.toLocaleString()}</td>
                <td />
                <td />
                <td>
                  <span className={totalOut > 0 ? "ir-num-danger" : totalLow > 0 ? "ir-num-warn" : "ir-num-zero"}>
                    {totalOut > 0 ? `${totalOut} Out` : totalLow > 0 ? `${totalLow} Low` : "Healthy"}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}