import { NavLink } from "react-router-dom";

const NAV = [
  {
    to: "/",
    end: true,
    label: "Inventory Dashboard",
    desc: "Stock & sync overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    to: "/nodes",
    end: false,
    label: "Connected Nodes",
    desc: "SymmetricDS health",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8"  cy="8"  r="2.2" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="8"  cy="2"  r="1.4" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="8"  cy="14" r="1.4" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="2"  cy="8"  r="1.4" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="14" cy="8"  r="1.4" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="8" y1="3.4" x2="8" y2="5.8" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="8" y1="10.2" x2="8" y2="12.6" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="3.4" y1="8" x2="5.8" y2="8" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="10.2" y1="8" x2="12.6" y2="8" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    ),
  },
  {
    to: "/inventory-report",
    end: false,
    label: "Inventory Report",
    desc: "Full inventory dataset",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.3"/>
        <line x1="4" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="4" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  return (
    <aside className="sb-root">

      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-logo">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="7.5" height="7.5" rx="2" fill="currentColor" opacity="0.9"/>
            <rect x="11.5" y="1" width="7.5" height="7.5" rx="2" fill="currentColor" opacity="0.55"/>
            <rect x="1" y="11.5" width="7.5" height="7.5" rx="2" fill="currentColor" opacity="0.55"/>
            <rect x="11.5" y="11.5" width="7.5" height="7.5" rx="2" fill="currentColor" opacity="0.3"/>
          </svg>
        </div>
        <div className="sb-brand-text">
          <span className="sb-brand-name">StockMesh</span>
          <span className="sb-brand-sub">Inventory Sync Platform</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        <span className="sb-nav-label">Navigation</span>
        {NAV.map(({ to, end, label, desc, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sb-link${isActive ? " sb-link-active" : ""}`}
          >
            <span className="sb-link-icon">{icon}</span>
            <span className="sb-link-text">
              <span className="sb-link-name">{label}</span>
              <span className="sb-link-desc">{desc}</span>
            </span>
            <span className="sb-link-arrow">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="sb-spacer" />

      {/* Footer */}
      <div className="sb-footer">
        <div className="sb-status">
          <span className="sb-status-dot" />
          <span className="sb-status-pulse" />
          System Online
        </div>
        <div className="sb-tags">
          <span>Dockerized</span>
          <span>Modular</span>
          <span>Event-Driven</span>
        </div>
        <div className="sb-version">v2.4.1 — StockMesh Core</div>
      </div>
    </aside>
  );
}