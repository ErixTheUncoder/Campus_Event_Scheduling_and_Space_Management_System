import { useNavigate } from 'react-router-dom';

const AddEventForm = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your API logic here later
    alert("Event Created!"); 
    navigate('/dashboard'); // Go back to dashboard after submit
  };

  return (
    <div className="table-container">
      <h3>Create New Event</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
        
        <label>
          Event Name:
          <input type="text" required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </label>

        <label>
          Event Description
          <textarea required style={{ width: '100%', paddingTop:'8px', marginTop: '5px', alignItems:"left"}} >
          </textarea>
        </label>

        <label>
          Date:
          <input type="date" required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </label>

        <label>
          Location:
          <input type="text" required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </label>

        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn">Submit</button>
          <button 
            type="button" 
            onClick={() => navigate(-1)} // Go back one step
            style={{ marginLeft: '10px', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEventForm;