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
  const [userRole, setUserRole] = useState('');

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
        setUserRole(user.user_role);
        
        // Check if user has access to dashboard
        const allowedRoles = ['Admin', 'Student', 'Event_Organizer'];
        if (!allowedRoles.includes(user.user_role)) {
          setError('Access denied.');
          setLoading(false);
          return;
        }

        // Fetch dashboard stats
        const response = await fetch(
          `http://localhost:5000/api/admin/dashboard/stats?user_id=${user.user_id}`
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

  // Customize labels based on user role
  const getUpcomingLabel = () => {
    if (userRole === 'Student') return 'My Upcoming Bookings';
    if (userRole === 'Event_Organizer') return 'My Upcoming Events';
    return 'Upcoming Events';
  };

  const getPendingLabel = () => {
    if (userRole === 'Student') return 'My Pending Bookings';
    if (userRole === 'Event_Organizer') return 'My Pending Requests';
    return 'Pending Requests';
  };

  const getRecentLabel = () => {
    if (userRole === 'Student') return 'My Recent Bookings';
    if (userRole === 'Event_Organizer') return 'My Recent Events';
    return 'Recent Bookings';
  };

  return (
    <>
      <div className="stats-grid">
        <StatCard title={getUpcomingLabel()} value={stats.upcoming_events} />
        <StatCard title={getPendingLabel()} value={stats.pending_requests} />
        <StatCard title="Total Venues" value={stats.total_venues} />
        {userRole === 'Admin' && (
          <StatCard title="Active Users" value={stats.active_users} />
        )}
      </div>

      <div className="table-container">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
          <h3>{getRecentLabel()}</h3>
        </div>
        <BookingEvents limit={5} />
      </div>
    </>
  );
};

export default DashboardContent;