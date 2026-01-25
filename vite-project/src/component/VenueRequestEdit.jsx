import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 16,
};

const modalBoxStyle = {
  width: "min(700px, 92vw)",
  background: "#fff",
  borderRadius: 14,
  padding: 24,
  boxShadow: "0 18px 55px rgba(0,0,0,0.25)",
  maxHeight: "90vh",
  overflow: "auto",
};

const VenueRequestEdit = ({ user }) => {
  const navigate = useNavigate();

  const [venueRequests, setVenueRequests] = useState([]);
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);

        const vrRes = await fetch(`/api/venue-requests?viewer_id=${user.user_id}&status=PENDING`);
        const vrData = await vrRes.json().catch(() => ({}));
        if (!vrRes.ok) throw new Error(vrData.error || "Failed to fetch venue requests");
        setVenueRequests(vrData.venue_requests || []);

        const venuesRes = await fetch("/api/venues");
        const venuesData = await venuesRes.json().catch(() => ({}));
        if (!venuesRes.ok) throw new Error(venuesData.error || "Failed to fetch venues");
        setVenues(venuesData.venues || []);

        const eventsRes = await fetch(`/api/event-requests?viewer_id=${user.user_id}`);
        const eventsData = await eventsRes.json().catch(() => ({}));
        if (eventsRes.ok) {
          setEvents(eventsData.event_requests || []);
        }

        const availRes = await fetch("/api/availability");
        const availData = await availRes.json().catch(() => ({}));
        if (availRes.ok) {
          setAvailabilities(availData.availability || []);
        }

        setPageLoading(false);
      } catch (e) {
        setError(e.message || "Failed to load data");
        setPageLoading(false);
      }
    };
    fetchData();
  }, [user.user_id]);

  const openEdit = (vr) => {
    setSelectedRequest(vr);
    setReason(vr.resources_needed || "");

    const avail = availabilities.find((a) => a.venue_available_id === vr.venue_available_id);
    if (avail) {
      setVenueId(avail.venue_id.toString());
      setDate(avail.date);
      setStartTime(avail.start_time);
      setEndTime(avail.end_time);
    }

    setEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (user.is_active === false) {
      setError("Your account is inactive. Please contact admin.");
      return;
    }

    if (!venueId || !date || !startTime || !endTime) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        organiser_id: user.user_id,
        venue_id: parseInt(venueId, 10),
        date: date,
        start_time: startTime,
        end_time: endTime,
        reason: reason,
      };

      const res = await fetch(`/api/venue-requests/${selectedRequest.venue_request_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update venue request");

      setEditModalOpen(false);
      setModal({
        open: true,
        type: "success",
        title: "Success",
        message: "Venue request updated successfully!",
      });

      // Refresh list
      const vrRes = await fetch(`/api/venue-requests?viewer_id=${user.user_id}&status=PENDING`);
      const vrData = await vrRes.json().catch(() => ({}));
      if (vrRes.ok) setVenueRequests(vrData.venue_requests || []);
    } catch (e) {
      setModal({
        open: true,
        type: "error",
        title: "Update Failed",
        message: e.message || "Failed to update venue request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ open: false, title: "", message: "", type: "success" });
  };

  const getVenueName = (venueId) => {
    const venue = venues.find((v) => v.venue_id === venueId);
    return venue ? `${venue.venue_name} (${venue.location})` : "Unknown Venue";
  };

  const getEventName = (eventId) => {
    const event = events.find((e) => e.event_id === eventId);
    return event ? event.event_name : `Event #${eventId}`;
  };

  const getVenueForRequest = (vr) => {
    const avail = availabilities.find((a) => a.venue_available_id === vr.venue_available_id);
    return avail ? getVenueName(avail.venue_id) : "—";
  };

  const getTimeForRequest = (vr) => {
    const avail = availabilities.find((a) => a.venue_available_id === vr.venue_available_id);
    return avail ? `${avail.start_time} - ${avail.end_time}` : "—";
  };

  return (
    <>
      <div className="tableHeader">
        <h2>Edit Venue Request (Pending only)</h2>
      </div>

      <div className="table-container">
        {pageLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <table style={{ width: "100%", tableLayout: "auto", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Requested Venue</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {venueRequests.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No pending venue requests available to edit.
                  </td>
                </tr>
              ) : (
                venueRequests.map((vr) => (
                  <tr key={vr.venue_request_id}>
                    <td>{getEventName(vr.event_id)}</td>
                    <td>{getVenueForRequest(vr)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{getTimeForRequest(vr)}</td>
                    <td>{vr.resources_needed || "—"}</td>
                    <td>
                      <button className="btn" onClick={() => openEdit(vr)}>
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

      {editModalOpen && selectedRequest && (
        <div style={modalOverlayStyle} onClick={() => setEditModalOpen(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: "#1976d2" }}>Edit Venue Request</h3>

            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                border: "1px solid #90caf9",
              }}
            >
              <h4 style={{ marginTop: 0, color: "#1976d2" }}>Current Details</h4>
              <div style={{ display: "grid", gap: 8 }}>
                <div><strong>Event:</strong> {getEventName(selectedRequest.event_id)}</div>
                {(() => {
                  const avail = availabilities.find((a) => a.venue_available_id === selectedRequest.venue_available_id);
                  if (avail) {
                    return (
                      <>
                        <div><strong>Current Venue:</strong> {getVenueName(avail.venue_id)}</div>
                        <div><strong>Current Date:</strong> {avail.date}</div>
                        <div><strong>Current Time:</strong> {avail.start_time} - {avail.end_time}</div>
                      </>
                    );
                  }
                  return <div><strong>Current Slot:</strong> Loading...</div>;
                })()}
                <div><strong>Reason/Resources:</strong> {selectedRequest.resources_needed || "N/A"}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <h4 style={{ marginTop: 20, marginBottom: 12 }}>New Details</h4>

              <label style={{ display: "block", marginBottom: 12 }}>
                New Venue:
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginTop: 5 }}
                >
                  <option value="">-- Select a Venue --</option>
                  {venues.map((v) => (
                    <option key={v.venue_id} value={v.venue_id}>
                      {v.venue_name} ({v.location})
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "block", marginBottom: 12 }}>
                Date:
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginTop: 5 }}
                />
              </label>

              <label style={{ display: "block", marginBottom: 12 }}>
                Start Time:
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginTop: 5 }}
                />
              </label>

              <label style={{ display: "block", marginBottom: 12 }}>
                End Time:
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginTop: 5 }}
                />
              </label>

              <label style={{ display: "block", marginBottom: 16 }}>
                Reason / Resources Needed:
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: 8, marginTop: 5 }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={loading}
                  style={{ padding: "10px 20px", cursor: loading ? "not-allowed" : "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#3498db",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal.open && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: modal.type === "error" ? "#e74c3c" : "#27ae60" }}>
              {modal.title}
            </h3>
            <p style={{ marginBottom: 20 }}>{modal.message}</p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "10px 20px",
                  backgroundColor: modal.type === "error" ? "#e74c3c" : "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VenueRequestEdit;
