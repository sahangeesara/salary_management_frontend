
import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import DeductionService from "../../service/DeductionService";
import EmployeeService from "../../service/EmployeeService";
import "./deduction.css";
// Utility to safely render department/designation as string
function getName(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.name) return val.name;
  return String(val);
}

const DEDUCTION_TYPES = ["Tax", "Loan", "Donation"];
const EMPTY_FORM = { employeeId: "", type: "", amount: "" };

/* ── Memo-ised table row ── */
const DeductionRow = memo(({ deduction, index, onEdit, onDelete, employees }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(deduction.employeeId)
  );
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${deduction.employeeId}`;
  const initials = emp
    ? `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`
    : (String(deduction.employeeId)?.[0] ?? "?");

  const typeColors = {
    Tax:      { bg: "#fee2e2", color: "#dc2626", icon: "bi-receipt-cutoff"},
    Loan:     { bg: "#fef3c7", color: "#d97706", icon: "bi-bank"},
    Donation: { bg: "#f0fdf4", color: "#16a34a", icon: "bi-heart-fill" },
    Other:    { bg: "#f3f4f6", color: "#6b7280", icon: "bi-info-circle" }
  };
  const tc = typeColors[deduction.type] ?? typeColors.Other;

  return (
    <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
      <td><span className="deduction-index">{String(index + 1).padStart(2, "0")}</span></td>
      <td>
        <div className="deduction-empid-cell">
          <div className="deduction-avatar">{initials.toUpperCase()}</div>
          <div>
            <div className="deduction-fullname">{empName}</div>
            <div className="deduction-dept-tag">{getName(emp?.department) || "N/A"}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="type-pill" style={{ background: tc.bg, color: tc.color }}>
          <i className={`bi ${tc.icon} me-1`} /> {deduction.type || "—"}
        </span>
      </td>
      <td>
        <span className="salary-pill">
          <span className="lkr-label">LKR</span> {Number(deduction.amount || 0).toLocaleString()}
        </span>
      </td>
      <td>
        <div className="action-group">
          <button className="action-btn edit-btn" onClick={() => onEdit(deduction)} title="Edit">
            <i className="bi bi-pencil-fill" />
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(deduction)} title="Delete">
            <i className="bi bi-trash3-fill" />
          </button>
        </div>
      </td>
    </tr>
  );
});

/* ── Delete confirmation modal ── */
const DeleteModal = memo(({ deduction, onConfirm, onCancel, employees }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(deduction?.employeeId)
  );
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${deduction?.employeeId}`;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon"><i className="bi bi-exclamation-triangle-fill" /></div>
        <h5>Delete deduction?</h5>
        <p>
          Are you sure you want to remove the <strong>{deduction?.type}</strong> deduction for{" "}
          <strong>{empName}</strong>?
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

function Deduction() {
  const [deductionList, setDeductionList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const fetchDeductionList = useCallback(() => {
    setLoading(true);
    DeductionService.getAllDeduction()
      .then((data) => setDeductionList(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast("Failed to load deductions", "error"); })
      .finally(() => setLoading(false));
  }, [showToast]);

  const fetchEmployees = useCallback(() => {
    setEmpLoading(true);
    EmployeeService.getAllEmployees()
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast("Failed to load employees", "error"); })
      .finally(() => setEmpLoading(false));
  }, [showToast]);

  useEffect(() => {
    fetchDeductionList();
    fetchEmployees();
  }, [fetchDeductionList, fetchEmployees]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleClear = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((deduction) => {
    setForm({
      employeeId: String(deduction.employeeId ?? ""),
      type:       String(deduction.type       ?? ""),
      amount:      String(deduction.amount     ?? ""),
    });
    setEditingId(deduction.id ?? deduction._id ?? deduction.deductionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, amount: Number(form.amount) };
    const action = editingId
      ? DeductionService.updateDeduction({ ...payload, id: editingId })
      : DeductionService.createDeduction(payload);

    action
      .then(() => {
        fetchDeductionList();
        showToast(editingId ? "Deduction updated!" : "Deduction created!");
        handleClear();
      })
      .catch((err) => { console.error(err); showToast("Operation failed", "error"); })
      .finally(() => setLoading(false));
  }, [form, editingId, fetchDeductionList, showToast, handleClear]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id ?? deleteTarget._id ?? deleteTarget.deductionId;
    DeductionService.deleteDeduction(id)
      .then(() => { fetchDeductionList(); showToast("Deduction deleted"); })
      .catch((err) => { console.error(err); showToast("Delete failed", "error"); })
      .finally(() => setDeleteTarget(null));
  }, [deleteTarget, fetchDeductionList, showToast]);

  const filtered = deductionList.filter((a) => {
    const q = search.toLowerCase();
    const emp = employees.find((e) => String(e.id ?? e._id ?? e.employeeId) === String(a.employeeId));
    const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
    return name.includes(q) || String(a.employeeId).toLowerCase().includes(q) || (a.type || "").toLowerCase().includes(q);
  });

  const selectedEmp = useMemo(() => 
    employees.find(e => String(e.id ?? e._id ?? e.employeeId) === String(form.employeeId)),
    [employees, form.employeeId]
  );

  const isEdit = editingId !== null;

  return (
    <div className="deduction-page">
      {toast && (
        <div className={`toast-bar ${toast.type}`}>
          <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
          {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal 
          deduction={deleteTarget} 
          employees={employees} 
          onConfirm={handleDeleteConfirm} 
          onCancel={() => setDeleteTarget(null)} 
        />
      )}

      <div className="deduction-header">
        <div>
          <h2><i className="bi bi-wallet2 me-2" style={{ color: "#3b62f6" }} />Deduction Management</h2>
        </div>
        <span className="deduction-count">{deductionList.length} records</span>
      </div>

      <div className="deduction-card">
        <div className="deduction-card-header">
          <div className="card-icon blue"><i className="bi bi-plus-square-fill" /></div>
          <div>
            <div className="card-title">{isEdit ? "Edit Deduction" : "Add New Deduction"}</div>
            <div className="card-subtitle">Manage employee salary deductions</div>
          </div>
          <span className={`mode-tag ${isEdit ? "edit" : "create"}`}>
            <i className={`bi ${isEdit ? "bi-pencil-fill" : "bi-plus-circle-fill"}`} />
            {isEdit ? "Edit Mode" : "Create Mode"}
          </span>
        </div>

        <form className="deduction-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label-sm">Employee</label>
              <select 
                name="employeeId" 
                className="deduction-input deduction-select" 
                value={form.employeeId} 
                onChange={handleChange}
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id ?? emp._id} value={emp.id ?? emp._id ?? emp.employeeId}>
                    {emp.firstName} {emp.lastName} ({emp.id ?? emp._id ?? emp.employeeId})
                  </option>
                ))}
              </select>
              
              {selectedEmp && (
                <div className="emp-chip">
                  <div className="emp-chip-avatar">
                    {selectedEmp.firstName?.[0]}{selectedEmp.lastName?.[0]}
                  </div>
                  <div>
                    <div className="emp-chip-name">{selectedEmp.firstName} {selectedEmp.lastName}</div>
                    <div className="emp-chip-meta">{selectedEmp.designation?.name || selectedEmp.designation || ""}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label-sm">Deduction Type</label>
              <select 
                name="type" 
                className="deduction-input deduction-select" 
                value={form.type} 
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                {DEDUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label-sm">Amount</label>
              <div className="amount-wrap">
                <span className="amount-prefix">Rs.</span>
                <input
                  type="number"
                  name="amount"
                  className="deduction-input amount-input"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className={isEdit ? "btn-update" : "btn-save"} disabled={loading}>
              <i className={`bi ${isEdit ? "bi-check2-circle" : "bi-save-fill"}`} />
              {loading ? "Processing..." : isEdit ? "Update Deduction" : "Save Deduction"}
            </button>
            <button type="button" className="btn-clear" onClick={handleClear}>
              <i className="bi bi-x-circle" /> Clear
            </button>
          </div>
        </form>
      </div>

      <div className="deduction-card">
        <div className="deduction-card-header" style={{ paddingBottom: "16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="card-icon green"><i className="bi bi-list-stars" /></div>
          <div>
            <div className="card-title">Deduction History</div>
            <div className="card-subtitle">Overview of all active deductions</div>
          </div>
          <div className="search-wrap ms-auto">
            <i className="bi bi-search" />
            <input
              className="search-input"
              placeholder="Search by name or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="deduction-table-wrap">
          <table className="deduction-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && deductionList.length === 0 ? (
                <tr className="loading-row">
                  <td colSpan="5">
                    <div className="spinner" />
                    Loading records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="deductionty-state">
                      <div className="deductionty-icon"><i className="bi bi-inbox" /></div>
                      <div>No deductions found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((d, i) => (
                  <DeductionRow 
                    key={d.id ?? d._id ?? i} 
                    deduction={d} 
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
      {empLoading && <div className="toast-bar success">Refreshing employee data...</div>}
    </div>
  );
}

export default Deduction;

