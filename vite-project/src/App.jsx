import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Layout from './component/Layout';
import DashboardContent from './component/DashboardContent';
import PlaceholderContent from './component/PlaceholderContent';
import LoginForm from './component/login';
import Events from './component/Events';
import AddEventForm from './component/AddEventForm';
import Approval from './component/Approval';
import Venue from './component/Venue';
import UserManagement from './component/UserManagement';
import AuditLog from './component/AuditLog';
import EventCalendar from "./component/EventCalendar";
import EditEvent from "./component/EditEvent";
import WithdrawEvent from "./component/WithdrawEvent";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.user_role)) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/dashboard" replace /> :
          <div className="loginBackground">
            <LoginForm onLoginSuccess={handleLogin} />
          </div>
        }
      />

      <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardContent />} />

        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Event Organizer']}>
              <Events user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/calendar"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Event Organizer', 'Student']}>
              <EventCalendar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/add"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Event Organizer']}>
              <AddEventForm />
            </ProtectedRoute>
          }
        />

        {/* edit and withdraw EO only */}
        <Route
          path="/events/edit"
          element={
            <ProtectedRoute allowedRoles={['Event Organizer']}>
              <EditEvent user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/withdraw"
          element={
            <ProtectedRoute allowedRoles={['Event Organizer']}>
              <WithdrawEvent user={user} />
            </ProtectedRoute>
          }
        />

        <Route path="/venues" element={<Venue />} />

        <Route
          path="/approvals"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Approval />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-log"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AuditLog />
            </ProtectedRoute>
          }
        />

        <Route path="/settings" element={<PlaceholderContent title="Settings" />} />
      </Route>
    </Routes>
  );
}

export default App;
