import React, { useEffect, useState } from "react";

function EventRequestList() {
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventRequests = async () => {
      try {
        setError(null);

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;

        if (!userId) {
          setEventRequests([]);
          setLoading(false);
          return;
        }

        // NOTE: backend expects viewer_id
        const response = await fetch(`/api/event-requests/?viewer_id=${userId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || `HTTP Error! Status: ${response.status}`);
        }

        setEventRequests(result.event_requests || []);
      } catch (err) {
        setError(err.message);
        console.error("Fetch aborted:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventRequests();
  }, []);

  if (loading) return <div>Loading events...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
      {/* Control column widths so “Event Name” won’t take too much space */}
      <colgroup>
        <col style={{ width: "22%" }} /> {/* Event Name */}
        <col style={{ width: "12%" }} /> {/* Date */}
        <col style={{ width: "14%" }} /> {/* Time */}
        <col style={{ width: "22%" }} /> {/* Requested Venue */}
        <col style={{ width: "22%" }} /> {/* Purpose */}
        <col style={{ width: "8%" }} />  {/* Status */}
      </colgroup>

      <thead>
        <tr>
          <th>Event Name</th>
          <th>Date</th>
          <th>Time</th>
          <th>Requested Venue</th>
          <th>Purpose</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {eventRequests.length === 0 ? (
          <tr>
            <td colSpan="6" style={{ textAlign: "center" }}>
              No events created yet
            </td>
          </tr>
        ) : (
          eventRequests.map((req) => (
            <tr key={req.event_id}>
              {/* Event Name (truncate if too long) */}
              <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {req.event_name}
              </td>

              <td style={{ whiteSpace: "nowrap" }}>{req.event_date}</td>

              <td style={{ whiteSpace: "nowrap" }}>
                {req.start_time} - {req.end_time}
              </td>

              {/* ✅ Requested Venue (will show '-' until backend provides requested_venues) */}
              <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {(req.requested_venues || []).join(", ") || "-"}
              </td>

              {/* Purpose (truncate if too long) */}
              <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {req.purpose}
              </td>

              <td>
                <span className={`badge ${String(req.status || "").toLowerCase()}`}>
                  {req.status}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default EventRequestList;
