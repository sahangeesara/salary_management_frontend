import React, { useState, useEffect, useCallback, memo } from "react";
import AllowanceService from "../../service/AllowanceService";
import EmployeeService from "../../service/EmployeeService";
import "./allowance.css";

/* ── Static Constants ── */
const ALLOWANCE_TYPES = ["Transport", "Meal", "Housing", "Medical", "Other"];

const EMPTY_FORM = { employeeId: "", type: "", amount: "" };

const TYPE_CONFIG = {
  Transport: { bg: "#e8f4ff", color: "#2563eb", icon: "bi-bus-front-fill" },
  Meal:      { bg: "#fef3c7", color: "#d97706", icon: "bi-cup-hot-fill"    },
  Housing:   { bg: "#f0fdf4", color: "#16a34a", icon: "bi-house-fill"      },
  Medical:   { bg: "#fdf2f8", color: "#db2777", icon: "bi-heart-pulse-fill"},
  Other:     { bg: "#f3f4f6", color: "#6b7280", icon: "bi-three-dots"      },
};

/* ── Memoized table row ── */
const AllowanceRow = memo(({ allowance, index, onEdit, onDelete, employees }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(allowance.employeeId)
  );
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${allowance.employeeId}`;
  const initials = emp
    ? `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`
    : (String(allowance.employeeId)?.[0] ?? "?");

  const tc = TYPE_CONFIG[allowance.type] ?? TYPE_CONFIG.Other;

  return (
    <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
      <td><span className="allowance-index">{String(index + 1).padStart(2, "0")}</span></td>
      <td>
        <div className="allowance-empid-cell">
          <div className="allowance-avatar">{initials.toUpperCase()}</div>
          <div>
            <div className="allowance-fullname">{empName}</div>
            <div className="allowance-dept-tag">{emp?.department || ""}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="type-pill" style={{ background: tc.bg, color: tc.color }}>
          <i className={`bi ${tc.icon}`} /> {allowance.type || "—"}
        </span>
      </td>
      <td>
        <span className="salary-pill">
          <span className="lkr-label">LKR</span> {Number(allowance.amount || 0).toLocaleString()}
        </span>
      </td>
      <td>
        <div className="action-group">
          <button className="action-btn edit-btn" onClick={() => onEdit(allowance)} title="Edit">
            <i className="bi bi-pencil-fill" />
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(allowance)} title="Delete">
            <i className="bi bi-trash3-fill" />
          </button>
        </div>
      </td>
    </tr>
  );
});

/* ── Delete confirmation modal ── */
const DeleteModal = memo(({ allowance, onConfirm, onCancel, employees }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(allowance?.employeeId)
  );
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${allowance?.employeeId}`;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon"><i className="bi bi-exclamation-triangle-fill" /></div>
        <h5>Delete Allowance?</h5>
        <p>
          Are you sure you want to remove the <strong>{allowance?.type}</strong> allowance for{" "}
          <strong>{empName}</strong> (LKR {Number(allowance?.amount || 0).toLocaleString()})?
        </p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm-delete" onClick={onConfirm}>
            <i className="bi bi-trash3-fill me-1" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
});

