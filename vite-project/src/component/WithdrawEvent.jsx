import React, { useEffect, useState } from "react";

function WithdrawEvent({ user }) {
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser?.user_id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const [purposeModalOpen, setPurposeModalOpen] = useState(false);
  const [purposeModalText, setPurposeModalText] = useState("");

  const openPurposeModal = (text) => {
  setPurposeModalText(text || "-");
  setPurposeModalOpen(true);
  };

  const closePurposeModal = () => {
  setPurposeModalOpen(false);
  setPurposeModalText("");
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/event-requests/?viewer_id=${userId}&status=PENDING`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setItems(data.event_requests || []);
    } catch (e) {
      setError(e.message || "Failed to load pending events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openConfirm = (req) => {
    setActive(req);
    setConfirmOpen(true);
  };

  const doWithdraw = async () => {
    if (!active) return;

    try {
      setWithdrawing(true);
      setError("");

      const res = await fetch(`/api/event-requests/${active.event_id}/withdraw`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setConfirmOpen(false);
      setActive(null);
      await fetchPending();
    } catch (e) {
      setError(e.message || "Failed to withdraw event");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <>
      <div className="tableHeader">
        <h2>Withdraw Event (Events on pending status only)</h2>
      </div>

      <div className="table-container">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
            <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
            </colgroup>

            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Requested Venue</th>
                <th>Purpose</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>No pending event requests</td>
                </tr>
              ) : (
                items.map((req) => (
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
                      <button
                        className="modal-btn danger"
                        onClick={() => openConfirm(req)}
                      >
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
                Withdraw <b>{active?.event_name}</b>? <br />
                This will set the event request to <b>Cancelled</b> and cancel all linked venue requests.
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

      {purposeModalOpen && (
        <div className="modal-backdrop" onClick={closePurposeModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
                <h3 className="modal-title">Purpose</h3>
            </div>

            <div className="modal-body">
                <p className="modal-text" style={{ whiteSpace: "pre-wrap" }}>
                {purposeModalText}
                </p>
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

export default WithdrawEvent;
