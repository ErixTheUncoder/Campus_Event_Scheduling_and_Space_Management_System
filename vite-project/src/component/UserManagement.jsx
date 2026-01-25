import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE_URL) ||
  "http://127.0.0.1:5000";

const ADMIN_PREFIX = "/api/admin";

const ROLES = [
  { label: "Student", value: "STUDENT" },
  { label: "Event Organizer", value: "EVENT_ORGANIZER" },
  { label: "Admin", value: "ADMIN" },
];

function formatRole(roleValue) {
  if (!roleValue) return "-";
  const v = String(roleValue).toUpperCase();
  const match = ROLES.find((r) => r.value === v);
  return match ? match.label : roleValue;
}

function normalizeRoleFront(roleRaw) {
  if (!roleRaw) return "STUDENT";
  return String(roleRaw)
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_"); // spaces/hyphen -> underscore
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function pickAdminId(userObj) {
  return userObj?.user_id ?? userObj?.userId ?? userObj?.id ?? userObj?.admin_id ?? null;
}

export default function UserManagement() {
  const [user] = useState(() => getStoredUser());
  const adminId = useMemo(() => pickAdminId(user), [user]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  // Create user form
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    user_role: "STUDENT",
  });

  // Search
  const [search, setSearch] = useState("");

  // Selected users (multi-select)
  const [selected, setSelected] = useState(() => new Set());

  // Edit modal (per-user)
  const [editModal, setEditModal] = useState({
    open: false,
    userId: null,
    fullName: "",
    email: "",
    phone: "",
    isActive: true,
    role: "STUDENT",
    saving: false,
    error: "",
  });

  // Reset password modal (separate)
  const [pwModal, setPwModal] = useState({
    open: false,
    userId: null,
    fullName: "",
    newPassword: "",
    confirmPassword: "",
    error: "",
    saving: false,
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const blob = [
        u.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        String(u.is_active ? "active" : "inactive"),
        (u.user_role || "").toLowerCase(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [users, search]);

  async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${ADMIN_PREFIX}${path}`;
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }

    if (!res.ok) {
      const msg = data?.error || data?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  async function loadUsers() {
    if (!adminId) {
      setGlobalError("Admin ID not found. Please log in again.");
      return;
    }

    setLoading(true);
    setGlobalError("");
    setGlobalSuccess("");

    try {
      const data = await apiFetch(`/users?admin_id=${adminId}`, { method: "GET" });
      const list = data?.users || [];
      setUsers(list);

      // Remove selections that no longer exist
      setSelected((prev) => {
        const next = new Set();
        const existingIds = new Set(list.map((u) => u.user_id));
        for (const id of prev) {
          if (existingIds.has(id)) next.add(id);
        }
        return next;
      });
    } catch (err) {
      setGlobalError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateUser(e) {
    e.preventDefault();
    setGlobalError("");
    setGlobalSuccess("");

    if (!adminId) {
      setGlobalError("Admin ID not found. Please log in again.");
      return;
    }

    const payload = {
      full_name: createForm.full_name.trim(),
      email: createForm.email.trim(),
      phone_number: createForm.phone_number.trim(),
      password: createForm.password,
      user_role: createForm.user_role,
    };

    if (!payload.full_name || !payload.email || !payload.phone_number || !payload.password || !payload.user_role) {
      setGlobalError("Please fill in all fields to create a user.");
      return;
    }

    try {
      await apiFetch(`/users?admin_id=${adminId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setGlobalSuccess("User created successfully.");
      setCreateForm({
        full_name: "",
        email: "",
        phone_number: "",
        password: "",
        user_role: "STUDENT",
      });
      await loadUsers();
    } catch (err) {
      setGlobalError(err.message || "Failed to create user.");
    }
  }

  async function setUserActive(targetUserId, nextActive) {
    if (!adminId) throw new Error("Admin ID not found. Please log in again.");
    await apiFetch(`/users/${targetUserId}/active?admin_id=${adminId}&is_active=${nextActive}`, {
      method: "PATCH",
    });
  }

  // send BOTH keys so no matter backend expects role or user_role, it works
  async function changeUserRole(targetUserId, newRole) {
    if (!adminId) throw new Error("Admin ID not found. Please log in again.");

    await apiFetch(`/users/${targetUserId}/role?admin_id=${adminId}`, {
      method: "PATCH",
      body: JSON.stringify({
        admin_id: adminId,
        user_role: newRole,
        role: newRole,
      }),
    });
  }

  function openEditModal(u) {
    setEditModal({
      open: true,
      userId: u.user_id,
      fullName: u.full_name || "",
      email: u.email || "",
      phone: u.phone_number || "",
      isActive: !!u.is_active,
      role: normalizeRoleFront(u.user_role),
      saving: false,
      error: "",
    });
  }

  function closeEditModal() {
    setEditModal((prev) => ({ ...prev, open: false }));
  }

  async function saveEditModal() {
    setEditModal((prev) => ({ ...prev, error: "" }));
    setGlobalError("");
    setGlobalSuccess("");

    try {
      setEditModal((prev) => ({ ...prev, saving: true }));

      await changeUserRole(editModal.userId, editModal.role);
      await setUserActive(editModal.userId, editModal.isActive);

      setGlobalSuccess("User updated successfully.");
      closeEditModal();
      await loadUsers();
    } catch (err) {
      setEditModal((prev) => ({ ...prev, error: err.message || "Failed to update user." }));
    } finally {
      setEditModal((prev) => ({ ...prev, saving: false }));
    }
  }

  // Multi-select helpers
  function isAllVisibleSelected() {
    if (filteredUsers.length === 0) return false;
    return filteredUsers.every((u) => selected.has(u.user_id));
  }

  function toggleSelectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = filteredUsers.every((u) => next.has(u.user_id));
      if (allSelected) {
        filteredUsers.forEach((u) => next.delete(u.user_id));
      } else {
        filteredUsers.forEach((u) => next.add(u.user_id));
      }
      return next;
    });
  }

  function toggleSelectOne(userId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function bulkSetActive(nextActive) {
    setGlobalError("");
    setGlobalSuccess("");

    if (selected.size === 0) {
      setGlobalError("Please select at least one user.");
      return;
    }

    try {
      setLoading(true);

      for (const id of selected) {
        await setUserActive(id, nextActive);
      }

      setGlobalSuccess(`Updated ${selected.size} user(s) successfully.`);
      setSelected(new Set());
      await loadUsers();
    } catch (err) {
      setGlobalError(err.message || "Bulk update failed.");
    } finally {
      setLoading(false);
    }
  }

  // Reset password modal
  function openResetPasswordModal(u) {
    setPwModal({
      open: true,
      userId: u.user_id,
      fullName: u.full_name || "",
      newPassword: "",
      confirmPassword: "",
      error: "",
      saving: false,
    });
  }

  function closeResetPasswordModal() {
    setPwModal((prev) => ({ ...prev, open: false }));
  }

  async function submitResetPassword() {
    setPwModal((prev) => ({ ...prev, error: "" }));
    setGlobalError("");
    setGlobalSuccess("");

    if (!adminId) {
      setPwModal((prev) => ({ ...prev, error: "Admin ID not found. Please log in again." }));
      return;
    }

    if (!pwModal.newPassword || pwModal.newPassword.length < 6) {
      setPwModal((prev) => ({ ...prev, error: "Password must be at least 6 characters." }));
      return;
    }
    if (pwModal.newPassword !== pwModal.confirmPassword) {
      setPwModal((prev) => ({ ...prev, error: "Passwords do not match." }));
      return;
    }

    try {
      setPwModal((prev) => ({ ...prev, saving: true }));
      await apiFetch(`/users/${pwModal.userId}/password?admin_id=${adminId}`, {
        method: "PATCH",
        body: JSON.stringify({ new_password: pwModal.newPassword }),
      });
      setGlobalSuccess("Password reset successfully.");
      closeResetPasswordModal();
    } catch (err) {
      setPwModal((prev) => ({ ...prev, error: err.message || "Failed to reset password." }));
    } finally {
      setPwModal((prev) => ({ ...prev, saving: false }));
    }
  }

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}></div>

      {globalError && <div className="alert alert-error" style={alertStyleError}>{globalError}</div>}
      {globalSuccess && <div className="alert alert-success" style={alertStyleSuccess}>{globalSuccess}</div>}

      <div className="card" style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 5 }}>Create Account</h2>
        <form onSubmit={handleCreateUser} className="form-grid-2">
          <div style={fieldStyle}>
            <label style={labelStyle}>Full Name</label>
            <input
              className="input form-control-lg"
              type="text"
              value={createForm.full_name}
              onChange={(e) => setCreateForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="e.g., Ali Bin Ahmad"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input
              className="input form-control-lg"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="e.g., ali@mmu.edu.my"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Phone Number</label>
            <input
                className="input form-control-lg"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={30}
                value={createForm.phone_number}
                onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "");
                    setCreateForm((p) => ({ ...p, phone_number: onlyDigits }));
                }}
                placeholder="e.g., 0123456789"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Temporary Password</label>
            <input
              className="input form-control-lg"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Set initial password"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Role</label>
            <select
              className="input form-control-lg"
              value={createForm.user_role}
              onChange={(e) => setCreateForm((p) => ({ ...p, user_role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "end" }}>
            <button className="btn" type="submit">Create User</button>
          </div>
        </form>
      </div>

      <div className="card" style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>All Users</h2>

          <input
            className="input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search (Name, Email, Phone, Role, Status...)"
            style={{
              width: 520,
              maxWidth: "100%",
              padding: "10px 12px",
              fontSize: 15,
              borderRadius: 10,
            }}
          />
        </div>

        {selected.size >= 2 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 10 }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Selected: <b>{selected.size}</b>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => bulkSetActive(true)} disabled={loading}>
                Set Active (Selected)
              </button>
              <button className="btn" onClick={() => bulkSetActive(false)} disabled={loading}>
                Set Inactive (Selected)
              </button>
            </div>
          </div>
        )}

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ ...tableStyle, minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 44, textAlign: "center" }}>
                  <input type="checkbox" checked={isAllVisibleSelected()} onChange={toggleSelectAllVisible} />
                </th>
                <th style={{ ...thStyle, width: 70, whiteSpace: "nowrap" }}>ID</th>
                <th style={{ ...thStyle, width: 180 }}>Full Name</th>
                <th style={{ ...thStyle, width: 260 }}>Email</th>
                <th style={{ ...thStyle, width: 140 }}>Phone</th>
                <th style={{ ...thStyle, width: 150 }}>Roles</th>
                <th style={{ ...thStyle, width: 120 }}>Status</th>
                <th style={{ ...thStyle, width: 90, textAlign: "center" }}>Edit</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.user_id}>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <input type="checkbox" checked={selected.has(u.user_id)} onChange={() => toggleSelectOne(u.user_id)} />
                  </td>

                  <td style={{ ...tdStyle, width: 70, whiteSpace: "nowrap" }}>{u.user_id}</td>
                  <td style={{ ...tdStyle, width: 180 }}>{u.full_name}</td>
                  <td style={{ ...tdStyle, width: 260 }}>{u.email}</td>
                  <td style={{ ...tdStyle, width: 140 }}>{u.phone_number}</td>
                  <td style={{ ...tdStyle, width: 150, whiteSpace: "nowrap" }}>{formatRole(u.user_role)}</td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        ...pillStyle,
                        background: u.is_active ? "#d1fae5" : "#fee2e2",
                        color: u.is_active ? "#065f46" : "#991b1b",
                      }}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button className="btn" style={iconBtnStyle} onClick={() => openEditModal(u)} title="Edit user">
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && filteredUsers.length === 0 && (
                <tr><td style={tdStyle} colSpan={8}>No users found.</td></tr>
              )}

              {loading && (
                <tr><td style={tdStyle} colSpan={8}>Loading users...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editModal.open && (
        <div style={modalOverlayStyle} onClick={closeEditModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: 5 }}>Edit User</h2>

            {editModal.error && <div style={inlineErrorStyle}>{editModal.error}</div>}

            <div className="form-grid-2-modal">
              <div style={fieldStyle}>
                <label className="form-label-lg">User ID</label>
                <input className="input form-control-lg" value={editModal.userId ?? ""} disabled />
              </div>

              <div style={fieldStyle}>
                <label className="form-label-lg">Full Name</label>
                <input className="input form-control-lg" value={editModal.fullName} disabled />
              </div>

              <div style={fieldStyle}>
                <label className="form-label-lg">Email</label>
                <input className="input form-control-lg" value={editModal.email} disabled />
              </div>

              <div style={fieldStyle}>
                <label className="form-label-lg">Phone</label>
                <input className="input form-control-lg" value={editModal.phone} disabled />
              </div>

              <div style={fieldStyle}>
                <label className="form-label-lg">Role</label>
                <select
                  className="input form-control-lg"
                  value={editModal.role}
                  onChange={(e) => setEditModal((p) => ({ ...p, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div style={fieldStyle}>
                <label className="form-label-lg">Active Status</label>
                <select
                  className="input form-control-lg"
                  value={editModal.isActive ? "ACTIVE" : "INACTIVE"}
                  onChange={(e) => setEditModal((p) => ({ ...p, isActive: e.target.value === "ACTIVE" }))}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button
                className="btn"
                onClick={() =>
                  openResetPasswordModal({
                    user_id: editModal.userId,
                    full_name: editModal.fullName,
                  })
                }
              >
                Reset Password
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={closeEditModal} disabled={editModal.saving}>
                  Cancel
                </button>
                <button className="btn" onClick={saveEditModal} disabled={editModal.saving}>
                  {editModal.saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pwModal.open && (
        <div style={modalOverlayStyle} onClick={closeResetPasswordModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Reset Password</h3>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                User: <b>{pwModal.fullName}</b> (ID: {pwModal.userId})
              </div>
            </div>

            {pwModal.error && <div style={inlineErrorStyle}>{pwModal.error}</div>}

            <div style={fieldStyle}>
              <label style={labelStyle}>New Password</label>
              <input
                className="input"
                type="password"
                value={pwModal.newPassword}
                onChange={(e) => setPwModal((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                className="input"
                type="password"
                value={pwModal.confirmPassword}
                onChange={(e) => setPwModal((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Re-enter new password"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={closeResetPasswordModal} disabled={pwModal.saving}>
                Cancel
              </button>
              <button className="btn" onClick={submitResetPassword} disabled={pwModal.saving}>
                {pwModal.saving ? "Saving..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Styles ---------- */
const cardStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: 16,
  marginTop: 16,
  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
};

const fieldStyle = { display: "flex", flexDirection: "column", gap: 6 };
const labelStyle = { fontSize: 15, fontWeight: 500, opacity: 0.9 };

const tableStyle = { width: "100%", borderCollapse: "collapse", tableLayout: "auto" };
const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid #eee",
  padding: "10px 8px",
  fontSize: 13,
  opacity: 0.8,
};
const tdStyle = {
  borderBottom: "1px solid #f2f2f2",
  padding: "10px 8px",
  verticalAlign: "top",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const pillStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const iconBtnStyle = { padding: "6px 10px", borderRadius: 10 };

const alertStyleError = {
  marginTop: 12,
  padding: 12,
  borderRadius: 10,
  background: "#fee2e2",
  color: "#991b1b",
};

const alertStyleSuccess = {
  marginTop: 12,
  padding: 12,
  borderRadius: 10,
  background: "#d1fae5",
  color: "#065f46",
};

const inlineErrorStyle = {
  marginBottom: 10,
  padding: 10,
  borderRadius: 10,
  background: "#fee2e2",
  color: "#991b1b",
  fontSize: 13,
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const modalStyle = {
  width: "100%",
  maxWidth: 560,
  background: "#fff",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
};
