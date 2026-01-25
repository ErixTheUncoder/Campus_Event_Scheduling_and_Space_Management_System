import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AddBookingForm = () => {
  const navigate = useNavigate();

  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setPageLoading(true);
        const res = await fetch("/api/venues");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to fetch venues");
        setVenues(data.venues || []);
      } catch (e) {
        setError(e.message || "Failed to load venues");
      } finally {
        setPageLoading(false);
      }
    };
    fetchVenues();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.user_id) {
      setError("User not logged in. Please login again.");
      return;
    }
    if (user.is_active === false) {
      setError("Your account is inactive. Please contact admin.");
      return;
    }

    if (!venueId || !bookingDate || !startTime || !endTime) {
      setError("Please fill in venue, date, start time, and end time.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        user_id: user.user_id,
        booking_date: bookingDate, // YYYY-MM-DD
        venue_id: parseInt(venueId, 10),
        start_time: startTime,     // HH:MM
        end_time: endTime,         // HH:MM
      };

      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create booking request");

      setSuccessMsg("Booking request submitted successfully!");
      setTimeout(() => navigate("/bookings"), 800);
    } catch (e) {
      setError(e.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content">
      <div className="tableHeader">
        <h2>Create Booking</h2>
      </div>

      <div className="table-container">
        {error && (
          <div style={{ color: "red", marginBottom: 12 }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ color: "green", marginBottom: 12 }}>
            {successMsg}
          </div>
        )}

        {pageLoading ? (
          <div>Loading venues...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
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
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
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

            <label style={{ display: "block", marginBottom: 16 }}>
              End Time:
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                style={{ width: "100%", padding: 8, marginTop: 5 }}
              />
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </button>

              <button
                className="btn"
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddBookingForm;
