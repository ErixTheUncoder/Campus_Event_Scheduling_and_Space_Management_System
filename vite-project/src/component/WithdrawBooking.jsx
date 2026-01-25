import React, { useEffect, useState } from "react";

function WithdrawBooking({ user }) {
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser?.user_id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/booking-requests/?viewer_id=${userId}&status=PENDING`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setItems(data.booking_requests || []);
    } catch (e) {
      setError(e.message || "Failed to load pending bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openConfirm = (bk) => {
    setActive(bk);
    setConfirmOpen(true);
  };

  const doWithdraw = async () => {
    if (!active) return;

    try {
      setWithdrawing(true);
      setError("");

      const res = await fetch(`/api/booking-requests/${active.booking_id}/withdraw`, {
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
      setError(e.message || "Failed to withdraw booking");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <>
      <div className="tableHeader">
        <h2>Withdraw Booking (Pending only)</h2>
      </div>

      <div className="table-container">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
            <colgroup>
              <col style={{ width: "30%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>

            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No pending booking requests
                  </td>
                </tr>
              ) : (
                items.map((bk) => (
                  <tr key={bk.booking_id}>
                    <td>{bk.booking_id}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{bk.booking_date}</td>
                    <td>
                      <span className={`badge ${String(bk.status || "").toLowerCase()}`}>{bk.status}</span>
                    </td>
                    <td>
                      <button className="modal-btn danger" onClick={() => openConfirm(bk)}>
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
                Withdraw booking <b>#{active?.booking_id}</b>? <br />
                This will release the venue availability slot.
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
    </>
  );
}

export default WithdrawBooking;
