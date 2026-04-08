import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import NodesPage from "./pages/NodesPage";
import "./App.css";
import InventoryReportPage from "./pages/InventoryReportPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/nodes" element={<NodesPage />} />
        <Route path="/" element={<InventoryReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}