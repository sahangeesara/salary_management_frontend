import React, { useState, useEffect, useCallback, memo } from "react";
import BonusService from "../../service/BonusService";
import EmployeeService from "../../service/EmployeeService";
import "./bonus.css";

/* ── Memo-ised table row ── */
const BonusRow = memo(({ bonus, index, onEdit, onDelete, employees }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(bonus.employeeId)
  );
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${bonus.employeeId}`;
  const initials = emp
    ? `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`
    : (String(bonus.employeeId)?.[0] ?? "?");

  return (
    <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
      <td>
        <span className="bonus-index">{String(index + 1).padStart(2, "0")}</span>
      </td>
      <td>
        <div className="bonus-empid-cell">
          <div className="bonus-avatar">{initials.toUpperCase()}</div>
          <div>
            <div className="bonus-fullname">{empName}</div>
            <div className="bonus-dept-tag">{emp?.department || ""}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="salary-pill">
          <i className="bi bi-currency-dollar" />
          {Number(bonus.amount || 0).toLocaleString()}
        </span>
      </td>
      <td>
        <div className="action-group">
          <button className="action-btn edit-btn" onClick={() => onEdit(bonus)} title="Edit">
            <i className="bi bi-pencil-fill" />
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(bonus)} title="Delete">
            <i className="bi bi-trash3-fill" />
          </button>
        </div>
      </td>
    </tr>
  );
});

/* ── Delete confirmation modal ── */
const DeleteModal = memo(({ bonus, onConfirm, onCancel, employees }) => {
  const emp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(bonus?.employeeId)
  );
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${bonus?.employeeId}`;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <h5>Delete Bonus?</h5>
        <p>
          Are you sure you want to remove the bonus for{" "}
          <strong>{empName}</strong> (Amount: ${Number(bonus?.amount || 0).toLocaleString()})?
          This action cannot be undone.
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

function Bonus() {
  const EMPTY_FORM = { employeeId: "", amount: "" };

  const [bonusList, setBonusList]       = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [editingId, setEditingId]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [empLoading, setEmpLoading]     = useState(false);
  const [toast, setToast]               = useState(null);
  const [search, setSearch]             = useState("");

  /* ── Load on mount ── */
  useEffect(() => {
    fetchBonusList();
    fetchEmployees();
  }, []);

  /* ── Auto-dismiss toast ── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  /* ── Fetch bonus list ── */
  const fetchBonusList = useCallback(() => {
    setLoading(true);
    BonusService.getAllBonus()
      .then((data) => setBonusList(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast("Failed to load bonuses", "error"); })
      .finally(() => setLoading(false));
  }, [showToast]);

  /* ── Fetch employees for combobox ── */
  const fetchEmployees = useCallback(() => {
    setEmpLoading(true);
    EmployeeService.getAllEmployees()
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast("Failed to load employees", "error"); })
      .finally(() => setEmpLoading(false));
  }, [showToast]);

  const handleChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleClear = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  /* ── Edit: populate form ── */
  const handleEdit = useCallback((bonus) => {
    setForm({
      employeeId: String(bonus.employeeId ?? ""),
      amount:     String(bonus.amount     ?? ""),
    });
    setEditingId(bonus.id ?? bonus._id ?? bonus.bonusId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ── Submit (create or update) ── */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...form, amount: Number(form.amount) };
    const action = editingId
      ? BonusService.updateBonus({ ...payload, id: editingId })
      : BonusService.createBonus(payload);

    action
      .then(() => {
        fetchBonusList();
        showToast(editingId ? "Bonus updated!" : "Bonus created!");
        handleClear();
      })
      .catch((err) => { console.error(err); showToast("Operation failed", "error"); })
      .finally(() => setLoading(false));
  }, [form, editingId, fetchBonusList, showToast, handleClear]);

  /* ── Delete ── */
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id ?? deleteTarget._id ?? deleteTarget.bonusId;
    BonusService.deleteBonus(id)
      .then(() => { fetchBonusList(); showToast("Bonus deleted"); })
      .catch((err) => { console.error(err); showToast("Delete failed", "error"); })
      .finally(() => setDeleteTarget(null));
  }, [deleteTarget, fetchBonusList, showToast]);

  /* ── Filtered list ── */
  const filtered = bonusList.filter((b) => {
    const q   = search.toLowerCase();
    const emp = employees.find(
      (e) => String(e.id ?? e._id ?? e.employeeId) === String(b.employeeId)
    );
    const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
    return (
      name.includes(q) ||
      String(b.employeeId).toLowerCase().includes(q) ||
      String(b.amount).includes(q)
    );
  });

  const isEdit = editingId !== null;

  /* ── Selected employee label for combobox ── */
  const selectedEmp = employees.find(
    (e) => String(e.id ?? e._id ?? e.employeeId) === String(form.employeeId)
  );

  return (
    <div className="bonus-page">

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast-bar ${toast.type}`}>
          <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
          {toast.msg}
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <DeleteModal
          bonus={deleteTarget}
          employees={employees}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="bonus-header">
        <div>
          <h2>
            <i className="bi bi-gift-fill me-2" style={{ color: "#3b62f6" }} />
            Bonus Management
          </h2>
        </div>
        <span className="bonus-count">{bonusList.length} bonus{bonusList.length !== 1 ? "es" : ""}</span>
      </div>

      {/* ── Form card ── */}
      <div className="bonus-card">
        <div className="bonus-card-header">
          <div className="card-icon blue">
            <i className="bi bi-gift-fill" />
          </div>
          <div>
            <div className="card-title">{isEdit ? "Edit Bonus" : "Add New Bonus"}</div>
            <div className="card-subtitle">
              {isEdit ? "Update the bonus information" : "Fill in the details below"}
            </div>
          </div>
          <span className={`mode-tag ${isEdit ? "edit" : "create"}`}>
            <i className={`bi ${isEdit ? "bi-pencil-fill" : "bi-plus-circle-fill"}`} />
            {isEdit ? "Edit Mode" : "Create Mode"}
          </span>
        </div>

        <form className="bonus-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">

            {/* ── Employee combobox ── */}
            <div className="col-md-6">
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
                className="bonus-input bonus-select"
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

              {/* Selected employee info chip */}
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

            {/* ── Amount ── */}
            <div className="col-md-6">
              <label className="form-label-sm">Bonus Amount</label>
              <div className="amount-wrap">
                <input
                  type="number"
                  name="amount"
                  className="bonus-input amount-input"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder=" LKR 0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

          </div>

          <div className="form-actions">
            {isEdit ? (
              <button type="submit" className="btn-update" disabled={loading}>
                <i className="bi bi-check2-circle" />
                {loading ? "Updating…" : "Update Bonus"}
              </button>
            ) : (
              <button type="submit" className="btn-save" disabled={loading}>
                <i className="bi bi-gift-fill" />
                {loading ? "Saving…" : "Save Bonus"}
              </button>
            )}
            <button type="button" className="btn-clear" onClick={handleClear}>
              <i className="bi bi-x-circle" /> Clear
            </button>
          </div>
        </form>
      </div>

      {/* ── Table card ── */}
      <div className="bonus-card">
        <div className="bonus-card-header" style={{ paddingBottom: "16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="card-icon green"><i className="bi bi-table" /></div>
          <div>
            <div className="card-title">Bonus List</div>
            <div className="card-subtitle">Manage all registered bonuses</div>
          </div>
          <div className="search-wrap ms-auto">
            <i className="bi bi-search" />
            <input
              className="search-input"
              placeholder="Search by name or amount…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bonus-table-wrap">
          <table className="bonus-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan="4">
                    <div className="spinner" />
                    Loading bonuses…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="bonusty-state">
                      <div className="bonusty-icon"><i className="bi bi-gift" /></div>
                      <div>{search ? "No results found" : "No bonuses yet"}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((bonus, i) => (
                  <BonusRow
                    key={bonus.id ?? bonus._id ?? i}
                    bonus={bonus}
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

export default Bonus;