import React, { useState, useEffect, useCallback, memo } from "react";
import BasicSalaryService from "../../service/BasicSalaryService";
import "./basicsalry.css";

// 1. Move static constants OUTSIDE the component so they are stable
const EMPTY_FORM = { roleName: "", amount: "" };

/* ── Memo-ised table row ── */
const BasicSalaryRow = memo(({ basicSalary, index, onEdit, onDelete }) => {
  return (
    <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
      <td>
        <span className="basicSalary-index">{String(index + 1).padStart(2, "0")}</span>
      </td>
      <td>
        <div className="basicSalary-role-cell">
          <div>
            <div className="basicSalary-rolename">{basicSalary.roleName}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="salary-pill">
          <i className="bi bi-currency-dollar" />
          {Number(basicSalary.amount || 0).toLocaleString()}
        </span>
      </td>
      <td>
        <div className="action-group">
          <button className="action-btn edit-btn" onClick={() => onEdit(basicSalary)} title="Edit">
            <i className="bi bi-pencil-fill" />
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(basicSalary)} title="Delete">
            <i className="bi bi-trash3-fill" />
          </button>
        </div>
      </td>
    </tr>
  );
});

/* ── Delete confirmation modal ── */
const DeleteModal = memo(({ basicSalary, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <h5>Delete basicSalary?</h5>
        <p>Are you sure you want to delete the record for <strong>{basicSalary.roleName}</strong>? This action cannot be undone.</p>
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

function BasicSalary() {
  const [basicSalaryList, setbasicSalaryList] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  // 2. Define showToast first
  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  // 3. Define fetchers with useCallback so they are stable
  const fetchbasicSalaryList = useCallback(() => {
    setLoading(true);
    BasicSalaryService.getAllBasicSalary()
      .then((data) => setbasicSalaryList(Array.isArray(data) ? data : []))
      .catch((err) => { 
        console.error(err); 
        showToast("Failed to load basic salaries", "error"); 
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  /* ── Load on mount ── */
  useEffect(() => {
    fetchbasicSalaryList();
  }, [fetchbasicSalaryList]); // Now safe to include

  /* ── Auto-dismiss toast ── */
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

  /* ── Edit: populate form ── */
  const handleEdit = useCallback((basicSalary) => {
    setForm({
      roleName: String(basicSalary.roleName ?? ""),
      amount: String(basicSalary.amount ?? ""),
    });
    setEditingId(basicSalary.id ?? basicSalary._id ?? basicSalary.basicSalaryId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ── Submit (create or update) ── */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...form, amount: Number(form.amount) };
    const action = editingId
      ? BasicSalaryService.updateBasicSalary({ ...payload, id: editingId })
      : BasicSalaryService.createBasicSalary(payload);

    action
      .then(() => {
        fetchbasicSalaryList();
        showToast(editingId ? "Salary updated!" : "Salary created!");
        handleClear();
      })
      .catch((err) => { 
        console.error(err); 
        showToast("Operation failed", "error"); 
      })
      .finally(() => setLoading(false));
  }, [form, editingId, fetchbasicSalaryList, showToast, handleClear]);

  /* ── Delete ── */
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id ?? deleteTarget._id ?? deleteTarget.basicSalaryId;
    BasicSalaryService.deletebasicSalary(id)
      .then(() => { 
        fetchbasicSalaryList(); 
        showToast("Salary record deleted"); 
      })
      .catch((err) => { 
        console.error(err); 
        showToast("Delete failed", "error"); 
      })
      .finally(() => setDeleteTarget(null));
  }, [deleteTarget, fetchbasicSalaryList, showToast]);

  /* ── Filtered list ── */
  const filtered = basicSalaryList.filter((b) => {
    const q = search.toLowerCase();
    return (
      String(b.roleName).toLowerCase().includes(q) ||
      String(b.amount).includes(q)
    );
  });

  const isEdit = editingId !== null;

  return (
    <div className="basicSalary-page">
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
          basicSalary={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="basicSalary-header">
        <div>
          <h2>
            <i className="bi-cash-coin me-2" style={{ color: "#3b62f6" }} />
            Basic Salary Management
          </h2>
        </div>
        <span className="basicSalary-count">{basicSalaryList.length} record{basicSalaryList.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Form card ── */}
      <div className="basicSalary-card">
        <div className="basicSalary-card-header">
          <div className="card-icon blue"><i className="bi bi-cash-coin" /></div>
          <div>
            <div className="card-title">{isEdit ? "Edit Basic Salary" : "Add New Basic Salary"}</div>
            <div className="card-subtitle">
              {isEdit ? "Update role and amount details" : "Define a new base salary for a role"}
            </div>
          </div>
          <span className={`mode-tag ${isEdit ? "edit" : "create"}`}>
            <i className={`bi ${isEdit ? "bi-pencil-fill" : "bi-plus-circle-fill"}`} />
            {isEdit ? "Edit Mode" : "Create Mode"}
          </span>
        </div>

        <form className="basicSalary-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">  
              <label className="form-label-sm">Employee Role</label>
              <input
                type="text"
                name="roleName"
                className="basicSalary-input"
                value={form.roleName}
                onChange={handleChange}
                placeholder="e.g. ROLE_MANAGER"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-sm">Basic Salary Amount</label>
              <div className="amount-wrap">
                <input
                  type="number"
                  name="amount"
                  className="basicSalary-input amount-input"
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
            <button type="submit" className={isEdit ? "btn-update" : "btn-save"} disabled={loading}>
              <i className={isEdit ? "bi bi-check2-circle" : "bi bi-cash-coin"} />
              {loading ? "Processing…" : isEdit ? "Update Record" : "Save Record"}
            </button>
            <button type="button" className="btn-clear" onClick={handleClear}>
              <i className="bi bi-x-circle" /> Clear
            </button>
          </div>
        </form>
      </div>

      {/* ── Table card ── */}
      <div className="basicSalary-card">
        <div className="basicSalary-card-header" style={{ paddingBottom: "16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="card-icon green"><i className="bi bi-table" /></div>
          <div>
            <div className="card-title">Salary List</div>
            <div className="card-subtitle">Manage base pay per role</div>
          </div>
          <div className="search-wrap ms-auto">
            <i className="bi bi-search" />
            <input
              className="search-input"
              placeholder="Search by role or amount…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="basicSalary-table-wrap">
          <table className="basicSalary-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Role Name</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && basicSalaryList.length === 0 ? (
                <tr className="loading-row">
                  <td colSpan="4">
                    <div className="spinner" />
                    Loading records…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="basicSalaryty-state">
                      <div className="basicSalaryty-icon"><i className="bi bi-cash-stack" /></div>
                      <div>{search ? "No matches found" : "No salary records found"}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((basicSalary, i) => (
                  <BasicSalaryRow
                    key={basicSalary.id ?? basicSalary._id ?? i}
                    basicSalary={basicSalary}
                    index={i}
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

export default BasicSalary;