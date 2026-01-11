import { useState } from 'react';
import './App.css';
import Header from './component/Header';
import Sidebar from './component/Sidebar';
import DashboardContent from './component/DashboardContent';'./component/DashboardContent';
import PlaceholderContent from  './component/PlaceholderContent';


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

export default App;