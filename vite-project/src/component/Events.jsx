import { useNavigate } from "react-router-dom";
import AddEventForm from "./AddEventForm";
import BookingEventList from "./BookingEvents";

function Events(){
  const navigate = useNavigate()
  
  return(
    <>
       <div className="tableHeader">
        <h2>Current Events</h2>
        <button className="add-Button" onClick={()=>navigate("add")}>+ Add Event</button>
      </div>
    <div className="table-container">
      <BookingEventList/>
    </div>
    </>
  )
}

export default Events;