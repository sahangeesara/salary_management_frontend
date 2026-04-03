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

const isUserEnabled = (val) => {
  if (val === true || val === 1 || String(val).toLowerCase() === "true" || String(val) === "1") {
    return true;
  }
  return false;
};

// ── Row Component ─────────────────────────────────────────────────────────
const UserRow = memo(({ user, index, onEdit, onDelete }) => {
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
          <button className="action-btn edit-btn" onClick={() => onEdit(user)} title="Edit">
            <i className="bi bi-pencil-fill" />
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(user.id)} title="Delete">
            <i className="bi bi-trash3-fill" />
          </button>
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
  const [loading, setLoading] = useState(false); // Now utilized
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000); // Auto-hide toast
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UserService.getAllUsers();
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
      enabled: isUserEnabled(user.enabled),
    });
    setEditingId(user.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setLoading(true);
      try {
        await UserService.deleteUser(id);
        showToast("User deleted successfully");
        fetchUsers();
      } catch (err) {
        showToast("Failed to delete user", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form };
    if (editingId) payload.id = editingId;

    try {
      if (editingId) await UserService.updateUser(payload);
      else await UserService.createUser(payload);
      
      showToast(editingId ? "User updated!" : "User created!");
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
    const s = search.toLowerCase();
    return users.filter(u => 
      u.username?.toLowerCase().includes(s) || 
      u.email?.toLowerCase().includes(s)
    );
  }, [users, search]);

  return (
    <div className="emp-page">
      {toast && <div className={`toast-bar ${toast.type}`}>{toast.msg}</div>}

      <div className="emp-header">
        <div>
          <h2>User Management</h2>
          <span className="emp-count">{users.length} Users Found</span>
        </div>
        {loading && <div className="spinner-border text-primary" role="status" />}
      </div>

      <div className="emp-card">
        <form className="emp-form-body" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label>Username</label>
              <input name="username" className="emp-input" value={form.username} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="col-md-4">
              <label>Email</label>
              <input name="email" type="email" className="emp-input" value={form.email} onChange={handleChange} required disabled={loading} />
            </div>
            {!editingId && (
              <div className="col-md-4">
                <label>Password</label>
                <input name="password" type="password" className="emp-input" value={form.password} onChange={handleChange} required disabled={loading} />
              </div>
            )}
            <div className="col-md-4">
              <label>Role</label>
              <select name="role" className="emp-input" value={form.role} onChange={handleChange} disabled={loading}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <label className="d-flex align-items-center gap-2 mb-2">
                <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} disabled={loading} />
                <b>Account Enabled</b>
              </label>
            </div>
          </div>
          <div className="form-actions mt-3">
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Processing..." : editingId ? "Update User" : "Save User"}
            </button>
            <button type="button" className="btn-clear" onClick={() => {setForm(EMPTY_FORM); setEditingId(null);}} disabled={loading}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="emp-card mt-4">
        <div className="p-3">
          <input 
            className="search-input" 
            placeholder="Search by name or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr><th>#</th><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u, i) => (
                  <UserRow 
                    key={u.id} 
                    user={u} 
                    index={i} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                  />
                ))
              ) : (
                <tr><td colSpan="6" className="text-center p-4">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default User;