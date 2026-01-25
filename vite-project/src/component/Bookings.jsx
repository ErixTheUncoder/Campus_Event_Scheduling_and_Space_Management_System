import { useNavigate } from "react-router-dom";
import BookingRequestList from "./BookingRequestList";

function Bookings({ user }) {
  const navigate = useNavigate();
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const isStu = currentUser?.user_role === "Student";
  return (
    <>
      <div className="tableHeader">
        <h2>{isStu ? "My Bookings" : "Current Bookings"}</h2>

        <div className="event-actions">

            {isStu && (
            <>
                <button className="btn add-Button" onClick={() => navigate("/bookings/add")}>
                    + Create Booking
                </button>

                <button className="btn btn-outline" onClick={() => navigate("/bookings/edit")}>
                    ✏️ Edit Booking
                </button>

                <button className="btn btn-danger-outline" onClick={() => navigate("/bookings/withdraw")}>
                    🚫 Withdraw Booking
                </button>
            </>
            )}
        </div>
      </div>

      <div className="table-container">
        <BookingRequestList user={currentUser} />
      </div>
    </>
  );
}

export default Bookings;