/* ── Main Component ── */
function Allowance() {
  const [allowanceList, setAllowanceList] = useState([]);
  const [employees, setEmployees]         = useState([]);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [editingId, setEditingId]         = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [empLoading, setEmpLoading]       = useState(false);
  const [toast, setToast]                 = useState(null);
  const [search, setSearch]               = useState("");

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const fetchAllowanceList = useCallback(() => {
    setLoading(true);
    AllowanceService.getAllAllowance()
      .then((data) => setAllowanceList(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast("Failed to load allowances", "error"); })
      .finally(() => setLoading(false));
  }, [showToast]);

  const fetchEmployees = useCallback(() => {
    setEmpLoading(true);
    EmployeeService.getAllEmployees()
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast("Failed to load employees", "error"); })
      .finally(() => setEmpLoading(false));
  }, [showToast]);

  // Combined fetch in one effect
  useEffect(() => {
    fetchAllowanceList();
    fetchEmployees();
  }, [fetchAllowanceList, fetchEmployees]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((allowance) => {
    setForm({
      employeeId: String(allowance.employeeId ?? ""),
      type:       String(allowance.type       ?? ""),
      amount:     String(allowance.amount     ?? ""),
    });
    setEditingId(allowance.id ?? allowance._id ?? allowance.allowanceId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, amount: Number(form.amount) };
    const action = editingId
      ? AllowanceService.updateAllowance({ ...payload, id: editingId })
      : AllowanceService.createAllowance(payload);

    action
      .then(() => {
        fetchAllowanceList();
        showToast(editingId ? "Allowance updated!" : "Allowance created!");
        handleClear();
      })
      .catch((err) => { console.error(err); showToast("Operation failed", "error"); })
      .finally(() => setLoading(false));
  }, [form, editingId, fetchAllowanceList, showToast, handleClear]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id ?? deleteTarget._id ?? deleteTarget.allowanceId;
    AllowanceService.deleteAllowance(id)
      .then(() => { fetchAllowanceList(); showToast("Allowance deleted"); })
      .catch((err) => { console.error(err); showToast("Delete failed", "error"); })
      .finally(() => setDeleteTarget(null));
  }, [deleteTarget, fetchAllowanceList, showToast]);

  const filtered = allowanceList.filter((a) => {
    const q = search.toLowerCase();
    const emp = employees.find(
      (e) => String(e.id ?? e._id ?? e.employeeId) === String(a.employeeId)
    );
    const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
    return (
      name.includes(q) ||
      String(a.employeeId).toLowerCase().includes(q) ||
      (a.type || "").toLowerCase().includes(q) ||
      String(a.amount).includes(q)
    );
  });

  const selectedEmp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(form.employeeId)
  );

  const selectedTypeConfig = TYPE_CONFIG[form.type];

  return (
    <div className="allowance-page">
      {toast && (
        <div className={`toast-bar ${toast.type}`}>
          <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
          {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          allowance={deleteTarget}
          employees={employees}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="allowance-header">
        <div>
          <h2>
            <i className="bi bi-plus-circle-fill me-2" style={{ color: "#3b62f6" }} />
            Allowance Management
          </h2>
        </div>
        <span className="allowance-count">
          {allowanceList.length} allowance{allowanceList.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="allowance-card">
        <div className="allowance-card-header">
          <div className="card-icon blue"><i className="bi bi-plus-circle-fill" /></div>
          <div>
            <div className="card-title">{editingId ? "Edit Allowance" : "Add New Allowance"}</div>
            <div className="card-subtitle">
              {editingId ? "Update the allowance information" : "Fill in the details below"}
            </div>
          </div>
          <span className={`mode-tag ${editingId ? "edit" : "create"}`}>
            <i className={`bi ${editingId ? "bi-pencil-fill" : "bi-plus-circle-fill"}`} />
            {editingId ? "Edit Mode" : "Create Mode"}
          </span>
        </div>

        <form className="allowance-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label-sm">
                Employee {empLoading && <i className="bi bi-arrow-repeat spin-icon ms-1" />}
              </label>
              <select
                name="employeeId"
                className="allowance-input allowance-select"
                value={form.employeeId}
                onChange={handleChange}
                required
                disabled={empLoading}
              >
                <option value="">— Select Employee —</option>
                {employees.map((emp) => {
                  const id = emp.id ?? emp._id ?? emp.employeeId;
                  return (
                    <option key={id} value={id}>
                      {emp.firstName} {emp.lastName} {emp.department ? ` · ${emp.department}` : ""}
                    </option>
                  );
                })}
              </select>
              {selectedEmp && (
                <div className="emp-chip">
                  <div className="emp-chip-avatar">
                    {selectedEmp.firstName?.[0]}{selectedEmp.lastName?.[0]}
                  </div>
                  <div>
                    <div className="emp-chip-name">{selectedEmp.firstName} {selectedEmp.lastName}</div>
                    <div className="emp-chip-meta">{selectedEmp.designation || selectedEmp.department || ""}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label-sm">Allowance Type</label>
              <select
                name="type"
                className="allowance-input allowance-select"
                value={form.type}
                onChange={handleChange}
                required
              >
                <option value="">— Select Type —</option>
                {ALLOWANCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {selectedTypeConfig && (
                <div className="type-chip" style={{ borderColor: selectedTypeConfig.color + "44", background: selectedTypeConfig.color + "11" }}>
                  <i className={`bi ${selectedTypeConfig.icon}`} style={{ color: selectedTypeConfig.color }} />
                  <span style={{ color: selectedTypeConfig.color, fontWeight: 700 }}>{form.type}</span>
                </div>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label-sm">Amount (LKR)</label>
              <div className="amount-wrap">
                <input
                  type="number"
                  name="amount"
                  className="allowance-input amount-input"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Rs. 0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className={editingId ? "btn-update" : "btn-save"} disabled={loading}>
              <i className={editingId ? "bi bi-check2-circle" : "bi-plus-circle-fill"} />
              {loading ? " Processing..." : editingId ? " Update Allowance" : " Save Allowance"}
            </button>
            <button type="button" className="btn-clear" onClick={handleClear}>
              <i className="bi bi-x-circle" /> Clear
            </button>
          </div>
        </form>
      </div>

      <div className="allowance-card">
        <div className="allowance-card-header" style={{ paddingBottom: "16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="card-icon green"><i className="bi bi-table" /></div>
          <div>
            <div className="card-title">Allowance List</div>
            <div className="card-subtitle">Manage all registered allowances</div>
          </div>
          <div className="search-wrap ms-auto">
            <i className="bi bi-search" />
            <input
              className="search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="allowance-table-wrap">
          <table className="allowance-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Amount (LKR)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && allowanceList.length === 0 ? (
                <tr className="loading-row">
                  <td colSpan="5"><div className="spinner" /> Loading allowances…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="allowancety-state">
                      <div className="allowancety-icon"><i className="bi bi-plus-circle" /></div>
                      <div>{search ? "No results found" : "No allowances yet"}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((allowance, i) => (
                  <AllowanceRow
                    key={allowance.id ?? allowance._id ?? i}
                    allowance={allowance}
                    index={i}
                    employees={employees}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Allowance;