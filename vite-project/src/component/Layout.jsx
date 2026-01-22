import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar'; // Import your existing sidebar
import Header from './Header';   // Import your existing header

const Layout = ({ user, onLogout }) => {
  const location = useLocation();

  // Helper to make the Header title dynamic based on the URL
  const getTitle = () => {
    const path = location.pathname.replace('/', '');
    return path.charAt(0).toUpperCase() + path.slice(1) || 'Dashboard';
  };

  return (
    <div className="app-container">
      <Sidebar user={user} /> 
      <div className="main-content">
        <Header title={getTitle()} user={user} onLogout={onLogout} />
        <div className="dashboard-view">
          {/* content for the route (e.g. DashboardContent) renders here */}
          <Outlet /> 
        </div>
      </div>
    </div>
  );
};

export default Layout;