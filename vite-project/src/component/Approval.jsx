import { useEffect, useMemo, useState } from "react";

function Approval() {
  const [bookingRequests, setBookingRequests] = useState([]);
  const [eventRequests, setEventRequests] = useState([]);
  const [venueRequests, setVenueRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Confirm modal (Approve/Reject)
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null, // "booking" | "event" | "venue"
    id: null,
    decision: null, // "APPROVED" | "REJECTED"
  });

  // Remark modal input
  const [remark, setRemark] = useState("");

  // Result modal (success/error message)
  const [resultModal, setResultModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success", // "success" | "error"
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);

    if (user.user_id) {
      fetchAllRequests(user.user_id);
    } else {
      setError("Please log in to access this page");
      setLoading(false);
    }
  }, []);

  // Scroll to hash section when opening / clicking sidebar submenu
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash?.replace("#", "");
      if (!hash) return;

      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  // ESC closes modals
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;

      if (confirmModal.open && !submitting) closeConfirm();
      if (resultModal.open) closeResult();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmModal.open, resultModal.open, submitting]);

  // Lock body scroll when modal open (professional UX)
  useEffect(() => {
    const anyOpen = confirmModal.open || resultModal.open;
    if (anyOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [confirmModal.open, resultModal.open]);

  const sections = useMemo(
    () => [
      { id: "booking", label: "Booking Requests", count: bookingRequests.length },
      { id: "event", label: "Event Requests", count: eventRequests.length },
      { id: "venue", label: "Venue Requests", count: venueRequests.length },
    ],
    [bookingRequests.length, eventRequests.length, venueRequests.length]
  );

  const fetchAllRequests = async (adminId) => {
    try {
      setLoading(true);
      setError(null);

      const [bookingRes, eventRes, venueRes] = await Promise.all([
        fetch(`/api/booking-requests/?viewer_id=${adminId}&status=PENDING`),
        fetch(`/api/event-requests/?viewer_id=${adminId}&status=PENDING`),
        fetch(`/api/venue-requests/?viewer_id=${adminId}&status=PENDING`),
      ]);

      const bookingData = await bookingRes.json().catch(() => ({}));
      const eventData = await eventRes.json().catch(() => ({}));
      const venueData = await venueRes.json().catch(() => ({}));

      if (!bookingRes.ok) throw new Error(bookingData.error || `Booking fetch failed (${bookingRes.status})`);
      if (!eventRes.ok) throw new Error(eventData.error || `Event fetch failed (${eventRes.status})`);
      if (!venueRes.ok) throw new Error(venueData.error || `Venue fetch failed (${venueRes.status})`);

      setBookingRequests(bookingData.booking_requests || []);
      setEventRequests(eventData.event_requests || []);
      setVenueRequests(venueData.venue_requests || []);
    } catch (err) {
      setError("Failed to fetch requests: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (type, id, decision) => {
    setRemark(""); // reset
    setConfirmModal({ open: true, type, id, decision });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, type: null, id: null, decision: null });
    setRemark("");
  };

  const openResult = (type, title, message) => {
    setResultModal({ open: true, type, title, message });
  };

  const closeResult = () => {
    setResultModal({ open: false, title: "", message: "", type: "success" });
  };

  const submitDecision = async () => {
    if (submitting) return; // prevent double-submit

    if (!currentUser?.user_id) {
      openResult("error", "Error", "Admin not logged in.");
      return;
    }

    const { type, id, decision } = confirmModal;
    if (!type || !id || !decision) return;

    // Venue reject MUST have remark
    if (type === "venue" && decision === "REJECTED" && !remark.trim()) {
      openResult("error", "Remark Required", "Please provide a rejection reason for venue request.");
      return;
    }

    setSubmitting(true);
    try {
      let url = "";
      let payload = {};

      if (type === "booking") {
        url = `/api/booking-requests/${id}/decision`;
        payload = {
          admin_id: currentUser.user_id,
          decision,
          admin_comment: remark.trim() || (decision === "APPROVED" ? "Approved" : "Rejected"),
        };
      }

      if (type === "event") {
        url = `/api/event-requests/${id}/decision`;
        payload = {
          admin_id: currentUser.user_id,
          decision,
          admin_comment: remark.trim() || (decision === "APPROVED" ? "Approved" : "Rejected"),
        };
      }

      if (type === "venue") {
        url = `/api/venue-requests/${id}/decision`;
        payload = {
          admin_id: currentUser.user_id,
          decision,
          remark: remark.trim() || "Approved",
        };
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        openResult("error", "Error", data.error || `Failed (${res.status})`);
        return;
      }

      const prettyType = type === "booking" ? "Booking" : type === "event" ? "Event" : "Venue";

      openResult("success", "Success", `${prettyType} request ${decision.toLowerCase()} successfully`);

      closeConfirm();
      fetchAllRequests(currentUser.user_id);
    } catch (err) {
      openResult("error", "Error", err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="table-container">Loading requests...</div>;
  if (error) return <div className="table-container" style={{ color: "red" }}>{error}</div>;

  return (
    <div className="table-container approvals-page">
      <div className="approvals-header">
        <h2 className="approvals-title">Approvals</h2>
        <p className="approvals-subtitle">Pending Approval Requests</p>
      </div>

      {/* Top sub-navigation */}
      <div className="approvals-subnav">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="approvals-subnav-item">
            {s.label}
            <span className="approvals-count">{s.count}</span>
          </a>
        ))}
      </div>

      {/* Booking Requests */}
      <section id="booking" className="approvals-section">
        <div className="approvals-section-head">
          <h3>Booking Requests</h3>
          <span className="badge pending">{bookingRequests.length} Pending</span>
        </div>

        {bookingRequests.length === 0 ? (
          <p className="muted">No pending booking requests</p>
        ) : (
          <div className="approvals-table-wrap">
            <table className="approvals-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Venue</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookingRequests.map((req) => (
                  <tr key={req.booking_id}>
                    <td>{req.booking_id}</td>
                    <td>{req.user_name || `User #${req.user_id}`}</td>
                    <td>{req.venue_name || `Venue Availability #${req.venue_available_id}`}</td>
                    <td>{req.booking_date}</td>
                    <td>
                      <span className={`badge ${req.status?.toLowerCase() || "pending"}`}>
                        {req.status || "PENDING"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="approval-btn approve" onClick={() => openConfirm("booking", req.booking_id, "APPROVED")}>
                        Approve
                      </button>
                      <button className="approval-btn reject" onClick={() => openConfirm("booking", req.booking_id, "REJECTED")}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Event Requests */}
      <section id="event" className="approvals-section">
        <div className="approvals-section-head">
          <h3>Event Requests</h3>
          <span className="badge pending">{eventRequests.length} Pending</span>
        </div>

        {eventRequests.length === 0 ? (
          <p className="muted">No pending event requests</p>
        ) : (
          <div className="approvals-table-wrap">
            <table className="approvals-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event Name</th>
                  <th>Organizer</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventRequests.map((req) => (
                  <tr key={req.event_id}>
                    <td>{req.event_id}</td>
                    <td>{req.event_name}</td>
                    <td>{req.user_name || `User #${req.user_id}`}</td>
                    <td>{req.event_date}</td>
                    <td>{req.start_time} - {req.end_time}</td>
                    <td>
                      <span className={`badge ${req.status?.toLowerCase() || "pending"}`}>
                        {req.status || "PENDING"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="approval-btn approve" onClick={() => openConfirm("event", req.event_id, "APPROVED")}>
                        Approve
                      </button>
                      <button className="approval-btn reject" onClick={() => openConfirm("event", req.event_id, "REJECTED")}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Venue Requests */}
      <section id="venue" className="approvals-section">
        <div className="approvals-section-head">
          <h3>Venue Requests</h3>
          <span className="badge pending">{venueRequests.length} Pending</span>
        </div>

        {venueRequests.length === 0 ? (
          <p className="muted">No pending venue requests</p>
        ) : (
          <div className="approvals-table-wrap">
            <table className="approvals-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {venueRequests.map((req) => (
                  <tr key={req.venue_request_id}>
                    <td>{req.venue_request_id}</td>
                    <td>{req.event_name || `Event #${req.event_id}`}</td>
                    <td>{req.venue_name || `Venue Availability #${req.venue_available_id}`}</td>
                    <td>
                      <span className={`badge ${req.status?.toLowerCase() || "pending"}`}>
                        {req.status || "PENDING"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="approval-btn approve" onClick={() => openConfirm("venue", req.venue_request_id, "APPROVED")}>
                        Approve
                      </button>
                      <button className="approval-btn reject" onClick={() => openConfirm("venue", req.venue_request_id, "REJECTED")}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // click outside closes
            if (e.target === e.currentTarget && !submitting) closeConfirm();
          }}
        >
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h4 className="modal-title">
                Confirm {confirmModal.decision === "APPROVED" ? "Approval" : "Rejection"}
              </h4>
            </div>

            <div className="modal-body">
              <p className="modal-text">
                Are you sure you want to{" "}
                <b>{confirmModal.decision === "APPROVED" ? "approve" : "reject"}</b>{" "}
                this {confirmModal.type} request?
              </p>

              <div className="modal-field">
                <label className="modal-label">
                  Remark{" "}
                  {confirmModal.type === "venue" && confirmModal.decision === "REJECTED" ? (
                    <span className="modal-required">(required)</span>
                  ) : (
                    <span className="modal-optional">(optional)</span>
                  )}
                </label>

                <textarea
                  className="modal-textarea"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={
                    confirmModal.decision === "REJECTED"
                      ? "Enter reason / remark..."
                      : "Enter remark (optional)..."
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={closeConfirm} disabled={submitting}>
                Cancel
              </button>

              <button
                className={`modal-btn ${confirmModal.decision === "APPROVED" ? "primary" : "danger"}`}
                onClick={submitDecision}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal.open && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // click outside closes result too
            if (e.target === e.currentTarget) closeResult();
          }}
        >
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h4 className="modal-title">{resultModal.title}</h4>
            </div>

            <div className="modal-body">
              <p className="modal-text">{resultModal.message}</p>
            </div>

            <div className="modal-actions">
              <button className="modal-btn primary" onClick={closeResult}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Approval;
