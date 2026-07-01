import { Navigate, Route, Routes } from "react-router-dom";

import AdminsPage from "@/src/pages/admins";
import AISettingsPage from "@/src/pages/ai-settings";
import DashboardPage from "@/src/pages/dashboard";
import LoginPage from "@/src/pages/login";
import SettingsPage from "@/src/pages/settings";
import TelegramPage from "@/src/pages/telegram";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/leads/:id" element={<Navigate to="/dashboard" replace />} />
      <Route path="/ai-settings" element={<AISettingsPage />} />
      <Route path="/telegram" element={<TelegramPage />} />
      <Route path="/admins" element={<AdminsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
