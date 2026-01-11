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

export default Sidebar;