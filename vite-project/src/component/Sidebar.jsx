import { NavLink } from 'react-router-dom'; // Import NavLink

const Sidebar = () => {
  // Update menu items to allow mapping to paths
  const menu = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Events', path: '/events' },
    { name: 'Venues', path: '/venues' },
    { name: 'Approvals', path: '/approvals' },
    { name: 'Settings', path: '/settings' }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">Campus Scheduler</div>
      <nav>
        {menu.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            // NavLink automatically provides 'isActive' to style the selected tab
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} navbar`}
            >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;