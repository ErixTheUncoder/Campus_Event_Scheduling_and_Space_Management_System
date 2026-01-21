import { useNavigate } from 'react-router-dom';

const Header = ({ title, user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <header className="header">
      <h2>{title}</h2>
      <div className="user-info">
        <span>Welcome, <strong>{user?.full_name || user?.name || 'User'}</strong></span>
        <button 
          onClick={handleLogout} 
          className="logout-btn"
          style={{
            marginLeft: '1rem',
            padding: '0.4rem 0.8rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;