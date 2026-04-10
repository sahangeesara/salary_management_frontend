import React, { useState, useEffect, useCallback, memo } from "react";
import DepartmentService from "../../service/DepartmentService";
import "./department.css";

const EMPTY_FORM = { name: "" };

/* ── Memo-ised table row ── */
const DepartmentRow = memo(({ department, index, onEdit, onDelete }) => {
    return (
        <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
            <td><span className="department-index">{String(index + 1).padStart(2, "0")}</span></td>
            <td>{department.name}</td>
            <td>
                <div className="action-group">
                    <button className="action-btn edit-btn" onClick={() => onEdit(department)} title="Edit">
                        <i className="bi bi-pencil-fill" />
                    </button>
                    <button className="action-btn delete-btn" onClick={() => onDelete(department)} title="Delete">
                        <i className="bi bi-trash3-fill" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

/* ── Delete confirmation modal ── */
const DeleteModal = memo(({ department, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon"><i className="bi bi-exclamation-triangle-fill" /></div>
                <h5>Delete department?</h5>
                <p>
                    Are you sure you want to remove the<strong>{department?.name?.name}</strong> department?
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

function Department() {
    const [departmentList, setdepartmentList] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

    const fetchdepartmentList = useCallback(() => {
        setLoading(true);
        DepartmentService.getAllDepartments()
            .then((data) => setdepartmentList(Array.isArray(data) ? data : []))
            .catch((err) => { console.error(err); showToast("Failed to load departments", "error"); })
            .finally(() => setLoading(false));
    }, [showToast]);

    useEffect(() => {
        fetchdepartmentList();
    }, [fetchdepartmentList]);

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

    const handleEdit = useCallback((department) => {
        setForm({
            name: department.name,
        });
        setEditingId(department.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setLoading(true);
        const action = editingId
            ? DepartmentService.updateDepartment({ ...form, id: editingId })
            : DepartmentService.createDepartment(form);

        action
            .then(() => {
                fetchdepartmentList();
                showToast(editingId ? "Department updated!" : "Department created!");
                handleClear();
            })
            .catch((err) => { console.error(err); showToast("Operation failed", "error"); })
            .finally(() => setLoading(false));
    }, [form, editingId, fetchdepartmentList, showToast, handleClear]);

    const handleDelete = useCallback((department) => {
        setDeleteTarget(department);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        setLoading(true);
        DepartmentService.deleteDepartment(deleteTarget.id)
            .then(() => {
                fetchdepartmentList();
                showToast("Department deleted");
            })
            .catch((err) => { console.error(err); showToast("Delete failed", "error"); })
            .finally(() => {
                setDeleteTarget(null);
                setLoading(false);
            });
    }, [deleteTarget, fetchdepartmentList, showToast]);

    return (
        <div className="department-page">
            {toast && (
                <div className={`toast-bar ${toast.type}`}>
                    <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
                    {toast.msg}
                </div>
            )}
            {deleteTarget && (
                <DeleteModal
                    department={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
            <div className="department-header">
                <h2><i className="bi bi-building me-2" style={{ color: "#3b62f6" }} />Department Management</h2>
            </div>
            <div className="department-card">
                <div className="department-card-header">
                    <div className="card-title">{editingId ? "Edit Department" : "Add New Department"}</div>
                </div>
                <form className="department-form-body" onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label-sm">Department Name</label>
                            <input
                                type="text"
                                name="name"
                                className="department-input"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Department Name"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className={editingId ? "btn-update" : "btn-save"} disabled={loading}>
                            <i className={`bi ${editingId ? "bi-check2-circle" : "bi-save-fill"}`} />
                            {loading ? "Processing..." : editingId ? "Update Department" : "Save Department"}
                        </button>
                        <button type="button" className="btn-clear" onClick={handleClear}>
                            <i className="bi bi-x-circle" /> Clear
                        </button>
                    </div>
                </form>
            </div>
            <div className="department-card">
                <div className="department-card-header" style={{ paddingBottom: "16px", borderBottom: "1px solid #f0f2f7" }}>
                    <div className="card-title">Department List</div>
                </div>
                <div className="department-table-wrap">
                    <table className="department-table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading && departmentList.length === 0 ? (
                            <tr className="loading-row">
                                <td colSpan="3">
                                    <div className="spinner" />
                                    Loading records...
                                </td>
                            </tr>
                        ) : departmentList.length === 0 ? (
                            <tr>
                                <td colSpan="3">No departments found</td>
                            </tr>
                        ) : (
                            departmentList.map((dept, i) => (
                                <DepartmentRow
                                    key={dept.id}
                                    department={dept}
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

export default Department;
