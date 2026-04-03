import React, { useState, useEffect, useCallback, memo } from "react";
import EmployeeService from "../../service/EmployeeService";
import UserService from "../../service/UserService";
import BasicSalaryService from "../../service/BasicSalaryService";
import "./employee.css";

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "",
  basicSalary: "", userId: "",
  department: "", designation: "", status: "ACTIVE",
};

const EmployeeRow = memo(({ emp, index, onEdit, onDelete }) => (
  <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
    <td>
      <span className="emp-index">{String(index + 1).padStart(2, "0")}</span>
    </td>
    <td>
      <div className="emp-name-cell">
        <div className="emp-avatar">
          {emp.firstName?.[0]}{emp.lastName?.[0]}
        </div>
        <div>
          <div className="emp-fullname">{emp.firstName} {emp.lastName}</div>
          <div className="emp-dept-tag">{emp.department || "—"}</div>
        </div>
      </div>
    </td>
    <td><span className="emp-meta"><i className="bi bi-envelope me-1" />{emp.email}</span></td>
    <td><span className="emp-meta"><i className="bi bi-telephone me-1" />{emp.phone || "—"}</span></td>
    <td>
      <span className="salary-pill">
        <i className="bi bi-currency-dollar" />
        {Number(emp.basicSalary || 0).toLocaleString()}
      </span>
    </td>
    <td>{emp.designation || "—"}</td>
    <td>
      <span className={`status-badge ${emp.status === "ACTIVE" ? "status-active" : "status-inactive"}`}>
        <span className="status-dot" />
        {emp.status}
      </span>
    </td>
    <td>
      <div className="action-group">
        <button className="action-btn edit-btn" onClick={() => onEdit(emp)} title="Edit">
          <i className="bi bi-pencil-fill" />
        </button>
        <button className="action-btn delete-btn" onClick={() => onDelete(emp)} title="Delete">
          <i className="bi bi-trash3-fill" />
        </button>
      </div>
    </td>
  </tr>
));

