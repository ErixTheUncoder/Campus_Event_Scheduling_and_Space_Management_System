import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

function Approval() {
  const [bookingRequests, setBookingRequests] = useState([]);
  const [eventRequests, setEventRequests] = useState([]);
  const [venueRequests, setVenueRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    if (user.user_id) {
      fetchAllRequests(user.user_id);
    } else {
      setError('Please log in to access this page');
      setLoading(false);
    }
  }, []);

  const fetchAllRequests = async (adminId) => {
    try {
      setLoading(true);
      
      // Fetch booking requests
      const bookingResponse = await fetch(
        `${API_BASE_URL}/booking-requests/?viewer_id=${adminId}&status=PENDING`
      );
      const bookingData = await bookingResponse.json();
      
      // Fetch event requests
      const eventResponse = await fetch(
        `${API_BASE_URL}/event-requests/?viewer_id=${adminId}&status=PENDING`
      );
      const eventData = await eventResponse.json();
      
      // Fetch venue requests
      const venueResponse = await fetch(
        `${API_BASE_URL}/venue-requests/?viewer_id=${adminId}&status=PENDING`
      );
      const venueData = await venueResponse.json();

      setBookingRequests(bookingData.booking_requests || []);
      setEventRequests(eventData.event_requests || []);
      setVenueRequests(venueData.venue_requests || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch requests: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingDecision = async (bookingId, decision) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/booking-requests/${bookingId}/decision`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_id: currentUser.user_id,
            decision: decision,
            admin_comment: decision === 'APPROVED' ? 'Approved' : 'Rejected'
          })
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        alert(`Booking request ${decision.toLowerCase()} successfully`);
        fetchAllRequests(currentUser.user_id);
      } else {
        alert('Error: ' + (data.error || 'Failed to update booking request'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEventDecision = async (eventId, decision) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/event-requests/${eventId}/decision`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_id: currentUser.user_id,
            decision: decision,
            admin_comment: decision === 'APPROVED' ? 'Approved' : 'Rejected'
          })
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        alert(`Event request ${decision.toLowerCase()} successfully`);
        fetchAllRequests(currentUser.user_id);
      } else {
        alert('Error: ' + (data.error || 'Failed to update event request'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleVenueDecision = async (venueRequestId, decision) => {
    const remark = decision === 'REJECTED' 
      ? prompt('Please provide a reason for rejection:') 
      : '';
      
    if (decision === 'REJECTED' && !remark) {
      alert('Remark is required for rejection');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/venue-requests/${venueRequestId}/decision`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_id: currentUser.user_id,
            decision: decision,
            remark: remark || 'Approved'
          })
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        alert(`Venue request ${decision.toLowerCase()} successfully`);
        fetchAllRequests(currentUser.user_id);
      } else {
        alert('Error: ' + (data.error || 'Failed to update venue request'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return <div>Loading requests...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <>
      <h2>Pending Approval Requests</h2>
      
      {/* Booking Requests */}
      <h3>Booking Requests</h3>
      {bookingRequests.length === 0 ? (
        <p>No pending booking requests</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student</th>
              <th>Venue</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookingRequests.map((req) => (
              <tr key={req.booking_id}>
                <td>{req.booking_id}</td>
                <td>{req.user_id}</td>
                <td>{req.venue_available_id}</td>
                <td>{req.booking_date}</td>
                <td>
                  <span className={`badge ${req.status?.toLowerCase() || 'pending'}`}>
                    {req.status || 'PENDING'}
                  </span>
                </td>
                <td>
                  <button 
                    className="approval-btn approve"
                    onClick={() => handleBookingDecision(req.booking_id, 'APPROVED')}
                  >
                    Approve
                  </button>
                  <button 
                    className="approval-btn reject"
                    onClick={() => handleBookingDecision(req.booking_id, 'REJECTED')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Event Requests */}
      <h3>Event Requests</h3>
      {eventRequests.length === 0 ? (
        <p>No pending event requests</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Event Name</th>
              <th>Organizer</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {eventRequests.map((req) => (
              <tr key={req.event_id}>
                <td>{req.event_id}</td>
                <td>{req.event_name}</td>
                <td>{req.user_id}</td>
                <td>{req.event_date}</td>
                <td>{req.start_time} - {req.end_time}</td>
                <td>
                  <span className={`badge ${req.status?.toLowerCase() || 'pending'}`}>
                    {req.status || 'PENDING'}
                  </span>
                </td>
                <td>
                  <button 
                    className="approval-btn approve"
                    onClick={() => handleEventDecision(req.event_id, 'APPROVED')}
                  >
                    Approve
                  </button>
                  <button 
                    className="approval-btn reject"
                    onClick={() => handleEventDecision(req.event_id, 'REJECTED')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Venue Requests */}
      <h3>Venue Requests</h3>
      {venueRequests.length === 0 ? (
        <p>No pending venue requests</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Event ID</th>
              <th>Venue ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {venueRequests.map((req) => (
              <tr key={req.venue_request_id}>
                <td>{req.venue_request_id}</td>
                <td>{req.event_id}</td>
                <td>{req.venue_available_id}</td>
                <td>
                  <span className={`badge ${req.status?.toLowerCase() || 'pending'}`}>
                    {req.status || 'PENDING'}
                  </span>
                </td>
                <td>
                  <button 
                    className="approval-btn approve"
                    onClick={() => handleVenueDecision(req.venue_request_id, 'APPROVED')}
                  >
                    Approve
                  </button>
                  <button 
                    className="approval-btn reject"
                    onClick={() => handleVenueDecision(req.venue_request_id, 'REJECTED')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default Approval;