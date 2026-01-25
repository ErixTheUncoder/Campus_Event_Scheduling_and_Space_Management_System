import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const VenueRequestManage = ({ user }) => {
  const navigate = useNavigate();
  const [venueRequests, setVenueRequests] = useState([]);
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isEO = user?.user_role === "Event Organizer";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch venue requests (EO sees own, Admin sees all)
        const vrRes = await fetch(`/api/venue-requests?viewer_id=${user.user_id}`);
        const vrData = await vrRes.json().catch(() => ({}));
        if (!vrRes.ok) throw new Error(vrData.error || "Failed to fetch venue requests");
        setVenueRequests(vrData.venue_requests || []);

        // Fetch venues for display
        const venuesRes = await fetch("/api/venues");
        const venuesData = await venuesRes.json().catch(() => ({}));
        if (venuesRes.ok) {
          setVenues(venuesData.venues || []);
        }

        // Fetch events for display
        const eventsRes = await fetch(`/api/event-requests?viewer_id=${user.user_id}`);
        const eventsData = await eventsRes.json().catch(() => ({}));
        if (eventsRes.ok) {
          setEvents(eventsData.event_requests || []);
        }
      } catch (e) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.user_id]);

  const getVenueName = (venueAvailableId) => {
    // This is a simplified approach - in production you'd fetch venue_availability details
    return "Venue (see details)";
  };

  const getEventName = (eventId) => {
    const event = events.find((e) => e.event_id === eventId);
    return event ? event.event_name : `Event #${eventId}`;
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || "").toLowerCase();
    return (
      <span className={`badge ${statusLower}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="content">
      <div className="tableHeader">
        <h2>{user.user_role === "Admin" ? "All Venue Requests" : "My Venue Requests"}</h2>

        {isEO && (
          <div className="event-actions">
            <button className="btn add-Button" onClick={() => navigate("/venue-requests/create")}>
              + Create Venue Request
            </button>

            <button className="btn btn-outline" onClick={() => navigate("/venue-requests/edit")}>
              ✏️ Edit Venue Request
            </button>

            <button className="btn btn-danger-outline" onClick={() => navigate("/venue-requests/withdraw")}>
              🚫 Withdraw Venue Request
            </button>
          </div>
        )}
      </div>

      <div className="table-container">
        {error && (
          <div style={{ color: "red", marginBottom: 12 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : venueRequests.length === 0 ? (
          <div>No venue requests found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Event</th>
                <th>Status</th>
                <th>Request Date</th>
                <th>Approval Date</th>
                <th>Admin Comment</th>
              </tr>
            </thead>
            <tbody>
              {venueRequests.map((vr) => (
                <tr key={vr.venue_request_id}>
                  <td>{vr.venue_request_id}</td>
                  <td>{getEventName(vr.event_id)}</td>
                  <td>{getStatusBadge(vr.status)}</td>
                  <td>{new Date(vr.request_date_time).toLocaleString()}</td>
                  <td>
                    {vr.approval_date_time
                      ? new Date(vr.approval_date_time).toLocaleString()
                      : "—"}
                  </td>
                  <td>{vr.admin_comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VenueRequestManage;
