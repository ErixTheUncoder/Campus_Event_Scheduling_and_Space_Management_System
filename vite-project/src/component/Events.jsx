import { useNavigate } from "react-router-dom";
import BookingEventList from "./BookingEvents";

function Events({ user }) {
  const navigate = useNavigate();

  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const isEO = currentUser?.user_role === "Event Organizer";

  return (
    <>
      <div className="tableHeader">
        <h2>Current Events</h2>

        <div className="event-actions">
          <button className="btn add-Button" onClick={() => navigate("add")}>
            + Create Event
          </button>

          {isEO && (
            <>
              <button className="btn btn-outline" onClick={() => navigate("edit")}>
                ✏️ Edit Event
              </button>

              <button className="btn btn-danger-outline" onClick={() => navigate("withdraw")}>
                🚫 Withdraw Event
              </button>
            </>
          )}
        </div>
      </div>

      <div className="table-container">
        <BookingEventList user={currentUser} />
      </div>
    </>
  );
}

export default Events;
