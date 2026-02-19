import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVehicleStore } from "../store/vehicleStore";
import type { VehicleStatus } from "../types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "out_of_service", label: "Out of Service" },
  { value: "sold", label: "Sold" },
];

const statusColor: Record<VehicleStatus, string> = {
  active: "#16a34a",
  maintenance: "#ca8a04",
  out_of_service: "#dc2626",
  sold: "#6b7280",
};

export default function VehiclesPage() {
  const { vehicles, totalCount, loading, error, fetchVehicles, deleteVehicle, clearError } =
    useVehicleStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchVehicles({ search: search || undefined, status: status || undefined, page });
  }, [fetchVehicles, search, status, page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this vehicle?")) return;
    await deleteVehicle(id);
    fetchVehicles({ search: search || undefined, status: status || undefined, page });
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Vehicles</h1>
        <button onClick={() => navigate("/vehicles/new")}>+ Add Vehicle</button>
      </div>

      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={clearError} type="button">&times;</button>
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
        <input
          type="search"
          placeholder="Search make, model, plate…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          aria-label="Search vehicles"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading…</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Vehicle</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Plate</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Mileage</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Driver</th>
            <th style={{ textAlign: "right", padding: "0.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id} style={{ borderTop: "1px solid #e5e7eb" }}>
              <td style={{ padding: "0.5rem" }}>
                <Link to={`/vehicles/${v.id}`}>{v.year} {v.make} {v.model}</Link>
              </td>
              <td style={{ padding: "0.5rem" }}>{v.license_plate}</td>
              <td style={{ padding: "0.5rem" }}>
                <span
                  style={{
                    color: "#fff",
                    background: statusColor[v.status],
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                  }}
                >
                  {v.status.replace("_", " ")}
                </span>
              </td>
              <td style={{ padding: "0.5rem" }}>{v.current_mileage.toLocaleString()} km</td>
              <td style={{ padding: "0.5rem" }}>{v.assigned_driver_email ?? "—"}</td>
              <td style={{ padding: "0.5rem", textAlign: "right" }}>
                <button onClick={() => navigate(`/vehicles/${v.id}/edit`)} style={{ marginRight: "0.5rem" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(v.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!loading && vehicles.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>
                No vehicles found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
