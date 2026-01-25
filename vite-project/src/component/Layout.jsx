import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = ({ user, onLogout }) => {
  const location = useLocation();

  // Friendly titles for each route
  const routeTitles = {
    "/dashboard": "Dashboard",
    "/events": "Events",
    "/events/calendar": "Calendar View",
    "/events/add": "Create Event",
    "/events/edit": "Edit Event",
    "/events/withdraw": "Withdraw Event",
    "/venues": "Venues",
    "/approvals": "Approvals",
    "/users": "User Management",
    "/settings": "Settings",
    "/bookings": "Bookings",
    "/bookings/add": "Bookings",
    "/bookings/edit": "Bookings",
    "/bookings/withdraw": "Bookings",
    "/venue-requests": "Venue Request",
    "/venue-requests/create": "Venue Request",
    "/venue-requests/edit": "Venue Request",
    "/venue-requests/withdraw": "Venue Request",
    "/venue-availability": "Venue Request",
  };

  const getTitle = () => {
    const path = location.pathname;

    // 1) exact match first
    if (routeTitles[path]) return routeTitles[path];

    // 2) fallback: collapse subpages under a section
    if (path.startsWith("/events")) return "Events";
    if (path.startsWith("/venues")) return "Venues";
    if (path.startsWith("/approvals")) return "Approvals";
    if (path.startsWith("/users")) return "User Management";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/dashboard") || path === "/") return "Dashboard";
    if (path.startsWith("/bookings")) return "Bookings";
    if (path.startsWith("/venue-requests")) return "Venue Request";
    if (path.startsWith("/venue-availability")) return "Venue Request";

    // 3) final fallback
    return "Campus Scheduler";
  };

  return (
    <div className="app-container">
      <Sidebar user={user} />
      <div className="main-content">
        <Header title={getTitle()} user={user} onLogout={onLogout} />
        <div className="dashboard-view">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
