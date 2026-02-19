import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerStore } from "../store/customerStore";
import type { CustomerType } from "../types";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
];

const typeIcon: Record<CustomerType, string> = {
  individual: "👤",
  business: "🏢",
};

export default function CustomersPage() {
  const { customers, totalCount, loading, error, fetchCustomers, deleteCustomer, clearError } =
    useCustomerStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCustomers({
      search: search || undefined,
      customer_type: customerType || undefined,
      page,
    });
  }, [fetchCustomers, search, customerType, page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this customer?")) return;
    await deleteCustomer(id);
    fetchCustomers({ search: search || undefined, customer_type: customerType || undefined, page });
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Customers</h1>
        <button onClick={() => navigate("/customers/new")}>+ Add Customer</button>
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
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          aria-label="Search customers"
        />
        <select
          value={customerType}
          onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
          aria-label="Filter by type"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading…</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Name</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Type</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Email</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Phone</th>
            <th style={{ textAlign: "right", padding: "0.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} style={{ borderTop: "1px solid #e5e7eb" }}>
              <td style={{ padding: "0.5rem" }}>
                {typeIcon[c.customer_type]} {c.name}
              </td>
              <td style={{ padding: "0.5rem" }}>{c.customer_type}</td>
              <td style={{ padding: "0.5rem" }}>{c.email || "—"}</td>
              <td style={{ padding: "0.5rem" }}>{c.phone || "—"}</td>
              <td style={{ padding: "0.5rem", textAlign: "right" }}>
                <button onClick={() => navigate(`/customers/${c.id}/edit`)} style={{ marginRight: "0.5rem" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!loading && customers.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "2rem", textAlign: "center" }}>
                No customers found.
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
