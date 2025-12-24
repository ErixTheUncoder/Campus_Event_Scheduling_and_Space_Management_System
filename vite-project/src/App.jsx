import { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="main-content">
        <Header title={activeTab} />
        <div className="dashboard-view">
          {activeTab === 'Dashboard' && <DashboardContent />}
          {activeTab !== 'Dashboard' && <PlaceholderContent title={activeTab} />}
        </div>
      </div>
    </div>
  );
}

/* --- Sub-Components --- */

const Sidebar = ({ activeTab, onTabChange }) => {
  const menu = ['Dashboard', 'Events', 'Venues', 'Approvals', 'Settings'];

  return (
    <aside className="sidebar">
      <div className="brand">Campus Scheduler</div>
      <nav>
        {menu.map(item => (
          <div 
            key={item}
            className={`nav-link ${activeTab === item ? 'active' : ''}`}
            onClick={() => onTabChange(item)}
          >
            {item}
          </div>
        ))}
      </nav>
    </aside>
  );
};

const Header = ({ title }) => {
  return (
    <header className="header">
      <h2>{title}</h2>
      <div className="user-info">
        <span>Welcome, <strong>Admin</strong></span>
      </div>
    </header>
  );
};

const DashboardContent = () => {
  return (
    <>
      <div className="stats-grid">
        <StatCard title="Upcoming Events" value="8" />
        <StatCard title="Pending Requests" value="12" />
        <StatCard title="Total Venues" value="24" />
        <StatCard title="Active Users" value="156" />
      </div>

      <div className="table-container">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
          <h3>Recent Bookings</h3>
          <button className="btn">+ New Booking</button>
        </div>
        <BookingTable />
      </div>
    </>
  );
};

const StatCard = ({ title, value }) => (
  <div className="stat-card">
    <h3>{title}</h3>
    <div className="value">{value}</div>
  </div>
);

const BookingTable = () => {
  const bookings = [
    { id: 1, event: 'Hackathon 2024', location: 'Main Hall', date: '2024-12-25', status: 'Confirmed' },
    { id: 2, event: 'CS Club Meetup', location: 'Lab 3', date: '2024-12-26', status: 'Pending' },
    { id: 3, event: 'Exam Prep', location: 'Library Room A', date: '2024-12-27', status: 'Confirmed' },
    { id: 4, event: 'Staff Meeting', location: 'Conf Room B', date: '2024-12-28', status: 'Pending' },
  ];

  return (
    <table>
      <thead>
        <tr>
          <th>Event Name</th>
          <th>Location</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map(b => (
          <tr key={b.id}>
            <td>{b.event}</td>
            <td>{b.location}</td>
            <td>{b.date}</td>
            <td>
              <span className={`badge ${b.status.toLowerCase()}`}>
                {b.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const PlaceholderContent = ({ title }) => (
  <div className="table-container" style={{textAlign: 'center', padding: '3rem'}}>
    <h2>{title} Section</h2>
    <p style={{color: '#7f8c8d'}}>This module is under development.</p>
  </div>
);

export default App;