const DeleteModal = memo(({ employee, onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
      <div className="confirm-icon"><i className="bi bi-exclamation-triangle-fill" /></div>
      <h5>Delete Employee?</h5>
      <p>
        Are you sure you want to remove{" "}
        <strong>{employee?.firstName} {employee?.lastName}</strong>?
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
));


function Employee() {
  const [employees, setEmployees]               = useState([]);
  const [users, setUsers]                       = useState([]);
  const [allBasicSalaries, setAllBasicSalaries] = useState([]);
  const [form, setForm]                         = useState(EMPTY_FORM);
  const [editingId, setEditingId]               = useState(null);
  const [deleteTarget, setDeleteTarget]         = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [salaryLoading, setSalaryLoading]       = useState(false);
  const [toast, setToast]                       = useState(null);
  const [search, setSearch]                     = useState("");

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
  }, []);

  const fetchEmployees = useCallback(() => {
    setLoading(true);
    EmployeeService.getAllEmployees()
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(err => { console.error(err); showToast("Failed to load employees", "error"); })
      .finally(() => setLoading(false));
  }, [showToast]);

  const fetchUsers = useCallback(() => {
    UserService.getAllUsers()
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        // Role is a Java enum → serialized as plain string e.g. "EMPLOYEE"
        const employeeUsers = arr.filter(u => u.role === "EMPLOYEE");
        setUsers(employeeUsers);
      })
      .catch(err => { console.error(err); showToast("Failed to load users", "error"); });
  }, [showToast]);

  const fetchAllBasicSalaries = useCallback(() => {
    BasicSalaryService.getAllBasicSalary()
      .then(data => setAllBasicSalaries(Array.isArray(data) ? data : []))
      .catch(err => { console.error(err); showToast("Failed to load salary data", "error"); });
  }, [showToast]);

  useEffect(() => {
    fetchEmployees();
    fetchUsers();
    fetchAllBasicSalaries();
  }, [fetchEmployees, fetchUsers, fetchAllBasicSalaries]);

  /* auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // ── When userId changes → auto-fill basicSalary ──
  const handleUserChange = useCallback((e) => {
    const selectedUserId = e.target.value;

    setForm(prev => ({ ...prev, userId: selectedUserId, basicSalary: "" }));
    if (!selectedUserId) return;

    setSalaryLoading(true);

    const match = allBasicSalaries.find(
      s => String(s.userId ?? s.user?.id) === String(selectedUserId)
    );

    if (match) {
      setForm(prev => ({
        ...prev,
        userId:      selectedUserId,
        basicSalary: match.amount ?? match.basicSalary ?? match.salary ?? "",
      }));
      setSalaryLoading(false);
    } else {
      BasicSalaryService.getAllBasicSalary()
        .then(data => {
          const fresh = Array.isArray(data) ? data : [];
          setAllBasicSalaries(fresh);
          const found = fresh.find(
            s => String(s.userId ?? s.user?.id) === String(selectedUserId)
          );
          setForm(prev => ({
            ...prev,
            userId:      selectedUserId,
            basicSalary: found
              ? (found.amount ?? found.basicSalary ?? found.salary ?? "")
              : "",
          }));
        })
        .catch(err => { console.error(err); showToast("Could not load salary", "error"); })
        .finally(() => setSalaryLoading(false));
    }
  }, [allBasicSalaries, showToast]);

  const handleClear = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((emp) => {
    setForm({
      firstName:   emp.firstName   || "",
      lastName:    emp.lastName    || "",
      email:       emp.email       || "",
      phone:       emp.phone       || "",
      basicSalary: emp.basicSalary || "",
      userId:      emp.userId      || "",
      department:  emp.department  || "",
      designation: emp.designation || "",
      status:      emp.status      || "ACTIVE",
    });
    setEditingId(emp.id ?? emp._id ?? emp.employeeId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLoading(true);
    const action = editingId
      ? EmployeeService.updateEmployee({ ...form, id: editingId })
      : EmployeeService.createEmployee(form);
    action
      .then(() => {
        fetchEmployees();
        showToast(editingId ? "Employee updated!" : "Employee created!");
        handleClear();
      })
      .catch(err => { console.error(err); showToast("Operation failed", "error"); })
      .finally(() => setLoading(false));
  }, [form, editingId, fetchEmployees, showToast, handleClear]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id ?? deleteTarget._id ?? deleteTarget.employeeId;
    EmployeeService.deleteEmployee(id)
      .then(() => { fetchEmployees(); showToast("Employee deleted"); })
      .catch(err => { console.error(err); showToast("Delete failed", "error"); })
      .finally(() => setDeleteTarget(null));
  }, [deleteTarget, fetchEmployees, showToast]);

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    return (
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
      (emp.email       || "").toLowerCase().includes(q) ||
      (emp.department  || "").toLowerCase().includes(q) ||
      (emp.designation || "").toLowerCase().includes(q)
    );
  });

  const isEdit = editingId !== null;

  return (
    <div className="emp-page">

      {toast && (
        <div className={`toast-bar ${toast.type}`}>
          <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
          {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          employee={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="emp-header">
        <div>
          <h2>
            <i className="bi bi-people-fill me-2" style={{ color: "#3b62f6" }} />
            Employee Management
          </h2>
        </div>
        <span className="emp-count">{employees.length} employees</span>
      </div>

      {/* ── Form card ── */}
      <div className="emp-card">
        <div className="emp-card-header">
          <div className="card-icon blue"><i className="bi bi-person-plus-fill" /></div>
          <div>
            <div className="card-title">{isEdit ? "Edit Employee" : "Add New Employee"}</div>
            <div className="card-subtitle">
              {isEdit ? "Update the employee's information" : "Fill in the details below"}
            </div>
          </div>
          <span className={`mode-tag ${isEdit ? "edit" : "create"}`}>
            <i className={`bi ${isEdit ? "bi-pencil-fill" : "bi-plus-circle-fill"}`} />
            {isEdit ? "Edit Mode" : "Create Mode"}
          </span>
        </div>

        <form className="emp-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">

            {[
              { label: "First Name", name: "firstName", type: "text",  col: 6, required: true },
              { label: "Last Name",  name: "lastName",  type: "text",  col: 6, required: true },
              { label: "Email",      name: "email",     type: "email", col: 6, required: true },
              { label: "Phone",      name: "phone",     type: "text",  col: 6 },
            ].map(({ label, name, type, col, required }) => (
              <div key={name} className={`col-md-${col}`}>
                <label className="form-label-sm">{label}</label>
                <input
                  type={type}
                  name={name}
                  className="emp-input"
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={label}
                  required={required}
                />
              </div>
            ))}

            {/* ── Linked User — shows username + email from User entity ── */}
            <div className="col-md-6">
              <label className="form-label-sm">
                Linked User
                <span style={{ marginLeft: 6, fontSize: "11px", color: "var(--color-text-secondary)" }}>
                  ({users.length} available)
                </span>
              </label>
              <select
                name="userId"
                className="emp-input emp-select"
                value={form.userId}
                onChange={handleUserChange}
              >
                <option value="">— Select employee user —</option>
                {users.map(u => (
                  // User entity: id, username, email, role, enabled, createdAt
                  <option key={u.id} value={u.id}>
                    {u.username} — {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Basic Salary — auto-filled on user select ── */}
            <div className="col-md-6">
              <label className="form-label-sm">
                Basic Salary
                {salaryLoading && (
                  <span style={{ marginLeft: 8, fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    <i className="bi bi-arrow-repeat" /> Loading…
                  </span>
                )}
              </label>
              <input
                type="number"
                name="basicSalary"
                className="emp-input"
                value={form.basicSalary}
                onChange={handleChange}
                placeholder={salaryLoading ? "Fetching salary…" : "Auto-filled from user salary"}
                readOnly={salaryLoading}
              />
            </div>

            {[
              { label: "Department",  name: "department",  col: 4 },
              { label: "Designation", name: "designation", col: 4 },
            ].map(({ label, name, col }) => (
              <div key={name} className={`col-md-${col}`}>
                <label className="form-label-sm">{label}</label>
                <input
                  type="text"
                  name={name}
                  className="emp-input"
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={label}
                />
              </div>
            ))}

            <div className="col-md-4">
              <label className="form-label-sm">Status</label>
              <select
                name="status"
                className="emp-input emp-select"
                value={form.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

          </div>

          <div className="form-actions">
            {isEdit ? (
              <button type="submit" className="btn-update" disabled={loading}>
                <i className="bi bi-check2-circle" />
                {loading ? "Updating…" : "Update Employee"}
              </button>
            ) : (
              <button type="submit" className="btn-save" disabled={loading}>
                <i className="bi bi-person-plus-fill" />
                {loading ? "Saving…" : "Save Employee"}
              </button>
            )}
            <button type="button" className="btn-clear" onClick={handleClear}>
              <i className="bi bi-x-circle" /> Clear
            </button>
          </div>
        </form>
      </div>

      {/* ── Table card ── */}
      <div className="emp-card">
        <div
          className="emp-card-header"
          style={{ paddingBottom: "16px", borderBottom: "1px solid #f0f2f7" }}
        >
          <div className="card-icon green"><i className="bi bi-table" /></div>
          <div>
            <div className="card-title">Employee List</div>
            <div className="card-subtitle">Manage all registered employees</div>
          </div>
          <div className="search-wrap ms-auto">
            <i className="bi bi-search" />
            <input
              className="search-input"
              placeholder="Search employees…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Salary</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan="8">
                    <div className="spinner" />
                    Loading employees…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="empty-icon"><i className="bi bi-people" /></div>
                      <div>{search ? "No results found" : "No employees yet"}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((emp, i) => (
                  <EmployeeRow
                    key={emp.id ?? emp._id ?? i}
                    emp={emp}
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

export default Employee;