import { useCallback, useEffect, useMemo, useState } from "react";
import * as signalR from "@microsoft/signalr";

const SIGNALR_BASE_URL = import.meta.env.VITE_SIGNALR_BASE_URL || "http://localhost:5001";

function MiniBar({ value, max, tone = "default" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="ir-minibar">
      <div className={`ir-minibar-fill ir-minibar-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function formatCurrency(value) {
  const numericValue = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(numericValue);
}

function formatTimestamp(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function normalizeInventoryItem(item) {
  return {
    inventoryId: Number(item.inventoryId ?? item.inventory_id ?? 0),
    sku: String(item.sku ?? "").trim(),
    itemName: String(item.itemName ?? item.item_name ?? "").trim(),
    quantityOnHand: Number(item.quantityOnHand ?? item.quantity_on_hand ?? 0),
    unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
    updatedAt: item.updatedAt ?? item.updated_at ?? null
  };
}

function getInventoryTone(item) {
  if (item.quantityOnHand <= 0) {
    return "danger";
  }

  if (item.quantityOnHand <= 10) {
    return "warning";
  }

  return "gold";
}

export default function InventoryReportPage() {
  const [items, setItems] = useState([]);
  const [hubState, setHubState] = useState("Connecting");
  const [isLoading, setIsLoading] = useState(true);

  const loadInventory = useCallback(async () => {
    const response = await fetch(`${SIGNALR_BASE_URL}/api/inventory-report`);

    if (!response.ok) {
      throw new Error(`Failed to load inventory report: ${response.status}`);
    }

    const payload = await response.json();
    const normalized = Array.isArray(payload)
      ? payload.map(normalizeInventoryItem).sort((a, b) => a.sku.localeCompare(b.sku))
      : [];

    setItems(normalized);
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadInventory()
      .catch((error) => {
        console.error("Failed to load inventory report", error);

        if (isMounted) {
          setItems([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loadInventory]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_BASE_URL}/hubs/inventory-monitor`)
      .withAutomaticReconnect()
      .build();

    connection.on("InitialInventorySnapshot", (snapshot) => {
      if (!Array.isArray(snapshot)) {
        return;
      }

      setItems(
        snapshot
          .map(normalizeInventoryItem)
          .sort((a, b) => a.sku.localeCompare(b.sku))
      );
    });

    connection.on("InventoryItemUpserted", (item) => {
      const normalized = normalizeInventoryItem(item);

      setItems((current) => {
        const existingIndex = current.findIndex(
          (existingItem) => existingItem.sku === normalized.sku
        );

        if (existingIndex === -1) {
          return [...current, normalized].sort((a, b) => a.sku.localeCompare(b.sku));
        }

        const next = [...current];
        next[existingIndex] = {
          ...next[existingIndex],
          ...normalized
        };

        return next.sort((a, b) => a.sku.localeCompare(b.sku));
      });
    });

    connection.onreconnecting(() => {
      setHubState("Reconnecting");
    });

    connection.onreconnected(() => {
      setHubState("Connected");
    });

    connection.onclose(() => {
      setHubState("Disconnected");
    });

    connection
      .start()
      .then(() => {
        setHubState("Connected");
      })
      .catch((error) => {
        console.error("Inventory realtime connection failed", error);
        setHubState("Disconnected");
      });

    const fallbackInterval = setInterval(() => {
      loadInventory().catch((error) => {
        console.error("Inventory fallback refresh failed", error);
      });
    }, 10000);

    return () => {
      clearInterval(fallbackInterval);
      connection.stop().catch((error) => {
        console.error("Failed to stop inventory realtime connection", error);
      });
    };
  }, [loadInventory]);

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantityOnHand, 0),
    [items]
  );

  const totalSkus = items.length;

  const lowStockCount = useMemo(
    () => items.filter((item) => item.quantityOnHand > 0 && item.quantityOnHand <= 10).length,
    [items]
  );

  const outOfStockCount = useMemo(
    () => items.filter((item) => item.quantityOnHand <= 0).length,
    [items]
  );

  const totalInventoryValue = useMemo(
    () => items.reduce((sum, item) => sum + item.quantityOnHand * item.unitPrice, 0),
    [items]
  );

  const maxUnits = useMemo(
    () => Math.max(...items.map((item) => item.quantityOnHand), 0),
    [items]
  );

  const latestUpdatedAt = useMemo(() => {
    if (items.length === 0) {
      return null;
    }

    const sorted = [...items]
      .filter((item) => item.updatedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return sorted[0]?.updatedAt ?? null;
  }, [items]);

  const now = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const exportCsv = useCallback(() => {
    const headers = [
      "InventoryId",
      "SKU",
      "ItemName",
      "QuantityOnHand",
      "UnitPrice",
      "UpdatedAt"
    ];

    const rows = items.map((item) => [
      item.inventoryId,
      item.sku,
      item.itemName,
      item.quantityOnHand,
      item.unitPrice,
      item.updatedAt ?? ""
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "inventory-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [items]);

  return (
    <div className="ir-root">
      <header className="ir-hero">
        <div className="ir-hero-left">
          <span className="ir-eyebrow">Inventory Reporting</span>
          <h1 className="ir-hero-title">
            Dashboard Inventory
            <span className="ir-hero-accent"> Mirror</span>
          </h1>
          <p className="ir-hero-sub">
            Live inventory flowing into the dashboard database from the StockMesh replication pipeline.
          </p>
        </div>

        <div className="ir-hero-right">
          <div className="ir-hero-panel">
            <div className="ir-panel-row">
              <div className="ir-panel-metric">
                <strong>{totalSkus.toLocaleString()}</strong>
                <span>SKUs</span>
              </div>
              <div className="ir-panel-divider" />
              <div className="ir-panel-metric">
                <strong>{totalUnits.toLocaleString()}</strong>
                <span>Units</span>
              </div>
              <div className="ir-panel-divider" />
              <div className="ir-panel-metric">
                <strong>{formatCurrency(totalInventoryValue)}</strong>
                <span>Inventory Value</span>
              </div>
            </div>
            <div className="ir-panel-label">Realtime Dashboard Snapshot</div>
          </div>

          <div className="ir-export-row">
            <button className="ir-btn ir-btn-ghost" onClick={exportCsv} disabled={items.length === 0}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v8M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 10.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Export CSV
            </button>

            <button className="ir-btn ir-btn-gold" onClick={() => window.print()}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1.5" y="1.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 5h5M4 7h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Print Report
            </button>

            <div className="ir-timestamp">
              Generated {now} · Hub {hubState}
            </div>
          </div>
        </div>
      </header>

      <section className="ir-stats">
        {[
          { label: "Tracked SKUs", value: totalSkus.toLocaleString(), meta: "Dashboard database records", tone: "default" },
          { label: "Total Units", value: totalUnits.toLocaleString(), meta: "Mirrored from replication", tone: "default" },
          { label: "Low Stock", value: lowStockCount.toLocaleString(), meta: "10 units or fewer", tone: "warning" },
          { label: "Out of Stock", value: outOfStockCount.toLocaleString(), meta: "Immediate attention", tone: "danger" }
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
            <p className="ir-card-desc">
              Live records persisted in the dashboard database and updated by the realtime hub consumer
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "flex-end"
            }}
          >
            <span className="ir-badge">{items.length} items</span>
            <span className="ir-badge">
              {latestUpdatedAt ? `Last update ${formatTimestamp(latestUpdatedAt)}` : "No updates yet"}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--text-mid)",
              fontSize: "14px"
            }}
          >
            Loading inventory snapshot...
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: "56px 24px",
              display: "grid",
              gap: "12px",
              textAlign: "center",
              color: "var(--text-mid)"
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text-hi)"
              }}
            >
              No inventory records yet
            </div>
            <div style={{ fontSize: "13px", maxWidth: "640px", margin: "0 auto" }}>
              As soon as replicated inventory arrives in the dashboard database through RabbitMQ and the realtime hub,
              it will appear here automatically without refreshing the page.
            </div>
          </div>
        ) : (
          <div className="ir-table-scroll">
            <table className="ir-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>SKU</th>
                  <th>Units</th>
                  <th>Distribution</th>
                  <th>Status</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Updated</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, i) => {
                  const tone = getInventoryTone(item);
                  const isOut = item.quantityOnHand <= 0;
                  const isLow = item.quantityOnHand > 0 && item.quantityOnHand <= 10;

                  return (
                    <tr key={item.sku} style={{ animationDelay: `${i * 35}ms` }}>
                      <td className="ir-td-idx">{String(i + 1).padStart(2, "0")}</td>
                      <td className="ir-td-name">{item.itemName}</td>
                      <td className="ir-td-mono">{item.sku}</td>
                      <td className="ir-td-units">{item.quantityOnHand.toLocaleString()}</td>
                      <td className="ir-td-bar">
                        <MiniBar
                          value={item.quantityOnHand}
                          max={maxUnits}
                          tone={tone}
                        />
                      </td>
                      <td>
                        <span
                          className={
                            isOut ? "ir-num-danger" : isLow ? "ir-num-warn" : "ir-num-zero"
                          }
                        >
                          {isOut ? "Out" : isLow ? "Low" : "Healthy"}
                        </span>
                      </td>
                      <td className="ir-td-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="ir-td-mono">{formatCurrency(item.quantityOnHand * item.unitPrice)}</td>
                      <td className="ir-td-mono">{formatTimestamp(item.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="ir-totals-row">
                  <td />
                  <td className="ir-totals-label">Totals</td>
                  <td>{totalSkus.toLocaleString()} SKUs</td>
                  <td className="ir-td-units">{totalUnits.toLocaleString()}</td>
                  <td />
                  <td>
                    <span className={outOfStockCount > 0 ? "ir-num-danger" : lowStockCount > 0 ? "ir-num-warn" : "ir-num-zero"}>
                      {outOfStockCount > 0 ? `${outOfStockCount} Out` : lowStockCount > 0 ? `${lowStockCount} Low` : "Healthy"}
                    </span>
                  </td>
                  <td />
                  <td className="ir-td-mono">{formatCurrency(totalInventoryValue)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}