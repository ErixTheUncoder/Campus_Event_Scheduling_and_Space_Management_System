import { NavLink } from 'react-router-dom'; // Import NavLink

const Sidebar = ({ user }) => {
  // Define all menu items with role restrictions
  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', roles: ['Admin', 'Event Organizer', 'Student'] },
    { name: 'Events', path: '/events', roles: ['Admin', 'Event Organizer'] },
    { name: 'Venues', path: '/venues', roles: ['Admin', 'Event Organizer', 'Student'] },
    { name: 'Approvals', path: '/approvals', roles: ['Admin'] },
    { name: 'User Management', path: '/users', roles: ['Admin'] },
    { name: 'Audit Log', path: '/audit-log', roles: ['Admin'] },
    { name: 'Settings', path: '/settings', roles: ['Admin', 'Event Organizer', 'Student'] }
  ];

  // Filter menu items based on user role
  const menu = allMenuItems.filter(item => 
    item.roles.includes(user?.user_role)
  );

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