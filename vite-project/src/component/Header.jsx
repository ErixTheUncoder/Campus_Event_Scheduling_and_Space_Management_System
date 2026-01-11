const Header = ({ title }) => {
  return (
    <header className="header">
      <h2>{title}</h2>
      <div className="user-info">
        <span>Welcome, <strong>Admin</strong></span>
      </div>
    </header>
  );
};

export default Header;