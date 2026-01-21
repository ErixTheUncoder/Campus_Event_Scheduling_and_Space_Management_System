import React, { useState, useEffect } from 'react';

function Venue() {
  const [venues, setVenues] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        
        // Fetch both venues and availability data
        const [venuesResponse, availabilityResponse] = await Promise.all([
          fetch('/api/venues', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
          fetch('/api/availability', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }).catch(() => null) // Don't fail if availability endpoint doesn't work
        ]);

        if (!venuesResponse.ok) {
          throw new Error(`HTTP Error! Status: ${venuesResponse.status}`);
        }

        const venuesResult = await venuesResponse.json();
        setVenues(venuesResult.venues || []);
        
        // Try to get availability data if the endpoint worked
        if (availabilityResponse && availabilityResponse.ok) {
          const availabilityResult = await availabilityResponse.json();
          setAvailability(availabilityResult.availability || []);
        }
        
      } catch (err) {
        setError(err.message);
        console.error("Fetch venues error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to determine availability status based on start_datetime
  const getAvailabilityStatus = (venue) => {
    // Check if this venue has any availability records with start_datetime
    const hasAvailabilityRecord = availability.some(
      avail => avail.venue_id === venue.venue_id && avail.start_datetime
    );
    
    // If there's a start_datetime, the venue is unavailable
    return hasAvailabilityRecord ? 'Unavailable' : 'Available';
  };

  // Helper function to get status badge class
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'available':
        return 'badge-available';
      case 'on hold':
        return 'badge-on-hold';
      case 'unavailable':
        return 'badge-unavailable';
      case 'maintenance':
        return 'badge-maintenance';
      default:
        return '';
    }
  };

  if (loading) {
    return <div>Loading venues...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <>
      <div className="tableHeader">
        <h2>Venues Available</h2>
        <button className="add-Button">Edit</button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Venue</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody>
            {venues.length === 0 ? (
              <tr>
                <td colSpan="2" style={{ textAlign: 'center' }}>No venues found</td>
              </tr>
            ) : (
              venues.map((venue) => {
                const status = getAvailabilityStatus(venue);
                return (
                  <tr key={venue.venue_id}>
                    <td>{venue.venue_name}</td>
                    <td>
                      <span className={`badge ${getStatusClass(status)}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Venue;
