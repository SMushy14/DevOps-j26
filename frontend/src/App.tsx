import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, GuestOnly } from "./components/RouteGuards";
import { AppLayout } from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import VehiclesPage from "./pages/VehiclesPage";
import VehicleFormPage from "./pages/VehicleFormPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerFormPage from "./pages/CustomerFormPage";

function DashboardPlaceholder() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      <p className="text-text-secondary mt-2">Welcome to FleeMa Fleet Management</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Guest-only routes */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Auth-required routes with AppLayout */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout><Navigate to="/dashboard" replace /></AppLayout>}>
          <Route path="/" element={null} />
        </Route>
        <Route path="/dashboard" element={<AppLayout><DashboardPlaceholder /></AppLayout>} />
        <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
        <Route path="/vehicles" element={<AppLayout><VehiclesPage /></AppLayout>} />
        <Route path="/vehicles/new" element={<AppLayout><VehicleFormPage /></AppLayout>} />
        <Route path="/vehicles/:id" element={<AppLayout><VehicleDetailPage /></AppLayout>} />
        <Route path="/vehicles/:id/edit" element={<AppLayout><VehicleFormPage /></AppLayout>} />
        <Route path="/customers" element={<AppLayout><CustomersPage /></AppLayout>} />
        <Route path="/customers/new" element={<AppLayout><CustomerFormPage /></AppLayout>} />
        <Route path="/customers/:id/edit" element={<AppLayout><CustomerFormPage /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><div>Reports - Coming Soon</div></AppLayout>} />
        <Route path="/settings" element={<AppLayout><div>Settings - Coming Soon</div></AppLayout>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
