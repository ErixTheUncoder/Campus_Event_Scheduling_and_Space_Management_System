import React, { useEffect, useMemo, useState } from "react";

function EventRequestList({ limit }) {
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('');

  // status filter state
  const [statusFilter, setStatusFilter] = useState("all");

  // Purpose modal state
  const [purposeModalOpen, setPurposeModalOpen] = useState(false);
  const [purposeText, setPurposeText] = useState("");

  const openPurposeModal = (text) => {
    setPurposeText(text || "");
    setPurposeModalOpen(true);
  };

  const closePurposeModal = () => {
    setPurposeModalOpen(false);
    setPurposeText("");
  };

  useEffect(() => {
    const fetchEventRequests = async () => {
      try {
        setError(null);

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;
        const role = user?.user_role;
        setUserRole(role);

        if (!userId) {
          setEventRequests([]);
          setLoading(false);
          return;
        }

        let response;
        let result;

        // Students fetch booking requests, others fetch event requests
        if (role === 'Student') {
          response = await fetch(`/api/booking-requests/?viewer_id=${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(result.error || `HTTP Error! Status: ${response.status}`);
          }

          // Transform booking requests to match event request structure
          const bookings = (result.booking_requests || []).map(booking => ({
            event_id: booking.booking_id,
            event_name: `Booking #${booking.booking_id}`,
            event_date: booking.booking_date,
            start_time: booking.start_time || '-',
            end_time: booking.end_time || '-',
            requested_venues: booking.venue_name ? [booking.venue_name] : ['-'],
            purpose: booking.purpose || 'N/A',
            status: booking.status
          }));

          setEventRequests(bookings);
        } else {
          // Event Organizers and Admins fetch event requests
          response = await fetch(`/api/event-requests/?viewer_id=${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(result.error || `HTTP Error! Status: ${response.status}`);
          }

          setEventRequests(result.event_requests || []);
        }
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventRequests();
  }, []);

  // build dropdown options from data (plus "All")
  const statusOptions = useMemo(() => {
    const set = new Set(
      (eventRequests || [])
        .map((r) => String(r.status || "").trim().toLowerCase())
        .filter(Boolean)
    );

    // nice ordering (if exists)
    const preferred = ["pending", "approved", "rejected", "cancelled", "confirmed"];
    const sorted = [
      ...preferred.filter((s) => set.has(s)),
      ...Array.from(set).filter((s) => !preferred.includes(s)),
    ];

    return ["all", ...sorted];
  }, [eventRequests]);

  // if current filter disappears after refetch, reset to all
  useEffect(() => {
    if (!statusOptions.includes(statusFilter)) setStatusFilter("all");
  }, [statusOptions, statusFilter]);

  // filter rows by status
  const filteredRequests = useMemo(() => {
    let filtered;
    if (statusFilter === "all") {
      filtered = eventRequests;
    } else {
      filtered = (eventRequests || []).filter(
        (r) => String(r.status || "").trim().toLowerCase() === statusFilter
      );
    }

    // Apply limit if provided
    return limit ? filtered.slice(0, limit) : filtered;
  }, [eventRequests, statusFilter, limit]);

  const toTitle = (s) => (s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1));

  if (loading) return <div>Loading events...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <>
      {/* filter bar */}
      <div className="table-controls">
        <label className="table-filter">
          Filter by status:
          <select
            className="table-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {toTitle(s)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>

        <thead>
          <tr>
            <th>{userRole === 'Student' ? 'Booking' : 'Event Name'}</th>
            <th>Date</th>
            <th>Time</th>
            <th>{userRole === 'Student' ? 'Venue' : 'Requested Venue'}</th>
            <th>Purpose</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {filteredRequests.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                {userRole === 'Student' ? 'No bookings found' : 'No events found'}
              </td>
            </tr>
          ) : (
            filteredRequests.map((req) => (
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
                  <span className={`badge ${String(req.status || "").toLowerCase()}`}>
                    {req.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Purpose Modal */}
      {purposeModalOpen && (
        <div className="modal-backdrop" onClick={closePurposeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Purpose</h3>
            </div>

            <div className="modal-body">
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{purposeText}</p>
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

export default EventRequestList;
