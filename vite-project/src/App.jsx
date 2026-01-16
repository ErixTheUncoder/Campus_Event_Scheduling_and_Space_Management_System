import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Import Route tools
import './App.css';

import Layout from './component/Layout';
import DashboardContent from './component/DashboardContent';
import PlaceholderContent from './component/PlaceholderContent';
import LoginForm from './component/login';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Routes>
      {/* 1. Public Route: Login */}
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/dashboard" replace /> : 
          <div className="loginBackground">
            <LoginForm onLoginSuccess={(u) => setUser(u)} />
          </div>
        } 
      />

      {/* 2. Protected Routes (Wrapped in Layout) */}
      <Route element={user ? <Layout user={user} /> : <Navigate to="/login" replace />}>
        
        {/* Redirect root "/" to Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Actual Pages */}
        <Route path="/dashboard" element={<DashboardContent />} />
        <Route path="/events" element={<PlaceholderContent title="Events" />} />
        <Route path="/venues" element={<PlaceholderContent title="Venues" />} />
        <Route path="/approvals" element={<PlaceholderContent title="Approvals" />} />
        <Route path="/settings" element={<PlaceholderContent title="Settings" />} />
        
      </Route>
    </Routes>
  );
}

export default App;