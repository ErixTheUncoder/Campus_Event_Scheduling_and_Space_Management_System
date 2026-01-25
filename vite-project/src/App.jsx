import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Layout from "./component/Layout";
import DashboardContent from "./component/DashboardContent";
import PlaceholderContent from "./component/PlaceholderContent";
import LoginForm from "./component/login";
import Events from "./component/Events";
import AddEventForm from "./component/AddEventForm";
import Approval from "./component/Approval";
import Venue from "./component/Venue";
import UserManagement from "./component/UserManagement";
import AuditLog from "./component/AuditLog";
import EventCalendar from "./component/EventCalendar";
import EditEvent from "./component/EditEvent";
import WithdrawEvent from "./component/WithdrawEvent";
import Bookings from "./component/Bookings";
import BookingCalendar from "./component/BookingCalendar";
import AddBookingForm from "./component/AddBookingForm";
import EditBooking from "./component/EditBooking";
import WithdrawBooking from "./component/WithdrawBooking";
import ScheduleCalendar from "./component/ScheduleCalendar";
import VenueRequestCreate from "./component/VenueRequestCreate";
import VenueRequestEdit from "./component/VenueRequestEdit";
import VenueRequestWithdraw from "./component/VenueRequestWithdraw";
import VenueRequestManage from "./component/VenueRequestManage";
import VenueAvailability from "./component/VenueAvailability";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.user_role)) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/dashboard" replace /> :
          <div className="loginBackground">
            <LoginForm onLoginSuccess={handleLogin} />
          </div>
        }
      />

      <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardContent />} />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ScheduleCalendar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Event Organizer"]}>
              <Events user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/calendar"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Event Organizer"]}>
              <EventCalendar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/add"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Event Organizer"]}>
              <AddEventForm />
            </ProtectedRoute>
          }
        />

        {/* edit and withdraw EO only */}
        <Route
          path="/events/edit"
          element={
            <ProtectedRoute allowedRoles={["Event Organizer","Admin"]}>
              <EditEvent user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/withdraw"
          element={
            <ProtectedRoute allowedRoles={["Event Organizer","Admin"]}>
              <WithdrawEvent user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute allowedRoles={["Student", "Admin"]}>
              <Bookings user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/calendar"
          element={
            <ProtectedRoute allowedRoles={["Student", "Admin"]}>
              <BookingCalendar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/add"
          element={
            <ProtectedRoute allowedRoles={["Student","Admin"]}>
              <AddBookingForm user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/edit"
          element={
            <ProtectedRoute allowedRoles={["Student","Admin"]}>
              <EditBooking user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/withdraw"
          element={
            <ProtectedRoute allowedRoles={["Student","Admin"]}>
              <WithdrawBooking user={user} />
            </ProtectedRoute>
          }
        />

        <Route path="/venues" element={<Venue />} />

        {/* Venue Requests Routes */}
        <Route
          path="/venue-requests"
          element={
            <ProtectedRoute allowedRoles={["Event Organizer", "Admin"]}>
              <VenueRequestManage user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/venue-requests/create"
          element={
            <ProtectedRoute allowedRoles={["Event Organizer","Admin"]}>
              <VenueRequestCreate user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/venue-requests/edit"
          element={
            <ProtectedRoute allowedRoles={["Event Organizer","Admin"]}>
              <VenueRequestEdit user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/venue-requests/withdraw"
          element={
            <ProtectedRoute allowedRoles={["Event Organizer","Admin"]}>
              <VenueRequestWithdraw user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/venue-availability"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <VenueAvailability />
            </ProtectedRoute>
          }
        />

        <Route
          path="/approvals"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Approval />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-log"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AuditLog />
            </ProtectedRoute>
          }
        />

        <Route path="/settings" element={<PlaceholderContent title="Settings" />} />
      </Route>
    </Routes>
  );
}

export default App;
