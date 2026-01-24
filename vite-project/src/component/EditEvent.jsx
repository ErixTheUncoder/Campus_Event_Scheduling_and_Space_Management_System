import React, { useEffect, useState } from "react";

function EditEvent({ user }) {
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser?.user_id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);

  const [purposeModalOpen, setPurposeModalOpen] = useState(false);
  const [purposeModalText, setPurposeModalText] = useState("");

  const openPurposeModal = (text) => {
  setPurposeModalText(text || "-");
  setPurposeModalOpen(true);
  };

  const closePurposeModal = () => {
  setPurposeModalOpen(false);
  setPurposeModalText("");
  };

  const [form, setForm] = useState({
    event_name: "",
    event_date: "",
    start_time: "",
    end_time: "",
    purpose: "",
    documents: "",
  });

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/event-requests/?viewer_id=${userId}&status=PENDING`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setItems(data.event_requests || []);
    } catch (e) {
      setError(e.message || "Failed to load pending events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openEdit = (req) => {
    setActive(req);

    // Convert times like "10:00:00" -> "10:00" for <input type="time">
    const toHHMM = (t) => (t ? String(t).slice(0, 5) : "");

    setForm({
      event_name: req.event_name || "",
      event_date: req.event_date || "",
      start_time: toHHMM(req.start_time),
      end_time: toHHMM(req.end_time),
      purpose: req.purpose || "",
      documents: req.documents || "",
    });

    setOpenModal(true);
  };

  const onSave = async () => {
    if (!active) return;
    try {
      setSaving(true);
      setError("");

      const payload = {
        user_id: userId,
        event_name: form.event_name,
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time,
        purpose: form.purpose,
        documents: form.documents,
      };

      const res = await fetch(`/api/event-requests/${active.event_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setOpenModal(false);
      setActive(null);
      await fetchPending();
    } catch (e) {
      setError(e.message || "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="tableHeader">
        <h2>Edit Event (Events on pending status only)</h2>
      </div>

      <div className="table-container">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
            <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
            </colgroup>

            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Requested Venue</th>
                <th>Purpose</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>No pending event requests</td>
                </tr>
              ) : (
                items.map((req) => (
                  <tr key={req.event_id}>
                    <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {req.event_name}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{req.event_date}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {req.start_time} - {req.end_time}
                    </td>
                    <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(req.requested_venues || []).join(", ") || "-"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => openPurposeModal(req.purpose)}
                            disabled={!req.purpose}
                            title={req.purpose ? "View purpose" : "No purpose"}
                        >
                            View
                        </button>
                    </td>

                    <td>
                      <button className="btn" onClick={() => openEdit(req)}>Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {openModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3 className="modal-title">Edit Event Request</h3>
            </div>

            <div className="modal-body">
              {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

              <div className="form-grid-2-modal">
                <div className="modal-field">
                  <label className="modal-label">Event Name</label>
                  <input
                    className="form-control-lg"
                    value={form.event_name}
                    onChange={(e) => setForm((p) => ({ ...p, event_name: e.target.value }))}
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Event Date</label>
                  <input
                    type="date"
                    className="form-control-lg"
                    value={form.event_date}
                    onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))}
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control-lg"
                    value={form.start_time}
                    onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">End Time</label>
                  <input
                    type="time"
                    className="form-control-lg"
                    value={form.end_time}
                    onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-field" style={{ marginTop: 14 }}>
                <label className="modal-label">Purpose</label>
                <textarea
                  className="modal-textarea"
                  value={form.purpose}
                  onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
                />
              </div>

              <div className="modal-field" style={{ marginTop: 14 }}>
                <label className="modal-label">Documents (optional)</label>
                <input
                  className="form-control-lg"
                  value={form.documents}
                  onChange={(e) => setForm((p) => ({ ...p, documents: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setOpenModal(false)} disabled={saving}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={onSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {purposeModalOpen && (
        <div className="modal-backdrop" onClick={closePurposeModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
                <h3 className="modal-title">Purpose</h3>
            </div>

            <div className="modal-body">
                <p className="modal-text" style={{ whiteSpace: "pre-wrap" }}>
                {purposeModalText}
                </p>
            </div>

            <div className="modal-actions">
                <button className="modal-btn secondary" onClick={closePurposeModal}>
                Close
                </button>
            </div>
            </div>
        </div>
        )}
    </>
  );
}

export default EditEvent;
