import { useState, useEffect } from 'react';
import StatCard from './StatCard';
import BookingEvents from './BookingEvents'


const DashboardContent = () => {
  const [stats, setStats] = useState({
    upcoming_events: 0,
    pending_requests: 0,
    total_venues: 0,
    active_users: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Get user info from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setError('User not logged in');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        
        // Check if user is admin
        if (user.user_role !== 'Admin') {
          setError('Access denied. Admin only.');
          setLoading(false);
          return;
        }

        // Fetch dashboard stats
        const response = await fetch(
          `http://localhost:5000/api/admin/dashboard/stats?admin_id=${user.user_id}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch dashboard stats');
        }

        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="stats-grid">
        <StatCard title="Upcoming Events" value={stats.upcoming_events} />
        <StatCard title="Pending Requests" value={stats.pending_requests} />
        <StatCard title="Total Venues" value={stats.total_venues} />
        <StatCard title="Active Users" value={stats.active_users} />
      </div>

      <div className="table-container">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
          <h3>Recent Bookings</h3>
        </div>
        <BookingEvents limit={5} />
      </div>
    </>
  );
};

export default DashboardContent;