import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import OvertimeService from "../../service/OvertimeService ";
import EmployeeService from "../../service/EmployeeService";
import "./overtime.css";

/* ── 1. Static Helpers & Constants (Defined outside to be stable) ── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EMPTY = {
  id: null, employeeId: "", date: "", hours: "", ratePerHour: "", totalAmount: 0,
};

/* ── 2. Memoized Sub-components ── */
const DeleteModal = memo(({ target, employees, onConfirm, onCancel }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(target?.employeeId)
  );
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `EMP #${target?.employeeId}`;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon"><i className="bi bi-trash3-fill" /></div>
        <h5>Delete Record?</h5>
        <p>
          This will permanently remove the overtime entry for{" "}
          <strong>{empName}</strong> on <strong>{target?.date}</strong>.
          This action cannot be undone.
        </p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm-delete" onClick={onConfirm}>
            <i className="bi bi-trash3-fill" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
});

const OvertimeRow = memo(({ rec, index, employees, onEdit, onDelete }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(rec.employeeId)
  );
  const empName  = emp ? `${emp.firstName} ${emp.lastName}` : `EMP #${rec.employeeId}`;
  const dept     = emp?.department || emp?.dept || "—";
  const initials = emp
    ? `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`.toUpperCase()
    : `E${String(rec.employeeId).padStart(2, "0")}`;

  return (
    <tr style={{ animation: "fadeSlideIn 0.3s ease both", animationDelay: `${index * 40}ms` }}>
      <td><span className="deduction-index">{String(index + 1).padStart(2, "0")}</span></td>
      <td>
        <div className="deduction-empid-cell">
          <div className="deduction-avatar">{initials}</div>
          <div>
            <div className="deduction-fullname">{empName}</div>
            <div className="deduction-dept-tag">{dept}</div>
          </div>
        </div>
      </td>
      <td>
        <div className="deduction-meta">
          <i className="bi bi-calendar3" />
          {rec.date}
        </div>
      </td>
      <td>
        <span className="salary-pill" style={{ background: "#e8f4ff", color: "#2563eb" }}>
          <i className="bi bi-clock" style={{ fontSize: 11 }} />
          {rec.hours} hrs
        </span>
      </td>
      <td>
        <span className="salary-pill" style={{ background: "#f0fdf4", color: "#16a34a" }}>
          Rs. {fmt(rec.ratePerHour)}/hr
        </span>
      </td>
      <td>
        <span className="salary-pill">
          Rs. {fmt(rec.totalAmount)}
        </span>
      </td>
      <td>
        <div className="action-group">
          <button className="action-btn edit-btn" title="Edit" onClick={() => onEdit(rec)}>
            <i className="bi bi-pencil-fill" />
          </button>
          <button className="action-btn delete-btn" title="Delete" onClick={() => onDelete(rec)}>
            <i className="bi bi-trash3-fill" />
          </button>
        </div>
      </td>
    </tr>
  );
});

