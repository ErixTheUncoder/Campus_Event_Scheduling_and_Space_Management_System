import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AddEventForm = () => {
  const navigate = useNavigate();
  
  // Form states
  const [eventName, setEventName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueId, setVenueId] = useState('');
  
  // Data states
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch venues on component mount
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch('/api/venues');
        if (!response.ok) throw new Error('Failed to fetch venues');
        
        const result = await response.json();
        setVenues(result.venues || []);
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError('Could not load venues');
      }
    };
    
    fetchVenues();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.user_id) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      console.log('Creating event with user:', user.user_id);

      // Step 1: Create Event Request
      const eventPayload = {
        user_id: user.user_id,
        event_name: eventName,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose
      };

      console.log('Event payload:', eventPayload);

      const eventResponse = await fetch('/api/event-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });

      const eventResult = await eventResponse.json();
      console.log('Event response:', eventResult);

      if (!eventResponse.ok) {
        throw new Error(eventResult.error || 'Failed to create event');
      }

      const eventId = eventResult.event_request.event_id;
      console.log('Event created with ID:', eventId);

      // Step 2: Create Venue Request with conflict checking
      const venuePayload = {
        organiser_id: user.user_id,
        event_id: eventId,
        venue_id: parseInt(venueId),
        date: eventDate,
        start_time: startTime,
        end_time: endTime,
        reason: purpose
      };

      console.log('Venue request payload:', venuePayload);

      const venueResponse = await fetch('/api/venue-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venuePayload)
      });

      const venueResult = await venueResponse.json();
      console.log('Venue response:', venueResult);

      if (!venueResponse.ok) {
        // If venue request fails, show specific error (like conflict)
        throw new Error(venueResult.error || 'Failed to request venue');
      }

      alert("Event and Venue Request Created Successfully!"); 
      navigate('/events');
      
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table-container">
      <h3>Create New Event</h3>
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffe6e6', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
        
        <label>
          Event Name:
          <input 
            type="text" 
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
          />
        </label>

        <label>
          Event Description / Purpose:
          <textarea 
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '80px' }} 
          />
        </label>

        <label>
          Date:
          <input 
            type="date" 
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
          />
        </label>

        <label>
          Start Time:
          <input 
            type="time" 
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
          />
        </label>

        <label>
          End Time:
          <input 
            type="time" 
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
          />
        </label>

        <label>
          Venue:
          <select 
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">-- Select a Venue --</option>
            {venues.map((venue) => (
              <option key={venue.venue_id} value={venue.venue_id}>
                {venue.venue_name} ({venue.location}) - Capacity: {venue.capacity}
              </option>
            ))}
          </select>
        </label>

        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            disabled={loading}
            style={{ marginLeft: '10px', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEventForm;