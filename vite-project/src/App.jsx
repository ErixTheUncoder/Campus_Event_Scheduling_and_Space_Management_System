import { useState } from 'react';
import './App.css';
import Header from './component/Header';
import Sidebar from './component/Sidebar';
import DashboardContent from './component/DashboardContent';
import PlaceholderContent from './component/PlaceholderContent';
import LoginForm from './component/login';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [user, setUser] = useState(null);

  const isLoggedIn = !!user;

  if (isLoggedIn) {
    return (
      <div className="app-container">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="main-content">
          <Header title={activeTab} />
          <div className="dashboard-view">
            {activeTab === 'Dashboard' && <DashboardContent user={user} />}
            {activeTab !== 'Dashboard' && <PlaceholderContent title={activeTab} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="loginBackground">
      <LoginForm onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
    </div>
  );
}

export default App;
