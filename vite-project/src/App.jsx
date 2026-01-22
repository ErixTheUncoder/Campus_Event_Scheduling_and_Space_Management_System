import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Import Route tools
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

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on app mount
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

  // Save user to localStorage whenever it changes
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Role-based route guard component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.user_role)) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  };

  return (
    <Routes>
      {/* 1. Public Route: Login */}
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/dashboard" replace /> : 
          <div className="loginBackground">
            <LoginForm onLoginSuccess={handleLogin} />
          </div>
        } 
      />

      {/* 2. Protected Routes (Wrapped in Layout) */}
      <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
        
        {/* Redirect root "/" to Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Actual Pages */}
        <Route path="/dashboard" element={<DashboardContent />} />

        {/* Events - Only for Admin and Event Organizer */}
        <Route 
          path="/events" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Event Organizer']}>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route 
          path='/events/add' 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Event Organizer']}>
              <AddEventForm/>
            </ProtectedRoute>
          }
        />

        {/* Venues - All roles can access */}
        <Route path="/venues" element={<Venue />} />

        {/* Approvals - Only for Admin */}
        <Route 
          path="/approvals" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Approval/>
            </ProtectedRoute>
          }
        />

        {/* User Management - Only for Admin */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />


        <Route path="/settings" element={<PlaceholderContent title="Settings" />} />
        
      </Route>
    </Routes>
  );
}

export default App;