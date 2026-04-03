import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import UserService from "../../service/UserService";
import "./user.css";

// ── Configuration ──
const ROLES = ["ROLE_MANAGER", "ROLE_CHEF", "ROLE_CASHIER", "ROLE_USER", "ROLE_ADMIN", "ROLE_WAITER"];

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  role: "ROLE_USER",
  enabled: true,
};

/**
 * ✅ BULLETPROOF BOOLEAN HELPER
 * This handles: true, 1, "1", "true" -> all become TRUE
 */
const isUserEnabled = (val) => {
  console.log("Checking enabled value:", val, typeof val); // Debug log to see the actual value and type
  if (val === true || val === 1 || String(val).toLowerCase() === "true" || String(val) === "1") {
    return true;
  }
  return false;
};

// ── Row Component ─────────────────────────────────────────────────────────
const UserRow = memo(({ user, index, onEdit, onDelete }) => {
  // Use the helper to determine the status badge color and text
  const active = isUserEnabled(user.enabled);

  return (
    <tr style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}>
      <td><span className="emp-index">{String(index + 1).padStart(2, "0")}</span></td>
      <td>
        <div className="emp-name-cell">
          <div className="emp-avatar">{user.username?.[0]?.toUpperCase() || "?"}</div>
          <div>
            <div className="emp-fullname">{user.username}</div>
            <div className="emp-dept-tag">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</div>
          </div>
        </div>
      </td>
      <td><span className="emp-meta">{user.email}</span></td>
      <td><span className="salary-pill">{user.role?.replace("ROLE_", "")}</span></td>
      
    
      <td>
        <span className={`status-badge ${active ? "status-active" : "status-inactive"}`}>
          <span className="status-dot" />
          {active ? "ENABLED" : "DISABLED"}
        </span>
      </td>

      <td>
        <div className="action-group">
          <button className="action-btn edit-btn" onClick={() => onEdit(user)}><i className="bi bi-pencil-fill" /></button>
          <button className="action-btn delete-btn" onClick={() => onDelete(user)}><i className="bi bi-trash3-fill" /></button>
        </div>
      </td>
    </tr>
  );
});

// ── Main Component ────────────────────────────────────────────────────────
function User() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UserService.getAllUsers();
      // Debug: Check your console to see exactly what 'enabled' looks like
      console.log("Raw User Data from API:", data); 
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleEdit = useCallback((user) => {
    setForm({
      username: user.username || "",
      email: user.email || "",
      password: "", 
      role: user.role || "ROLE_USER",
      enabled: isUserEnabled(user.enabled), // Convert DB 1/0 to JS true/false
    });
    setEditingId(user.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form };
    if (editingId) payload.id = editingId;

    try {
      if (editingId) await UserService.updateUser(payload);
      else await UserService.createUser(payload);
      showToast("Success!");
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      showToast("Error saving data", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.username?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  return (
    <div className="emp-page">
      {toast && <div className={`toast-bar ${toast.type}`}>{toast.msg}</div>}

      <div className="emp-header">
        <h2>User Management</h2>
        <span className="emp-count">{users.length} Users Found</span>
      </div>

      {/* Input Form */}
      <div className="emp-card">
        <form className="emp-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label>Username</label>
              <input name="username" className="emp-input" value={form.username} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <label>Email</label>
              <input name="email" type="email" className="emp-input" value={form.email} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <label>Role</label>
              <select name="role" className="emp-input" value={form.role} onChange={handleChange}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="d-flex align-items-center gap-2 mt-2">
                <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} />
                <b>Account Enabled</b>
              </label>
            </div>
          </div>
          <div className="form-actions mt-3">
            <button type="submit" className="btn-save">{editingId ? "Update" : "Save"}</button>
            <button type="button" className="btn-clear" onClick={() => {setForm(EMPTY_FORM); setEditingId(null);}}>Clear</button>
          </div>
        </form>
      </div>

      {/* User Table */}
      <div className="emp-card mt-4">
        <div className="p-3"><input className="search-input" placeholder="Search users..." onChange={e => setSearch(e.target.value)} /></div>
        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr><th>#</th><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <UserRow key={u.id} user={u} index={i} onEdit={handleEdit} onDelete={(user) => fetchUsers()} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default User;