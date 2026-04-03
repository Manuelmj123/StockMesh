import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
  return (
    <div className="as-root">
      <Sidebar />
      <div className="as-content-wrap">
        <main className="as-main">{children}</main>
      </div>
    </div>
  );
}