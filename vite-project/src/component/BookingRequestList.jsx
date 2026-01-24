import React, { useEffect, useMemo, useState } from "react";

function BookingRequestList({ user }) {
  const userId = user?.user_id;

  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [venues, setVenues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!userId) {
          setBookings([]);
          return;
        }

        const [bRes, aRes, vRes] = await Promise.all([
          fetch(`/api/booking-requests/?viewer_id=${userId}`),
          fetch(`/api/availability`),
          fetch(`/api/venues`),
        ]);

        const bJson = await bRes.json().catch(() => ({}));
        const aJson = await aRes.json().catch(() => ({}));
        const vJson = await vRes.json().catch(() => ({}));

        if (!bRes.ok) throw new Error(bJson.error || `Booking HTTP ${bRes.status}`);
        if (!aRes.ok) throw new Error(aJson.error || `Availability HTTP ${aRes.status}`);
        if (!vRes.ok) throw new Error(vJson.error || `Venues HTTP ${vRes.status}`);

        setBookings(bJson.booking_requests || []);
        setAvailability(aJson.availability || []);
        setVenues(vJson.venues || []);
      } catch (e) {
        setError(e.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const availabilityMap = useMemo(() => {
    const m = new Map();
    (availability || []).forEach((a) => {
      // expecting: venue_available_id
      m.set(a.venue_available_id, a);
    });
    return m;
  }, [availability]);

  const venueMap = useMemo(() => {
    const m = new Map();
    (venues || []).forEach((v) => m.set(v.venue_id, v));
    return m;
  }, [venues]);

  const rows = useMemo(() => {
    return (bookings || []).map((b) => {
      const a = availabilityMap.get(b.venue_available_id);
      const v = a ? venueMap.get(a.venue_id) : null;

      const toHHMM = (t) => (t ? String(t).slice(0, 5) : "-");

      return {
        ...b,
        venue_name: v?.venue_name || "-",
        location: v?.location || "-",
        start_time: toHHMM(a?.start_time),
        end_time: toHHMM(a?.end_time),
      };
    });
  }, [bookings, availabilityMap, venueMap]);

  const statusOptions = useMemo(() => {
    const set = new Set(
      rows
        .map((r) => String(r.status || "").trim().toLowerCase())
        .filter(Boolean)
    );
    const preferred = ["pending", "approved", "rejected", "cancelled"];
    const sorted = [
      ...preferred.filter((s) => set.has(s)),
      ...Array.from(set).filter((s) => !preferred.includes(s)),
    ];
    return ["all", ...sorted];
  }, [rows]);

  useEffect(() => {
    if (!statusOptions.includes(statusFilter)) setStatusFilter("all");
  }, [statusOptions, statusFilter]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter(
      (r) => String(r.status || "").trim().toLowerCase() === statusFilter
    );
  }, [rows, statusFilter]);

  const toTitle = (s) => (s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1));

  if (loading) return <div>Loading bookings...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <>
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
          <col style={{ width: "16%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
        </colgroup>

        <thead>
          <tr>
            <th>Date</th>
            <th>Venue</th>
            <th>Location</th>
            <th>Time</th>
            <th>Status</th>
            <th>Comment</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No bookings found
              </td>
            </tr>
          ) : (
            filtered.map((b) => (
              <tr key={b.booking_id}>
                <td style={{ whiteSpace: "nowrap" }}>{b.booking_date || "-"}</td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.venue_name}
                </td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.location}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {b.start_time} - {b.end_time}
                </td>
                <td>
                  <span className={`badge ${String(b.status || "").toLowerCase()}`}>
                    {b.status}
                  </span>
                </td>
                <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.admin_comment || "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

export default BookingRequestList;
