import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
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
  padding: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const AddEventForm = () => {
  const navigate = useNavigate();

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success", // "success" | "error"
    redirectTo: null,
  });

  // Form states
  const [eventName, setEventName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venueId, setVenueId] = useState("");

  // Data states
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch venues on component mount
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch("/api/venues");
        if (!response.ok) throw new Error("Failed to fetch venues");

        const result = await response.json();
        setVenues(result.venues || []);
      } catch (err) {
        console.error("Error fetching venues:", err);
        setError("Could not load venues");
      }
    };

    fetchVenues();
  }, []);

  const closeModal = () => {
    setModal((p) => ({ ...p, open: false }));
    if (modal.redirectTo) navigate(modal.redirectTo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user.user_id) {
        setModal({
          open: true,
          type: "error",
          title: "Not logged in",
          message: "User not logged in. Please log in again.",
          redirectTo: null,
        });
        setLoading(false);
        return;
      }

      // Step 1: Create Event Request
      const eventPayload = {
        user_id: user.user_id,
        event_name: eventName,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose,
      };

      const eventResponse = await fetch("/api/event-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });

      const eventResult = await eventResponse.json().catch(() => ({}));

      if (!eventResponse.ok) {
        throw new Error(eventResult.error || "Failed to create event");
      }

      const eventId = eventResult?.event_request?.event_id;

      // Step 2: Create Venue Request
      const venuePayload = {
        organiser_id: user.user_id,
        event_id: eventId,
        venue_id: parseInt(venueId, 10),
        date: eventDate,
        start_time: startTime,
        end_time: endTime,
        reason: purpose,
      };

      const venueResponse = await fetch("/api/venue-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venuePayload),
      });

      const venueResult = await venueResponse.json().catch(() => ({}));

      if (!venueResponse.ok) {
        throw new Error(venueResult.error || "Failed to request venue");
      }

      setModal({
        open: true,
        type: "success",
        title: "Success",
        message: "Event and Venue Request created successfully!",
        redirectTo: "/events",
      });
    } catch (err) {
      console.error("Submit error:", err);

      setModal({
        open: true,
        type: "error",
        title: "Submission Failed",
        message: err.message || "Failed to submit. Make sure the backend is running.",
        redirectTo: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content">
    <div className="tableHeader">
      <h2>Create New Event</h2>
    </div>

      <div className="table-container">
        {error && (
          <div
            style={{
              color: "red",
              backgroundColor: "#ffe6e6",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "400px",
          }}
        >
          <label>
            Event Name:
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </label>

          <label>
            Event Description / Purpose:
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                minHeight: "80px",
              }}
            />
          </label>

          <label>
            Date:
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </label>

          <label>
            Start Time:
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </label>

          <label>
            End Time:
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </label>

          <label>
            Venue:
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            >
              <option value="">-- Select a Venue --</option>
              {venues.map((venue) => (
                <option key={venue.venue_id} value={venue.venue_id}>
                  {venue.venue_name} ({venue.location}) - Capacity: {venue.capacity}
                </option>
              ))}
            </select>
          </label>

          <div style={{ marginTop: "1rem", display: "flex", gap: 10 }}>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>

            <button type="button" className="btn" onClick={() => navigate(-1)} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Modal */}
      {modal.open && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>{modal.title}</h3>
            </div>

            <div
              style={{
                marginTop: 12,
                color: modal.type === "error" ? "#b42318" : "#1a1a1a",
                whiteSpace: "pre-wrap",
              }}
            >
              {modal.message}
            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button type="button" className="btn primary" onClick={closeModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEventForm;
