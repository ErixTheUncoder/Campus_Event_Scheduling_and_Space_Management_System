const BookingTable = () => {
  const bookings = [
    { id: 1, event: 'Hackathon 2024', location: 'Main Hall', date: '2024-12-25', status: 'Confirmed' },
    { id: 2, event: 'CS Club Meetup', location: 'Lab 3', date: '2024-12-26', status: 'Pending' },
    { id: 3, event: 'Exam Prep', location: 'Library Room A', date: '2024-12-27', status: 'Confirmed' },
    { id: 4, event: 'Staff Meeting', location: 'Conf Room B', date: '2024-12-28', status: 'Pending' },
  ];

  return (
    <table>
      <thead>
        <tr>
          <th>Event Name</th>
          <th>Location</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map(b => (
          <tr key={b.id}>
            <td>{b.event}</td>
            <td>{b.location}</td>
            <td>{b.date}</td>
            <td>
              <span className={`badge ${b.status.toLowerCase()}`}>
                {b.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BookingTable;