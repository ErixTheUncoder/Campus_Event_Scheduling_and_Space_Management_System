import React, { useState, useEffect } from 'react';

const EventRequestList = () => {
  // 1. Prepare the memory (State)
  const [EventRequest, setEventRequest] = useState([]);


  // 2. The Trigger (Effect)
useEffect(() => {
    // We define the logic inside to avoid "race conditions"
    const fetchEventRequests = async () => {
      try {
        // Reset error slightly before starting (optional but good practice)
        setError(null);
        
        // --- STEP A: The Request ---
        // Replace this URL with your actual Flask endpoint
        const EventRequest = await fetch('/api/event_request', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // If you implement auth later, your token goes here
          },
        });

        // --- STEP B: The Guard ---
        // "Hard Concept": fetch() does not throw errors for 404/500 codes.
        // We must check the 'ok' property manually.
        if (!EventRequest.ok) {
          throw new Error(`HTTP Error! Status: ${EventRequest.status}`);
        }

        // --- STEP C: The Parse ---
        const result = await EventRequest.json();

        // --- STEP D: The Update ---
        setData(result); 
        
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

  return (
    <div>
      <h1>Event Requests</h1>
      {/* 3. The Map */}
      {EventRequest.map((req) => (
        // TODO: What do you want to display for each request?
        <div key={req.id}>
           {req.viewer_id}
        </div>
      ))}
    </div>
  );
};