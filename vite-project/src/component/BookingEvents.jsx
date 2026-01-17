import React, { useState, useEffect } from 'react';

function EventRequestList(){
  const bookings = [
    { id: 1, event: 'Hackathon 2024', location: 'Main Hall', date: '2024-12-25', status: 'Confirmed' },
    { id: 2, event: 'CS Club Meetup', location: 'Lab 3', date: '2024-12-26', status: 'Pending' },
    { id: 3, event: 'Exam Prep', location: 'Library Room A', date: '2024-12-27', status: 'Confirmed' },
    { id: 4, event: 'Staff Meeting', location: 'Conf Room B', date: '2024-12-28', status: 'Pending' },
    { id: 5, event: 'Staff Meeting', location: 'Conf Room B', date: '2024-12-28', status: 'Rejected' },
  ];
  // 1. Prepare the memory (State)
  const [EventRequest, setEventRequest] = useState(bookings); //TEMPORARY VALUE


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
    <>
      <table>  
      <tr>
        <th>Event Name</th>
        <th>Location</th>
        <th>Date</th>
        <th>Status</th>
      </tr>
      {/* 3. The Map */}
      {EventRequest.map((req) => (
        // TODO: What do you want to display for each request?
        <tr key={req.id}>
          <td>{req.event}</td> 
          <td>{req.location}</td> 
          <td>{req.date}</td> 
          <td>
           
            <span className={`badge ${req.status.toLowerCase()}`}>
                {req.status}
              </span>
              </td> 
        </tr>
      ))}
      </table>
  </>
  );
};

export default EventRequestList;