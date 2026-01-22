import React, { useState, useEffect } from 'react';

function EventRequestList(){
  // 1. Prepare the memory (State)
  const [EventRequest, setEventRequest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. The Trigger (Effect)
  useEffect(() => {
    // We define the logic inside to avoid "race conditions"
    const fetchEventRequests = async () => {
      try {
        // Reset error slightly before starting (optional but good practice)
        setError(null);
        
        // --- STEP A: The Request ---
        // Use relative path - Vite proxy will forward to Flask backend
        // Using admin user (ID 2) to view all events
        // TODO: Replace with actual logged-in user ID from auth
        const response = await fetch('/api/event-requests?viewer_id=2', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // If you implement auth later, your token goes here
          },
        });

        // --- STEP B: The Guard ---
        // "Hard Concept": fetch() does not throw errors for 404/500 codes.
        // We must check the 'ok' property manually.
        if (!response.ok) {
          throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        // --- STEP C: The Parse ---
        const result = await response.json();

        // --- STEP D: The Update ---
        // Backend returns object with event_requests array
        setEventRequest(result.event_requests || []); 
        
      } catch (err) {
        // --- STEP E: The Safety Net ---
        // We save the error message to display it to the user later
        setError(err.message);
        console.error("Fetch aborted:", err);
      } finally {
        // --- STEP F: The Cleanup ---
        // Whether we succeeded or failed, we are done loading.
        setLoading(false);
      }
    };

    // Execute the function we just defined
    fetchEventRequests();
    
  }, []); // <--- The empty array means "run only once on mount"

  // Loading and error states
  if (loading) {
    return <div>Loading events...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <>
      <table>  
      <thead>
        <tr>
          <th>Event Name</th>
          <th>Date</th>
          <th>Time</th>
          <th>Purpose</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
      {/* 3. The Map */}
      {EventRequest.length === 0 ? (
        <tr>
          <td colSpan="5" style={{ textAlign: 'center' }}>No events found</td>
        </tr>
      ) : (
        EventRequest.map((req) => (
          <tr key={req.event_id}>
            <td>{req.event_name}</td> 
            <td>{req.event_date}</td> 
            <td>{req.start_time} - {req.end_time}</td>
            <td>{req.purpose}</td> 
            <td>
              <span className={`badge ${req.status.toLowerCase()}`}>
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
};

export default EventRequestList;