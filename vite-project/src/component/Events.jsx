import BookingEventList from "./BookingEvents";

function Events(){
  
  return(
    <>
       <div className="tableHeader">
        <h2>Current Events</h2>
        <button className="add-Button" >+ Add Event</button>
      </div>
    <div className="table-container">
      <BookingEventList/>
    </div>
    </>
  )
}

export default Events;