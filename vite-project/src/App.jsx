import { useState } from 'react';
import './App.css';
import './component/Header';

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




export default App;