import React, { useState, useEffect, useCallback, memo } from "react";
import EmployeeService from "../../service/EmployeeService";
import UserService from "../../service/UserService";
import DepartmentService from "../../service/DepartmentService";
import DesignationService from "../../service/DesignationService";
import BasicSalaryService from "../../service/BasicSalaryService";
import "./employee.css";

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "",
  basicSalary: "", userId: "",
  departmentId: "", designationId: "", status: "ACTIVE",
};

// Utility to ensure only strings/numbers are rendered
function safeString(val) {
  if (typeof val === "string" || typeof val === "number") return val;
  if (val && typeof val === "object" && "name" in val) return val.name;
  return "";
}

// Helper: ensure option exists in array, if not, add fallback
function ensureOption(options, id, label) {
  if (!id) return options;
  if (!options.some(opt => String(opt.id) === String(id))) {
    return [...options, { id, name: label || `Not in list (${id})` }];
  }
  return options;
}

const EmployeeRow = memo(({ emp, index, onEdit, onDelete, departments, designations }) => {
  const departmentName =
      emp.department?.name ||
      departments.find(d => String(d.id) === String(emp.departmentId))?.name ||
      "—";

  const designationName =
      emp.designation?.name ||
      designations.find(d => String(d.id) === String(emp.designationId))?.name ||
      "—";
  return (
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
            <div className="emp-dept-tag">
              {typeof departmentName === "object" ? departmentName?.name : departmentName}
            </div>
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
      <td>{safeString(designationName)}</td>
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
  );
});

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
  const [departments, setDepartments]           = useState([]);
  const [designations, setDesignations]         = useState([]);
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
        console.log('Fetched users:', data); // Diagnostic log
        const arr = Array.isArray(data) ? data : [];
        // TEMP: Show all users for debugging
        setUsers(arr);
        // Original filter:
        // const employeeUsers = arr.filter(u => u.role === "EMPLOYEE");
        // setUsers(employeeUsers);
      })
      .catch(err => { console.error(err); showToast("Failed to load users", "error"); });
  }, [showToast]);

  const fetchDepartments = useCallback(() => {
    DepartmentService.getAllDepartments()
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch(err => { console.error(err); showToast("Failed to load departments", "error"); });
  }, [showToast]);

  const fetchDesignations = useCallback(() => {
    DesignationService.getAllDesignations()
      .then(data => setDesignations(Array.isArray(data) ? data : []))
      .catch(err => { console.error(err); showToast("Failed to load designations", "error"); });
  }, [showToast]);

  useEffect(() => {
    fetchEmployees();
    fetchUsers();
    fetchDepartments();
    fetchDesignations();
  }, [fetchEmployees, fetchUsers, fetchDepartments, fetchDesignations]);

  /* auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // Helper to fetch and set basic salary for a userId using user's role
  const fetchAndSetBasicSalary = useCallback((userId) => {
    if (!userId) return;
    setSalaryLoading(true);
    UserService.getUserById(userId)
      .then(user => {
        if (user && user.role) {
          return BasicSalaryService.getBasicSalaryByRole(user.role)
            .then(salaryMap => {
              // The backend returns a map: { ROLE_X: amount }
              const amount = salaryMap && typeof salaryMap === 'object' ? Object.values(salaryMap)[0] : "";
              setForm(prev => ({
                ...prev,
                userId,
                basicSalary: amount !== undefined ? amount : "",
              }));
            });
        } else {
          setForm(prev => ({ ...prev, userId, basicSalary: "" }));
        }
      })
      .catch(err => {
        console.error("Could not load user or salary", err);
        setForm(prev => ({ ...prev, userId, basicSalary: "" }));
      })
      .finally(() => setSalaryLoading(false));
  }, []);

  const handleUserChange = useCallback((e) => {
    const selectedUserId = e.target.value;
    setForm(prev => ({ ...prev, userId: selectedUserId, basicSalary: "" }));
    fetchAndSetBasicSalary(selectedUserId);
  }, [fetchAndSetBasicSalary]);

  const handleClear = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((emp) => {
    // Wait for departments, designations, users to be loaded
    const setFormWithFallbacks = () => {
      // Add fallback options if needed
      setDepartments(prev => ensureOption(prev, emp.department?.id || emp.departmentId, emp.department?.name));
      setDesignations(prev => ensureOption(prev, emp.designation?.id || emp.designationId, emp.designation?.name));
      setUsers(prev => ensureOption(prev, emp.user_id || emp.userId, emp.user?.username || emp.user?.email || `User ${emp.user_id || emp.userId}`));
      setForm({
        firstName:   emp.firstName   || "",
        lastName:    emp.lastName    || "",
        email:       emp.email       || "",
        phone:       emp.phone       || "",
        basicSalary: emp.basicSalary || "",
        userId:      emp.user_id     || emp.userId || "",
        departmentId: emp.department?.id || emp.departmentId || "",
        designationId: emp.designation?.id || emp.designationId || "",
        status:      emp.status      || "ACTIVE",
      });
      setEditingId(emp.id ?? emp._id ?? emp.employeeId);
      // Salary/user fallback logic remains
      if ((emp.user_id || emp.userId) && !users.find(u => String(u.id) === String(emp.user_id || emp.userId))) {
        UserService.getUserById(emp.user_id || emp.userId)
          .then(user => {
            if (user && user.id) {
              setUsers(prev => [...prev, user]);
            }
          })
          .catch(() => {});
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // If any dropdown data is missing, wait for it to load
    if (departments.length === 0 || designations.length === 0 || users.length === 0) {
      Promise.all([
        departments.length ? Promise.resolve() : DepartmentService.getAllDepartments().then(setDepartments),
        designations.length ? Promise.resolve() : DesignationService.getAllDesignations().then(setDesignations),
        users.length ? Promise.resolve() : UserService.getAllUsers().then(setUsers),
      ]).then(setFormWithFallbacks);
    } else {
      setFormWithFallbacks();
    }
  }, [departments, designations, users]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLoading(true);
    // Transform payload to match backend expectations
    const payload = {
      ...form,
      user_id: form.userId,
      department: form.departmentId ? { id: form.departmentId } : null,
      designation: form.designationId ? { id: form.designationId } : null,
    };
    delete payload.userId;
    delete payload.departmentId;
    delete payload.designationId;
    const action = editingId
      ? EmployeeService.updateEmployee({ ...payload, id: editingId })
      : EmployeeService.createEmployee(payload);
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
    setSalaryLoading(true);
    const currentUserId = form.userId;
    if (!currentUserId) {
      setForm(prev => ({ ...prev, basicSalary: "" }));
      setSalaryLoading(false);
      return;
    }
    // Just clear the salary field for delete confirm, or implement your own logic if needed
    setForm(prev => ({ ...prev, basicSalary: "" }));
    setSalaryLoading(false);
  }, [form.userId]);

  const filtered = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return (
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone.includes(search) ||
      fullName.includes(search)
    );
  });

  const isEdit = editingId !== null;


  // Define selectedUser for fallback logic
  const selectedUser = users.find(u => String(u.id) === String(form.userId));
  const fallbackUserOption = !selectedUser && form.userId
    ? <option value={form.userId}>Linked user (not in list)</option>
    : null;


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
                    {u.username ? `${u.username} — ${u.email}` : u.email || u.id}
                  </option>
                ))}
                {fallbackUserOption}
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

            {/* ── Department Dropdown ── */}
            <div className="col-md-4">
              <label className="form-label-sm">Department</label>
              <select
                name="departmentId"
                className="emp-input emp-select"
                value={form.departmentId}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dep => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
                {!departments.some(dep => String(dep.id) === String(form.departmentId)) && form.departmentId && (
                  <option value={form.departmentId}>Not in list ({form.departmentId})</option>
                )}
              </select>
            </div>

            {/* ── Designation Dropdown ── */}
            <div className="col-md-4">
              <label className="form-label-sm">Designation</label>
              <select
                name="designationId"
                className="emp-input emp-select"
                value={form.designationId}
                onChange={handleChange}
                required
              >
                <option value="">Select Designation</option>
                {designations.map(des => (
                  <option key={des.id} value={des.id}>{des.name}</option>
                ))}
                {!designations.some(des => String(des.id) === String(form.designationId)) && form.designationId && (
                  <option value={form.designationId}>Not in list ({form.designationId})</option>
                )}
              </select>
            </div>

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
                    departments={departments}
                    designations={designations}
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
