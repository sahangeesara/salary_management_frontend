import React, { useState, useEffect, useCallback, memo } from "react";
import EmployeeLeaveService from "../../service/EmployeeLeaveService";
import EmployeeService from "../../service/EmployeeService";
import "./employeeLeave.css";

const LEAVE_TYPES = ["ANNUAL", "CASUAL", "SICK"];

/* ── calculate total days between two dates (inclusive) ── */
const calcTotalDays = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e) || e < s) return "";
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return String(diff);
};

/* ── Memo-ised table row ── */
const EmployeeLeaveRow = memo(({ employeeLeave, index, onEdit, onDelete, employees }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(employeeLeave.employeeId)
  );
  const empName  = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${employeeLeave.employeeId}`;
  const initials = emp
    ? `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`
    : (String(employeeLeave.employeeId)?.[0] ?? "?");

  const typeColors = {
    ANNUAL: { bg: "#fee2e2", color: "#dc2626", icon: "bi-calendar-event" },
    CASUAL: { bg: "#fef3c7", color: "#d97706", icon: "bi-clock-history" },
    SICK:   { bg: "#f0fdf4", color: "#16a34a", icon: "bi-hospital" },
  };
  const tc = typeColors[employeeLeave.leaveType] ?? typeColors.ANNUAL;

  return (
    <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
      <td><span className="employeeLeave-index">{String(index + 1).padStart(2, "0")}</span></td>
      <td>
        <div className="employeeLeave-empid-cell">
          <div className="employeeLeave-avatar">{initials.toUpperCase()}</div>
          <div>
            <div className="employeeLeave-fullname">{empName}</div>
            <div className="employeeLeave-dept-tag">{emp?.department || ""}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="type-pill" style={{ background: tc.bg, color: tc.color, display:"inline-flex", alignItems:"center", gap:4, borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:700 }}>
          <i className={`bi ${tc.icon}`} />
          {employeeLeave.leaveType || "—"}
        </span>
      </td>
      <td><span className="salary-pill">{employeeLeave.startDate}</span></td>
      <td><span className="salary-pill">{employeeLeave.endDate}</span></td>
      <td><span className="salary-pill">{Number(employeeLeave.totalDays || 0).toLocaleString()} days</span></td>
      <td>
        <div className="action-group">
          <button className="action-btn edit-btn"   onClick={() => onEdit(employeeLeave)}   title="Edit">
            <i className="bi bi-pencil-fill" />
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(employeeLeave)} title="Delete">
            <i className="bi bi-trash3-fill" />
          </button>
        </div>
      </td>
    </tr>
  );
});

/* ── Delete confirmation modal ── */
const DeleteModal = memo(({ employeeLeave, onConfirm, onCancel, employees }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(employeeLeave?.employeeId)
  );
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${employeeLeave?.employeeId}`;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <h5>Delete Leave Record?</h5>
        <p>
          Are you sure you want to remove the <strong>{employeeLeave?.leaveType}</strong> leave for{" "}
          <strong>{empName}</strong>? This action cannot be undone.
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

/* ══════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════ */
function EmployeeLeave() {
  const EMPTY_FORM = {
    employeeId: "",
    leaveType:  "",
    startDate:  "",
    endDate:    "",
    totalDays:  "",
    reason:     "",
  };

  const [employeeLeaveList, setEmployeeLeaveList] = useState([]);
  const [employees,         setEmployees]         = useState([]);
  const [form,              setForm]              = useState(EMPTY_FORM);
  const [editingId,         setEditingId]         = useState(null);
  const [deleteTarget,      setDeleteTarget]      = useState(null);
  const [loading,           setLoading]           = useState(false);
  const [empLoading,        setEmpLoading]        = useState(false);
  const [toast,             setToast]             = useState(null);
  const [search,            setSearch]            = useState("");

  useEffect(() => {
    fetchEmployeeLeaveList();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const fetchEmployeeLeaveList = useCallback(() => {
    setLoading(true);
    EmployeeLeaveService.getAllEmployeeLeave()
      .then((data) => setEmployeeLeaveList(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast("Failed to load leave records", "error"); })
      .finally(() => setLoading(false));
  }, [showToast]);

  const fetchEmployees = useCallback(() => {
    setEmpLoading(true);
    EmployeeService.getAllEmployees()
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast("Failed to load employees", "error"); })
      .finally(() => setEmpLoading(false));
  }, [showToast]);

  /* ── handleChange: auto-calc totalDays when startDate or endDate changes ── */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "startDate" || name === "endDate") {
        const start = name === "startDate" ? value : prev.startDate;
        const end   = name === "endDate"   ? value : prev.endDate;
        updated.totalDays = calcTotalDays(start, end);
      }
      return updated;
    });
  }, []);

  const handleClear = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((leave) => {
    setForm({
      employeeId: String(leave.employeeId ?? ""),
      leaveType:  String(leave.leaveType  ?? ""),
      startDate:  String(leave.startDate  ?? ""),
      endDate:    String(leave.endDate    ?? ""),
      totalDays:  String(leave.totalDays  ?? ""),
      reason:     String(leave.reason     ?? ""),
    });
    setEditingId(leave.id ?? leave._id ?? leave.employeeLeaveId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, totalDays: Number(form.totalDays) };
    const action = editingId
      ? EmployeeLeaveService.updateEmployeeLeave({ ...payload, id: editingId })
      : EmployeeLeaveService.createEmployeeLeave(payload);

    action
      .then(() => {
        fetchEmployeeLeaveList();
        showToast(editingId ? "Leave record updated!" : "Leave record created!");
        handleClear();
      })
      .catch((err) => { console.error(err); showToast("Operation failed", "error"); })
      .finally(() => setLoading(false));
  }, [form, editingId, fetchEmployeeLeaveList, showToast, handleClear]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id ?? deleteTarget._id ?? deleteTarget.employeeLeaveId;
    EmployeeLeaveService.deleteemployeeLeave(id)
      .then(() => { fetchEmployeeLeaveList(); showToast("Leave record deleted"); })
      .catch((err) => { console.error(err); showToast("Delete failed", "error"); })
      .finally(() => setDeleteTarget(null));
  }, [deleteTarget, fetchEmployeeLeaveList, showToast]);

  /* ── filtered list ── */
  const filtered = employeeLeaveList.filter((a) => {
    const q   = search.toLowerCase();
    const emp = employees.find(
      (e) => String(e.id ?? e._id ?? e.employeeId) === String(a.employeeId)
    );
    const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
    return (
      name.includes(q) ||
      String(a.employeeId).toLowerCase().includes(q) ||
      (a.leaveType || "").toLowerCase().includes(q)
    );
  });

  const isEdit      = editingId !== null;
  const selectedEmp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(form.employeeId)
  );

  const typeIconMap = {
    ANNUAL: { icon: "bi-calendar-event", color: "#2563eb" },
    CASUAL: { icon: "bi-clock-history",  color: "#d97706" },
    SICK:   { icon: "bi-hospital",       color: "#16a34a" },
  };
  const selectedType = typeIconMap[form.leaveType];

  /* ── preview label for total days ── */
  const totalDaysPreview = form.totalDays
    ? `${form.totalDays} day${form.totalDays === "1" ? "" : "s"}`
    : null;

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div className="employeeLeave-page">

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast-bar ${toast.type}`}>
          <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
          {toast.msg}
        </div>
      )}

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <DeleteModal
          employeeLeave={deleteTarget}
          employees={employees}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Page header ── */}
      <div className="employeeLeave-header">
        <div>
          <h2>
            <i className="bi bi-calendar2-check-fill me-2" style={{ color: "#3b62f6" }} />
            Employee Leave Management
          </h2>
        </div>
        <span className="employeeLeave-count">
          {employeeLeaveList.length} record{employeeLeaveList.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ══════════════ FORM CARD ══════════════ */}
      <div className="employeeLeave-card">
        <div className="employeeLeave-card-header">
          <div className="card-icon" style={isEdit
            ? { background:"#fff4e5", color:"#ef6c00", width:34, height:34, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }
            : { background:"#e8edff", color:"#3b62f6", width:34, height:34, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
            <i className={`bi ${isEdit ? "bi-pencil-fill" : "bi-plus-circle-fill"}`} />
          </div>
          <div>
            <div className="card-title">{isEdit ? "Edit Leave Record" : "Add New Leave Record"}</div>
            <div className="card-subtitle">
              {isEdit ? "Update the leave information" : "Fill in the details below"}
            </div>
          </div>
          <span className={`mode-tag ${isEdit ? "edit" : "create"}`}>
            <i className={`bi ${isEdit ? "bi-pencil-fill" : "bi-plus-circle-fill"}`} />
            {isEdit ? "Edit Mode" : "Create Mode"}
          </span>
        </div>

        <form className="employeeLeave-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">

            {/* Employee */}
            <div className="col-md-4">
              <label className="form-label-sm">
                Employee
                {empLoading && (
                  <span className="ms-2" style={{ fontSize: "11px", color: "#9ca3af" }}>
                    <i className="bi bi-arrow-repeat spin-icon" /> Loading…
                  </span>
                )}
              </label>
              <select
                name="employeeId"
                className="employeeLeave-input employeeLeave-select"
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
                      {emp.firstName} {emp.lastName}
                      {emp.department ? ` · ${emp.department}` : ""}
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
                    <div className="emp-chip-name">
                      {selectedEmp.firstName} {selectedEmp.lastName}
                    </div>
                    <div className="emp-chip-meta">
                      {selectedEmp.designation || selectedEmp.department || ""}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Leave Type */}
            <div className="col-md-4">
              <label className="form-label-sm">Leave Type</label>
              <select
                name="leaveType"
                className="employeeLeave-input employeeLeave-select"
                value={form.leaveType}
                onChange={handleChange}
                required
              >
                <option value="">— Select Type —</option>
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {selectedType && (
                <div className="emp-chip" style={{ borderColor: selectedType.color + "44", background: selectedType.color + "11" }}>
                  <i className={`bi ${selectedType.icon}`} style={{ color: selectedType.color }} />
                  <span style={{ color: selectedType.color, fontWeight: 700, fontSize: 13 }}>
                    {form.leaveType}
                  </span>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="col-md-4">
              <label className="form-label-sm">Reason</label>
              <input
                type="text"
                name="reason"
                className="employeeLeave-input"
                value={form.reason}
                onChange={handleChange}
                placeholder="Enter reason…"
              />
            </div>

            {/* Start Date */}
            <div className="col-md-4">
              <label className="form-label-sm">Start Date</label>
              <input
                type="date"
                name="startDate"
                className="employeeLeave-input"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* End Date */}
            <div className="col-md-4">
              <label className="form-label-sm">End Date</label>
              <input
                type="date"
                name="endDate"
                className="employeeLeave-input"
                value={form.endDate}
                onChange={handleChange}
                required
                min={form.startDate || undefined}
              />
            </div>

            {/* Total Days — auto-calculated, read-only */}
            <div className="col-md-4">
              <label className="form-label-sm">Total Days</label>
              <div className="amount-wrap">
                <span className="amount-prefix" style={{ fontSize: 11, left: 8 }}>
                  <i className="bi bi-calendar3" />
                </span>
                <input
                  type="text"
                  name="totalDays"
                  className="employeeLeave-input"
                  value={totalDaysPreview ?? ""}
                  readOnly
                  placeholder="Auto-calculated"
                  style={{
                    paddingLeft: 30,
                    background:  form.totalDays ? "#f0f4ff" : "#fafafa",
                    color:       form.totalDays ? "#3b62f6" : "#9ca3af",
                    fontWeight:  form.totalDays ? 700 : 400,
                    cursor:      "default",
                  }}
                />
              </div>
              {form.totalDays && (
                <div style={{ marginTop: 6, display:"inline-flex", alignItems:"center", gap:5,
                  background:"#e8edff", color:"#3b62f6", borderRadius:9,
                  padding:"4px 12px", fontSize:12, fontWeight:700, border:"1px solid #c7d4fc" }}>
                  <i className="bi bi-calendar-range" />
                  {form.totalDays} day{form.totalDays === "1" ? "" : "s"} of leave
                </div>
              )}
            </div>

          </div>{/* end row */}

          {/* Form actions */}
          <div className="form-actions">
            {isEdit ? (
              <button type="submit" className="btn-update" disabled={loading}>
                <i className="bi bi-check2-circle" />
                {loading ? "Updating…" : "Update Record"}
              </button>
            ) : (
              <button type="submit" className="btn-save" disabled={loading}>
                <i className="bi bi-plus-circle-fill" />
                {loading ? "Saving…" : "Save Record"}
              </button>
            )}
            <button type="button" className="btn-clear" onClick={handleClear}>
              <i className="bi bi-x-circle" /> Clear
            </button>
          </div>

        </form>
      </div>

      {/* ══════════════ TABLE CARD ══════════════ */}
      <div className="employeeLeave-card">
        <div className="employeeLeave-card-header" style={{ paddingBottom: "16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="card-icon green"><i className="bi bi-table" /></div>
          <div>
            <div className="card-title">Leave Records</div>
            <div className="card-subtitle">Manage all employee leave entries</div>
          </div>
          <div className="search-wrap ms-auto">
            <i className="bi bi-search" />
            <input
              className="search-input"
              placeholder="Search by name or type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="employeeLeave-table-wrap">
          <table className="employeeLeave-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Total Days</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan={7}>
                    <div className="spinner" />
                    Loading leave records…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="employeeLeavety-state">
                      <div className="employeeLeavety-icon"><i className="bi bi-calendar-x" /></div>
                      <div>{search ? "No results found" : "No leave records yet"}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((leave, i) => (
                  <EmployeeLeaveRow
                    key={leave.id ?? leave._id ?? i}
                    employeeLeave={leave}
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

export default EmployeeLeave;