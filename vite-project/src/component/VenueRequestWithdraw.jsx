import { useEffect, useState } from "react";

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

const VenueRequestWithdraw = ({ user }) => {
  const [venueRequests, setVenueRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const vrRes = await fetch(`/api/venue-requests?viewer_id=${user.user_id}&status=PENDING`);
      const vrData = await vrRes.json().catch(() => ({}));
      if (!vrRes.ok) throw new Error(vrData.error || "Failed to fetch venue requests");
      setVenueRequests(vrData.venue_requests || []);

      const eventsRes = await fetch(`/api/event-requests?viewer_id=${user.user_id}`);
      const eventsData = await eventsRes.json().catch(() => ({}));
      if (eventsRes.ok) setEvents(eventsData.event_requests || []);

      const venuesRes = await fetch("/api/venues");
      const venuesData = await venuesRes.json().catch(() => ({}));
      if (venuesRes.ok) setVenues(venuesData.venues || []);

      const availRes = await fetch("/api/availability");
      const availData = await availRes.json().catch(() => ({}));
      if (availRes.ok) setAvailabilities(availData.availability || []);
    } catch (e) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user.user_id) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.user_id]);

  const openConfirm = (vr) => {
    setActive(vr);
    setConfirmOpen(true);
  };

  const doWithdraw = async () => {
    if (!active) return;

    try {
      setWithdrawing(true);
      setError("");

      const res = await fetch(`/api/venue-requests/${active.venue_request_id}/withdraw`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organiser_id: user.user_id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to withdraw");

      setConfirmOpen(false);
      setActive(null);

      setModal({
        open: true,
        type: "success",
        title: "Success",
        message: "Venue request withdrawn successfully!",
      });

      await fetchData();
    } catch (e) {
      setError(e.message || "Failed to withdraw venue request");
    } finally {
      setWithdrawing(false);
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
        <h2>Withdraw Venue Request (Pending only)</h2>
      </div>

      <div className="table-container">
        {loading ? (
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
                    No pending venue requests available to withdraw.
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
                      <button className="modal-btn danger" onClick={() => openConfirm(vr)}>
                        Withdraw
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {confirmOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3 className="modal-title">Confirm Withdrawal</h3>
            </div>

            <div className="modal-body">
              <p className="modal-text">
                Withdraw venue request for <b>{active ? getEventName(active.event_id) : ""}</b>? <br />
                This action cannot be undone.
              </p>
              {error && <div style={{ color: "red" }}>{error}</div>}
            </div>

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setConfirmOpen(false)} disabled={withdrawing}>
                No
              </button>
              <button className="modal-btn danger" onClick={doWithdraw} disabled={withdrawing}>
                {withdrawing ? "Withdrawing..." : "Yes, Withdraw"}
              </button>
            </div>
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

export default VenueRequestWithdraw;
