import React, { useEffect, useMemo, useState } from "react";

function EventRequestList() {
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // status filter state
  const [statusFilter, setStatusFilter] = useState("all");

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

  // build dropdown options from data (plus "All")
  const statusOptions = useMemo(() => {
    const set = new Set(
      (eventRequests || [])
        .map((r) => String(r.status || "").trim().toLowerCase())
        .filter(Boolean)
    );

    // nice ordering (if exists)
    const preferred = ["pending", "approved", "rejected", "confirmed"];
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
    if (statusFilter === "all") return eventRequests;

    return (eventRequests || []).filter(
      (r) => String(r.status || "").trim().toLowerCase() === statusFilter
    );
  }, [eventRequests, statusFilter]);

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
          <col style={{ width: "12%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "8%" }} />
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
          {filteredRequests.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No events found
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
    </>
  );
}

export default EventRequestList;
