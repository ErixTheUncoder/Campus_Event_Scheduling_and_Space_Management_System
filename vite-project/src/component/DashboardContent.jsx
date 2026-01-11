const DashboardContent = () => {
  return (
    <>
      <div className="stats-grid">
        <StatCard title="Upcoming Events" value="8" />
        <StatCard title="Pending Requests" value="12" />
        <StatCard title="Total Venues" value="24" />
        <StatCard title="Active Users" value="156" />
      </div>

      <div className="table-container">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
          <h3>Recent Bookings</h3>
          <button className="btn">+ New Booking</button>
        </div>
        <BookingTable />
      </div>
    </>
  );
};

export default DashboardContent;