/* ── 3. Main Component ── */
export default function OvertimePage() {
  const [records,      setRecords]      = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [form,         setForm]         = useState(EMPTY);
  const [isEdit,       setIsEdit]       = useState(false);
  const [search,       setSearch]       = useState("");
  const [loading,      setLoading]      = useState(false);
  const [empLoading,   setEmpLoading]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toastTimer = useRef(null);

  const computedTotal = parseFloat(form.hours || 0) * parseFloat(form.ratePerHour || 0);

  // Define showToast first
  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // Define fetchers before useEffect
  const fetchRecords = useCallback(() => {
    setLoading(true);
    OvertimeService.getAllOvertime()
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch((err) => { 
        console.error(err); 
        showToast("Failed to load overtime records", "error"); 
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const fetchEmployees = useCallback(() => {
    setEmpLoading(true);
    EmployeeService.getAllEmployees()
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch((err) => { 
        console.error(err); 
        showToast("Failed to load employees", "error"); 
      })
      .finally(() => setEmpLoading(false));
  }, [showToast]);

  // NOW call useEffect (fixes 'use-before-define')
  useEffect(() => { 
    fetchRecords(); 
    fetchEmployees(); 
  }, [fetchRecords, fetchEmployees]); // Fixes 'exhaustive-deps'

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleClear = useCallback(() => { 
    setForm(EMPTY); 
    setIsEdit(false); 
  }, []);

  const handleEdit = useCallback((rec) => {
    setForm({
      ...rec,
      employeeId:  String(rec.employeeId),
      hours:       String(rec.hours),
      ratePerHour: String(rec.ratePerHour),
    });
    setIsEdit(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.employeeId || !form.date || !form.hours || !form.ratePerHour) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      employeeId:  Number(form.employeeId),
      hours:       parseFloat(form.hours),
      ratePerHour: parseFloat(form.ratePerHour),
      totalAmount: computedTotal,
    };
    const action = isEdit
      ? OvertimeService.updateOvertime({ ...payload, id: form.id })
      : OvertimeService.createOvertime(payload);

    action
      .then(() => { 
        fetchRecords(); 
        showToast(isEdit ? "Overtime record updated." : "Overtime record saved."); 
        handleClear(); 
      })
      .catch((err) => { 
        console.error(err); 
        showToast("Operation failed", "error"); 
      })
      .finally(() => setSaving(false));
  }, [form, isEdit, computedTotal, fetchRecords, showToast, handleClear]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id ?? deleteTarget._id ?? deleteTarget.overtimeId;
    OvertimeService.deleteOvertime(id)
      .then(() => { 
        fetchRecords(); 
        showToast("Record deleted."); 
      })
      .catch((err) => { 
        console.error(err); 
        showToast("Delete failed", "error"); 
      })
      .finally(() => setDeleteTarget(null));
  }, [deleteTarget, fetchRecords, showToast]);

  const filtered = records.filter((r) => {
    const q   = search.toLowerCase();
    const emp = employees.find(
      (e) => String(e.id ?? e._id ?? e.employeeId) === String(r.employeeId)
    );
    const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
    return !q || String(r.employeeId).includes(q) || (r.date || "").includes(q) || name.includes(q);
  });

  const selectedEmp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(form.employeeId)
  );

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
          target={deleteTarget}
          employees={employees}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="deduction-header">
        <div className="d-flex align-items-center gap-2">
          <h2>
            <i className="bi bi-clock-history me-2" style={{ color: "#3b62f6" }} />
            Overtime
          </h2>
        </div>
        <span className="deduction-count">
          {records.length} record{records.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="deduction-card" style={{ animation: "fadeSlideIn 0.3s ease" }}>
        <div className="deduction-card-header">
          <div className={`card-icon ${isEdit ? "amber" : "blue"}`}>
            <i className={`bi ${isEdit ? "bi-pencil-square" : "bi-clock-history"}`} />
          </div>
          <div>
            <div className="card-title">{isEdit ? "Edit Overtime Record" : "New Overtime Entry"}</div>
            <div className="card-subtitle">
              {isEdit ? "Update the selected record" : "Log employee overtime hours"}
            </div>
          </div>
          <span className={`mode-tag ${isEdit ? "edit" : "create"}`}>
            <i className={`bi ${isEdit ? "bi-pencil" : "bi-plus-circle"}`} />
            {isEdit ? "Edit Mode" : "Create Mode"}
          </span>
        </div>

        <div className="deduction-form-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label-sm">
                Employee *
                {empLoading && (
                  <span className="ms-2" style={{ fontSize: "11px", color: "#9ca3af" }}>
                    <i className="bi bi-arrow-repeat spin-icon" /> Loading…
                  </span>
                )}
              </label>
              <select
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                className="deduction-input deduction-select"
                required
                disabled={empLoading}
              >
                <option value="">— Select Employee —</option>
                {employees.map((emp) => {
                  const id   = emp.id ?? emp._id ?? emp.employeeId;
                  const dept = emp.department || emp.dept || "";
                  return (
                    <option key={id} value={id}>
                      {emp.firstName} {emp.lastName}{dept ? ` · ${dept}` : ""}
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
                    <div className="emp-chip-meta">{selectedEmp.designation || selectedEmp.department || selectedEmp.dept || ""}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-2">
              <label className="form-label-sm">Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="deduction-input"
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label-sm">Hours *</label>
              <input
                type="number"
                name="hours"
                value={form.hours}
                onChange={handleChange}
                placeholder="0.0"
                min="0"
                step="0.5"
                className="deduction-input"
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label-sm">Rate / Hour (LKR) *</label>
              <div className="amount-wrap">
                <input
                  type="number"
                  name="ratePerHour"
                  value={form.ratePerHour}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="deduction-input amount-input"
                  required
                />
              </div>
            </div>

            <div className="col-md-2">
              <label className="form-label-sm">Total Amount</label>
              <div className="amount-wrap">
                <input
                  type="text"
                  value={fmt(computedTotal)}
                  readOnly
                  disabled
                  className="deduction-input amount-input"
                  style={{ background: "#f0f4ff", color: "#3b62f6", fontWeight: 700 }}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className={isEdit ? "btn-update" : "btn-save"} onClick={handleSubmit} disabled={saving}>
              {saving
                ? <><i className="bi bi-arrow-repeat spin-icon" /> {isEdit ? "Updating…" : "Saving…"}</>
                : <><i className={isEdit ? "bi bi-pencil-square" : "bi-check-circle"} /> {isEdit ? "Update Record" : "Save Record"}</>}
            </button>
            <button className="btn-clear" onClick={handleClear}>
              <i className="bi bi-x-circle" /> Clear
            </button>
          </div>
        </div>
      </div>

      <div className="deduction-card">
        <div className="deduction-card-header" style={{ paddingBottom: 16, borderBottom: "1px solid #f0f2f7" }}>
          <div className="card-icon green"><i className="bi bi-table" /></div>
          <div>
            <div className="card-title">Overtime Records</div>
            <div className="card-subtitle">All logged overtime entries</div>
          </div>
          <div className="search-wrap ms-auto">
            <i className="bi bi-search" />
            <input
              className="search-input"
              placeholder="Search employee, date…"
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
                <th>Date</th>
                <th>Hours</th>
                <th>Rate / Hr</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan={7}>
                    <div className="spinner" />
                    Loading records…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="deductionty-state">
                      <div className="deductionty-icon"><i className="bi bi-clock" /></div>
                      <div>{search ? "No results found" : "No overtime records yet"}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((rec, idx) => (
                  <OvertimeRow
                    key={rec.id ?? rec._id ?? idx}
                    rec={rec}
                    index={idx}
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