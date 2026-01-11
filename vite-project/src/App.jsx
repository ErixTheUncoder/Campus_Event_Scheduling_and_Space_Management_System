import { useState } from 'react';
import './App.css';
import Header from './component/Header';
import Sidebar from './component/Sidebar';
import DashboardContent from './component/DashboardContent';'./component/DashboardContent';
import PlaceholderContent from  './component/PlaceholderContent';
import LoginForm from './component/login';


function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if(isLoggedIn){
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
  )
}
  else{
    return(
      <div className='loginBackground'>
        <LoginForm />
      </div>
    );
  }
}

  


export default App;