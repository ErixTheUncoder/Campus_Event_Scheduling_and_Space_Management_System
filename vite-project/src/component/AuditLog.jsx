import { useState, useEffect} from "react";

// Dummy data placeholder in case database doesn't connect
const tempDummyData = [
  {
    audit_id: 1,
    user_id: 2,
    action_type: "APPROVE_BOOKING",
    action_date_time: "2026-01-20T10:30:00",
    entity_type: "booking_request",
    entity_id: 5,
    old_value: "pending",
    new_value: "approved"
  },
  {
    audit_id: 2,
    user_id: 1,
    action_type: "CREATE_EVENT",
    action_date_time: "2026-01-21T14:15:00",
    entity_type: "event_request",
    entity_id: 10,
    old_value: null,
    new_value: "pending"
  },
  {
    audit_id: 3,
    user_id: 2,
    action_type: "UPDATE_VENUE",
    action_date_time: "2026-01-22T09:00:00",
    entity_type: "venue",
    entity_id: 3,
    old_value: "available",
    new_value: "unavailable"
  }
];

function AuditLog(){
  // 1. Prepare the memory (State)
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. The Trigger (Effect)
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setError(null);
        
        // --- STEP A: The Request ---
        const response = await fetch('/api/audit', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // --- STEP B: The Guard ---
        if (!response.ok) {
          throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        // --- STEP C: The Parse ---
        const result = await response.json();

        // --- STEP D: The Update ---
        setAuditLogs(result.audit_logs || []); 
        
      } catch (err) {
        // --- STEP E: The Safety Net ---
        // Use dummy data if database connection fails
        console.warn("Failed to fetch audit logs, using dummy data:", err);
        setAuditLogs(tempDummyData);
        setError(err.message);
      } finally {
        // --- STEP F: The Cleanup ---
        setLoading(false);
      }
    };

    fetchAuditLogs();
    
  }, []); // Run only once on mount

  // Loading state
  if (loading) {
    return <div>Loading audit logs...</div>;
  }

  // Format date and time for display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
    <div className="table-container">
      {error && (
        <div style={{ color: 'orange', marginBottom: '10px' }}>
          Note: Using sample data (database connection issue)
        </div>
      )}
      
      <table className="audit-table">  
        <thead>
          <tr>
            <th>Audit ID</th>
            <th>User ID</th>
            <th>Action Type</th>
            <th>Date & Time</th>
            <th>Entity Type</th>
            <th>Entity ID</th>
            <th>Old Value</th>
            <th>New Value</th>
          </tr>
        </thead>
        <tbody>
          {/* 3. The Map */}
          {auditLogs.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>No audit logs found</td>
            </tr>
          ) : (
            auditLogs.map((log) => (
              <tr key={log.audit_id}>
                <td>{log.audit_id}</td>
                <td>{log.user_id || 'N/A'}</td>
                <td>{log.action_type}</td>
                <td>{formatDateTime(log.action_date_time)}</td>
                <td>{log.entity_type}</td>
                <td>{log.entity_id || 'N/A'}</td>
                <td>{log.old_value || '-'}</td>
                <td>{log.new_value || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </>
  );
}

export default AuditLog;