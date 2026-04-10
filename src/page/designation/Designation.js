import React, { useState, useEffect, useCallback, memo } from "react";
import DesignationService from "../../service/DesignationService";
import "./designation.css";

const EMPTY_FORM = { name: "" };

/* ── Memo-ised table row ── */
const DesignationRow = memo(({ designation, index, onEdit, onDelete }) => {
    return (
        <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
            <td><span className="designation-index">{String(index + 1).padStart(2, "0")}</span></td>
            <td>{designation.name}</td>
            <td>
                <div className="action-group">
                    <button className="action-btn edit-btn" onClick={() => onEdit(designation)} title="Edit">
                        <i className="bi bi-pencil-fill" />
                    </button>
                    <button className="action-btn delete-btn" onClick={() => onDelete(designation)} title="Delete">
                        <i className="bi bi-trash3-fill" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

/* ── Delete confirmation modal ── */
const DeleteModal = memo(({ designation, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon"><i className="bi bi-exclamation-triangle-fill" /></div>
                <h5>Delete designation?</h5>
                <p>
                    Are you sure you want to remove the<strong>{designation?.name?.name}</strong> designation?
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

function Designation() {
    const [designationList, setdesignationList] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

    const fetchdesignationList = useCallback(() => {
        setLoading(true);
        DesignationService.getAllDesignations()
            .then((data) => setdesignationList(Array.isArray(data) ? data : []))
            .catch((err) => { console.error(err); showToast("Failed to load designations", "error"); })
            .finally(() => setLoading(false));
    }, [showToast]);

    useEffect(() => {
        fetchdesignationList();
    }, [fetchdesignationList]);

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

    const handleEdit = useCallback((designation) => {
        setForm({
            name: designation.name,
        });
        setEditingId(designation.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setLoading(true);
        const action = editingId
            ? DesignationService.updateDesignation({ ...form, id: editingId })
            : DesignationService.createDesignation(form);

        action
            .then(() => {
                fetchdesignationList();
                showToast(editingId ? "designation updated!" : "designation created!");
                handleClear();
            })
            .catch((err) => { console.error(err); showToast("Operation failed", "error"); })
            .finally(() => setLoading(false));
    }, [form, editingId, fetchdesignationList, showToast, handleClear]);

    const handleDelete = useCallback((designation) => {
        setDeleteTarget(designation);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        setLoading(true);
        DesignationService.deleteDesignation(deleteTarget.id)
            .then(() => {
                fetchdesignationList();
                showToast("designation deleted");
            })
            .catch((err) => { console.error(err); showToast("Delete failed", "error"); })
            .finally(() => {
                setDeleteTarget(null);
                setLoading(false);
            });
    }, [deleteTarget, fetchdesignationList, showToast]);

    return (
        <div className="designation-page">
            {toast && (
                <div className={`toast-bar ${toast.type}`}>
                    <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
                    {toast.msg}
                </div>
            )}
            {deleteTarget && (
                <DeleteModal
                    designation={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
            <div className="designation-header">
                <h2><i className="bi bi-building me-2" style={{ color: "#3b62f6" }} />designation Management</h2>
            </div>
            <div className="designation-card">
                <div className="designation-card-header">
                    <div className="card-title">{editingId ? "Edit designation" : "Add New designation"}</div>
                </div>
                <form className="designation-form-body" onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label-sm">designation Name</label>
                            <input
                                type="text"
                                name="name"
                                className="designation-input"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="designation Name"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className={editingId ? "btn-update" : "btn-save"} disabled={loading}>
                            <i className={`bi ${editingId ? "bi-check2-circle" : "bi-save-fill"}`} />
                            {loading ? "Processing..." : editingId ? "Update designation" : "Save designation"}
                        </button>
                        <button type="button" className="btn-clear" onClick={handleClear}>
                            <i className="bi bi-x-circle" /> Clear
                        </button>
                    </div>
                </form>
            </div>
            <div className="designation-card">
                <div className="designation-card-header" style={{ paddingBottom: "16px", borderBottom: "1px solid #f0f2f7" }}>
                    <div className="card-title">designation List</div>
                </div>
                <div className="designation-table-wrap">
                    <table className="designation-table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading && designationList.length === 0 ? (
                            <tr className="loading-row">
                                <td colSpan="3">
                                    <div className="spinner" />
                                    Loading records...
                                </td>
                            </tr>
                        ) : designationList.length === 0 ? (
                            <tr>
                                <td colSpan="3">No designations found</td>
                            </tr>
                        ) : (
                            designationList.map((dept, i) => (
                                <DesignationRow
                                    key={dept.id}
                                    designation={dept}
                                    index={i}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
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

export default Designation;
