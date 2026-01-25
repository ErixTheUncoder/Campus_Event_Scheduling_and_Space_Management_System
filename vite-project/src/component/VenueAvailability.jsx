import { useEffect, useState } from "react";

const VenueAvailability = () => {
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [checkResult, setCheckResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleCheck = async (e) => {
    e.preventDefault();
    setError("");
    setCheckResult(null);

    if (!venueId || !date || !startTime || !endTime) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        venue_id: parseInt(venueId, 10),
        date: date,
        start_time: startTime,
        end_time: endTime,
      };

      const res = await fetch("/api/availability/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to check availability");

      setCheckResult(data);
    } catch (e) {
      setError(e.message || "Check failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content">
      <div className="tableHeader">
        <h2>Venue Availability Checker</h2>
      </div>

      <div className="table-container">
        {error && (
          <div style={{ color: "red", marginBottom: 12 }}>
            {error}
          </div>
        )}

        {checkResult && (
          <div
            style={{
              padding: 12,
              marginBottom: 12,
              borderRadius: 4,
              backgroundColor: checkResult.available ? "#d4edda" : "#f8d7da",
              color: checkResult.available ? "#155724" : "#721c24",
              border: `1px solid ${checkResult.available ? "#c3e6cb" : "#f5c6cb"}`,
            }}
          >
            <strong>{checkResult.available ? "✓ Available" : "✗ Not Available"}</strong>
            <div style={{ marginTop: 5 }}>{checkResult.message}</div>
          </div>
        )}

        {pageLoading ? (
          <div>Loading venues...</div>
        ) : (
          <form onSubmit={handleCheck} style={{ maxWidth: 520 }}>
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

            <button
              type="submit"
              disabled={loading}
              style={{ padding: "10px 20px", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Checking..." : "Check Availability"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default VenueAvailability;
