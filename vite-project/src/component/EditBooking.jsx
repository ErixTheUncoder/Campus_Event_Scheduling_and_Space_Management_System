import React, { useEffect, useMemo, useState } from "react";

function EditBooking({ user }) {
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser?.user_id;

  const [items, setItems] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [venues, setVenues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);

  const [selectedAvailId, setSelectedAvailId] = useState("");

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError("");

      const [bRes, aRes, vRes] = await Promise.all([
        fetch(`/api/booking-requests/?viewer_id=${userId}&status=PENDING`),
        fetch(`/api/availability`),
        fetch(`/api/venues`),
      ]);

      const bJson = await bRes.json().catch(() => ({}));
      const aJson = await aRes.json().catch(() => ({}));
      const vJson = await vRes.json().catch(() => ({}));

      if (!bRes.ok) throw new Error(bJson.error || `Booking HTTP ${bRes.status}`);
      if (!aRes.ok) throw new Error(aJson.error || `Availability HTTP ${aRes.status}`);
      if (!vRes.ok) throw new Error(vJson.error || `Venues HTTP ${vRes.status}`);

      setItems(bJson.booking_requests || []);
      setAvailability(aJson.availability || []);
      setVenues(vJson.venues || []);
    } catch (e) {
      setError(e.message || "Failed to load pending bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const venueMap = useMemo(() => {
    const m = new Map();
    venues.forEach((v) => m.set(v.venue_id, v));
    return m;
  }, [venues]);

  const availabilityMap = useMemo(() => {
    const m = new Map();
    availability.forEach((a) => m.set(a.venue_available_id, a));
    return m;
  }, [availability]);

  const slotOptions = useMemo(() => {
    const toHHMM = (t) => (t ? String(t).slice(0, 5) : "");
    return availability
      .filter((a) => a.is_available) // only selectable slots
      .map((a) => {
        const v = venueMap.get(a.venue_id);
        return {
          ...a,
          label: `${a.date} | ${toHHMM(a.start_time)}-${toHHMM(a.end_time)} | ${v?.venue_name || "Venue"} (${v?.location || "-"})`,
        };
      })
      .sort((x, y) => String(x.date).localeCompare(String(y.date)));
  }, [availability, venueMap]);

  const openEdit = (bk) => {
    setActive(bk);
    setSelectedAvailId(""); // user must pick a NEW slot
    setOpenModal(true);
  };

  const onSave = async () => {
    if (!active) return;

    try {
      setSaving(true);
      setError("");

      if (!selectedAvailId) {
        throw new Error("Please select a new available slot.");
      }

      const res = await fetch(`/api/booking-requests/${active.booking_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          venue_available_id: parseInt(selectedAvailId, 10),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setOpenModal(false);
      setActive(null);
      await fetchPending();
    } catch (e) {
      setError(e.message || "Failed to update booking");
    } finally {
      setSaving(false);
    }
  };

  const renderSlot = (bk) => {
    const a = availabilityMap.get(bk.venue_available_id);
    const v = a ? venueMap.get(a.venue_id) : null;
    const toHHMM = (t) => (t ? String(t).slice(0, 5) : "-");
    return `${v?.venue_name || "-"} | ${toHHMM(a?.start_time)}-${toHHMM(a?.end_time)}`;
  };

  return (
    <>
      <div className="tableHeader">
        <h2>Edit Booking (Pending only)</h2>
      </div>

      <div className="table-container">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "40%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>

            <thead>
              <tr>
                <th>Date</th>
                <th>Slot</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No pending booking requests
                  </td>
                </tr>
              ) : (
                items.map((bk) => (
                  <tr key={bk.booking_id}>
                    <td style={{ whiteSpace: "nowrap" }}>{bk.booking_date}</td>
                    <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {renderSlot(bk)}
                    </td>
                    <td>
                      <span className={`badge ${String(bk.status || "").toLowerCase()}`}>{bk.status}</span>
                    </td>
                    <td>
                      <button className="btn" onClick={() => openEdit(bk)}>
                        Edit
                      </button>
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
              <h3 className="modal-title">Edit Booking</h3>
            </div>

            <div className="modal-body">
              {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

              <p className="modal-text" style={{ marginBottom: 10 }}>
                Current: <b>{active?.booking_date}</b> — {active ? renderSlot(active) : "-"}
              </p>

              <label className="modal-label">Select New Slot</label>
              <select
                className="form-control-lg"
                value={selectedAvailId}
                onChange={(e) => setSelectedAvailId(e.target.value)}
              >
                <option value="">-- Select --</option>
                {slotOptions.map((s) => (
                  <option key={s.venue_available_id} value={s.venue_available_id}>
                    {s.label}
                  </option>
                ))}
              </select>
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
    </>
  );
}

export default EditBooking;
