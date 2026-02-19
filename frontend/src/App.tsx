import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, GuestOnly } from "./components/RouteGuards";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import VehiclesPage from "./pages/VehiclesPage";
import VehicleFormPage from "./pages/VehicleFormPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerFormPage from "./pages/CustomerFormPage";

function DashboardPlaceholder() {
  return <h1>FleeMa — Dashboard</h1>;
}

function App() {
  return (
    <Routes>
      {/* Guest-only routes */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Auth-required routes */}
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/new" element={<VehicleFormPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/new" element={<CustomerFormPage />} />
        <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
