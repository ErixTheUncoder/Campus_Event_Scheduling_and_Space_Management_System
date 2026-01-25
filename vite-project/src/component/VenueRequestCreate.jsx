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
  width: "min(560px, 92vw)",
  background: "#fff",
  borderRadius: 14,
  padding: 24,
  boxShadow: "0 18px 55px rgba(0,0,0,0.25)",
};

const VenueRequestCreate = ({ user }) => {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [eventId, setEventId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
    redirectTo: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);

        const eventsRes = await fetch(`/api/event-requests?viewer_id=${user.user_id}&status=APPROVED`);
        const eventsData = await eventsRes.json().catch(() => ({}));
        if (!eventsRes.ok) throw new Error(eventsData.error || "Failed to fetch events");
        setEvents(eventsData.event_requests || []);

        const venuesRes = await fetch("/api/venues");
        const venuesData = await venuesRes.json().catch(() => ({}));
        if (!venuesRes.ok) throw new Error(venuesData.error || "Failed to fetch venues");
        setVenues(venuesData.venues || []);

        setPageLoading(false);
      } catch (e) {
        setError(e.message || "Failed to load data");
        setPageLoading(false);
      }
    };
    fetchData();
  }, [user.user_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (user.is_active === false) {
      setError("Your account is inactive. Please contact admin.");
      return;
    }

    if (!eventId || !venueId || !date || !startTime || !endTime) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        organiser_id: user.user_id,
        event_id: parseInt(eventId, 10),
        venue_id: parseInt(venueId, 10),
        date: date,
        start_time: startTime,
        end_time: endTime,
        reason: reason,
      };

      const res = await fetch("/api/venue-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create venue request");

      setModal({
        open: true,
        type: "success",
        title: "Success",
        message: "Venue request created successfully!",
        redirectTo: "/venue-requests",
      });
    } catch (e) {
      setModal({
        open: true,
        type: "error",
        title: "Request Failed",
        message: e.message || "Failed to create venue request. Please try again.",
        redirectTo: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal((p) => ({ ...p, open: false }));
    if (modal.redirectTo) navigate(modal.redirectTo);
  };

  return (
    <>
      <div className="content">
        <div className="tableHeader">
          <h2>Create Venue Request</h2>
        </div>

        <div className="table-container">
          {error && (
            <div style={{ color: "red", marginBottom: 12 }}>
              {error}
            </div>
          )}

          {pageLoading ? (
            <div>Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
              <label style={{ display: "block", marginBottom: 12 }}>
                Event (Approved Only):
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginTop: 5 }}
                >
                  <option value="">-- Select an Event --</option>
                  {events.map((ev) => (
                    <option key={ev.event_id} value={ev.event_id}>
                      {ev.event_name} ({ev.event_date})
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "block", marginBottom: 12 }}>
                Venue:
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

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn"
                  type="button"
                  onClick={() => navigate("/venue-requests")}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

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

export default VenueRequestCreate;
