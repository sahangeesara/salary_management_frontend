import React, { useState, useEffect, useCallback, memo } from "react";
import PayrollConfigService from "../../service/PayrollConfigService";
import "./payrollConfig.css";

// 1. Updated to match the table's actual data requirements
const EMPTY_FORM = { 
  roleName: "", 
  epfEmployeeRate: "", 
  epfEmployerRate: "", 
  etfRate: "" 
};

/* ── Memo-ised table row ── */
const PayrollConfigRow = memo(({ payrollConfig, index, onEdit, onDelete }) => {
  return (
    <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
      <td>
        <span className="payrollConfig-index">{String(index + 1).padStart(2, "0")}</span>
      </td>
      <td>
        <div className="payrollConfig-role-cell">
            <div className="payrollConfig-rolename">
                {/* Displaying EPF Employee Rate as per your table header */}
                {Number(payrollConfig.epfEmployeeRate || 0).toFixed(2)}%
            </div>
            <small className="text-muted">{payrollConfig.roleName}</small>
        </div>
      </td>
      <td>
        <span className="payrollConfig-pill">
          {Number(payrollConfig.epfEmployerRate || 0).toFixed(2)}%
        </span>
      </td>
      <td>
        <span className="payrollConfig-pill">
          {Number(payrollConfig.etfRate || 0).toFixed(2)}%
        </span>
      </td>
      <td>
        <div className="action-group">
          <button className="action-btn edit-btn" onClick={() => onEdit(payrollConfig)} title="Edit">
            <i className="bi bi-pencil-fill" />
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(payrollConfig)} title="Delete">
            <i className="bi bi-trash3-fill" />
          </button>
        </div>
      </td>
    </tr>
  );
});

/* ── Delete confirmation modal ── */
const DeleteModal = memo(({ payrollConfig, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <h5>Delete Configuration?</h5>
        <p>Are you sure you want to delete the record for <strong>{payrollConfig.roleName}</strong>?</p>
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

function PayrollConfig() {
  const [payrollConfigList, setPayrollConfigList] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const fetchPayrollConfigList = useCallback(() => {
    setLoading(true);
    PayrollConfigService.getAllPayrollConfig()
      .then((data) => setPayrollConfigList(Array.isArray(data) ? data : []))
      .catch((err) => { 
        console.error(err); 
        showToast("Failed to load payroll configurations", "error"); 
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    fetchPayrollConfigList();
  }, [fetchPayrollConfigList]);

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

  const handleEdit = useCallback((payrollConfig) => {
    setForm({
      roleName: String(payrollConfig.roleName ?? ""),
      epfEmployeeRate: String(payrollConfig.epfEmployeeRate ?? ""),
      epfEmployerRate: String(payrollConfig.epfEmployerRate ?? ""),
      etfRate: String(payrollConfig.etfRate ?? ""),
    });
    setEditingId(payrollConfig.id ?? payrollConfig._id ?? payrollConfig.payrollConfigId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { 
        ...form, 
        epfEmployeeRate: Number(form.epfEmployeeRate),
        epfEmployerRate: Number(form.epfEmployerRate),
        etfRate: Number(form.etfRate)
    };

    const action = editingId
      ? PayrollConfigService.updatePayrollConfig({ ...payload, id: editingId })
      : PayrollConfigService.createPayrollConfig(payload);

    action
      .then(() => {
        fetchPayrollConfigList();
        showToast(editingId ? "Configuration updated!" : "Configuration created!");
        handleClear();
      })
      .catch((err) => { 
        console.error(err); 
        showToast("Operation failed", "error"); 
      })
      .finally(() => setLoading(false));
  }, [form, editingId, fetchPayrollConfigList, showToast, handleClear]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id ?? deleteTarget._id ?? deleteTarget.payrollConfigId;
    
    // Matched your service naming convention
    PayrollConfigService.deletePayrollConfig(id)
      .then(() => { 
        fetchPayrollConfigList(); 
        showToast("Record deleted successfully"); 
      })
      .catch((err) => { 
        console.error(err); 
        showToast("Delete failed", "error"); 
      })
      .finally(() => setDeleteTarget(null));
  }, [deleteTarget, fetchPayrollConfigList, showToast]);

  // Defined "filtered" so the map function doesn't crash
  const filtered = payrollConfigList; 
  const isEdit = editingId !== null;

  return (
    <div className="payrollConfig-page">
      {toast && (
        <div className={`toast-bar ${toast.type}`}>
          <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
          {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          payrollConfig={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="payrollConfig-header">
        <div>
          <h2>
            <i className="bi-sliders2-vertical me-2" style={{ color: "#3b62f6" }} />
            Payroll Configuration
          </h2>
        </div>
        <span className="payrollConfig-count">{payrollConfigList.length} Records</span>
      </div>

      <div className="payrollConfig-card">
        <div className="payrollConfig-card-header">
          <div className="card-icon blue"><i className="bi bi-gear-wide-connected" /></div>
          <div>
            <div className="card-title">{isEdit ? "Edit Configuration" : "New Configuration"}</div>
          </div>
        </div>

        <form className="payrollConfig-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label-sm">Employee EPF %</label>
              <input type="number" name="epfEmployeeRate" className="payrollConfig-input" value={form.epfEmployeeRate} onChange={handleChange} step="0.01" required />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm">Employer EPF %</label>
              <input type="number" name="epfEmployerRate" className="payrollConfig-input" value={form.epfEmployerRate} onChange={handleChange} step="0.01" required />
            </div>
            <div className="col-md-3">
              <label className="form-label-sm">Employer ETF %</label>
              <input type="number" name="etfRate" className="payrollConfig-input" value={form.etfRate} onChange={handleChange} step="0.01" required />
            </div>
          </div>

          <div className="form-actions mt-3">
            <button type="submit" className={isEdit ? "btn-update" : "btn-save"} disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Record" : "Save Record"}
            </button>
            <button type="button" className="btn-clear" onClick={handleClear}>Clear</button>
          </div>
        </form>
      </div>

      <div className="payrollConfig-card">
        <div className="payrollConfig-table-wrap">
          <table className="payrollConfig-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee EPF</th>
                <th>Employer EPF</th>
                <th>Employer ETF</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && payrollConfigList.length === 0 ? (
                <tr><td colSpan="5" className="text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="text-center">No records found.</td></tr>
              ) : (
                filtered.map((item, i) => (
                  <PayrollConfigRow
                    key={item.id || item._id || i}
                    payrollConfig={item}
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

export default PayrollConfig;