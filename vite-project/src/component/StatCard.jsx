const StatCard = ({ title, value }) => (
  <div className="stat-card">
    <h3>{title}</h3>
    <div className="value">{value}</div>
  </div>
);

export default StatCard;