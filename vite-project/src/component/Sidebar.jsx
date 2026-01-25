import { NavLink, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";

const Sidebar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false); // drawer open/close
  const [openSection, setOpenSection] = useState({
    events: false,
    approvals: false,
    bookings: false,
    venues: false,
  });

  const BTN_SIZE = 44;
  const EDGE_GAP = 14;

  const [hamburgerPos, setHamburgerPos] = useState({ x: EDGE_GAP, y: EDGE_GAP });
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const startPointRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const DRAG_THRESHOLD = 6; // pixels

  const role = user?.user_role;

  const allMenu = useMemo(
    () => [
      { type: "link", name: "Dashboard", path: "/dashboard", roles: ["Admin", "Event Organizer", "Student"] },

      // Admin combined calendar (events + bookings) - single link (no submenu)
      { type: "link", name: "Schedule Calendar", path: "/calendar", roles: ["Admin"] },

      {
        type: "group",
        key: "events",
        name: "Events",
        roles: ["Admin", "Event Organizer"],
        children: [
          { name: "All Events", path: "/events", roles: ["Admin", "Event Organizer"] },
          { name: "Calendar View", path: "/events/calendar", roles: ["Admin", "Event Organizer"] },

          // EO only
          { name: "Create Event", path: "/events/add", roles: ["Event Organizer"] },
          { name: "Edit Event", path: "/events/edit", roles: ["Event Organizer"] },
          { name: "Withdraw Event", path: "/events/withdraw", roles: ["Event Organizer"] },
        ],
      },

      // Bookings: Student + Admin
      {
        type: "group",
        key: "bookings",
        name: "Bookings",
        roles: ["Student", "Admin"],
        children: [
          { name: "All Bookings", path: "/bookings", roles: ["Student", "Admin"] },
          { name: "Calendar View", path: "/bookings/calendar", roles: ["Student", "Admin"] },

          // Student only actions
          { name: "Create Booking", path: "/bookings/add", roles: ["Student"] },
          { name: "Edit Booking", path: "/bookings/edit", roles: ["Student"] },
          { name: "Withdraw Booking", path: "/bookings/withdraw", roles: ["Student"] },
        ],
      },

      // Venues section with submenu for EO and Admin
      {
        type: "group",
        key: "venues",
        name: "Venues",
        roles: ["Event Organizer", "Admin"],
        children: [
          { name: "All Venues", path: "/venues", roles: ["Event Organizer", "Admin"] },
          { name: "All Venue Requests", path: "/venue-requests", roles: ["Event Organizer", "Admin"] },
          { name: "Venue Availability", path: "/venue-availability", roles: ["Admin"] },

          // EO only actions
          { name: "Create Venue Request", path: "/venue-requests/create", roles: ["Event Organizer"] },
          { name: "Edit Venue Request", path: "/venue-requests/edit", roles: ["Event Organizer"] },
          { name: "Withdraw Venue Request", path: "/venue-requests/withdraw", roles: ["Event Organizer"] },
        ],
      },

      {
        type: "group",
        key: "approvals",
        name: "Approvals",
        roles: ["Admin"],
        children: [
          { name: "Booking Requests", path: "/approvals#booking", roles: ["Admin"] },
          { name: "Event Requests", path: "/approvals#event", roles: ["Admin"] },
          { name: "Venue Requests", path: "/approvals#venue", roles: ["Admin"] },
        ],
      },

      { type: "link", name: "User Management", path: "/users", roles: ["Admin"] },
      { type: "link", name: "Settings", path: "/settings", roles: ["Admin", "Event Organizer", "Student"] },
    ],
    []
  );

  const menu = useMemo(() => {
    return allMenu
      .filter((item) => item.roles?.includes(role))
      .map((item) => {
        if (item.type !== "group") return item;
        const children = (item.children || []).filter((c) => c.roles?.includes(role));
        return { ...item, children };
      });
  }, [allMenu, role]);

  const toggleSection = (key) => {
    setOpenSection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // helper: is user currently in a section (for highlighting group button)
  const isInSection = (key) => {
    if (key === "events") return location.pathname.startsWith("/events");
    if (key === "bookings") return location.pathname.startsWith("/bookings");
    if (key === "venues") return location.pathname.startsWith("/venues") || location.pathname.startsWith("/venue-");
    if (key === "approvals") return location.pathname === "/approvals";
    return false;
  };

  // Auto-open approvals submenu when on approvals page
  useEffect(() => {
    if (location.pathname === "/approvals") {
      setOpenSection((prev) => ({ ...prev, approvals: true }));
    }
  }, [location.pathname]);

  // Auto-open events submenu when in any /events page
  useEffect(() => {
    if (location.pathname.startsWith("/events")) {
      setOpenSection((prev) => ({ ...prev, events: true }));
    }
  }, [location.pathname]);

  // Auto-open bookings submenu when in any /bookings page
  useEffect(() => {
    if (location.pathname.startsWith("/bookings")) {
      setOpenSection((prev) => ({ ...prev, bookings: true }));
    }
  }, [location.pathname]);

  // Auto-open venues submenu when in any /venues or /venue- page
  useEffect(() => {
    if (location.pathname.startsWith("/venues") || location.pathname.startsWith("/venue-")) {
      setOpenSection((prev) => ({ ...prev, venues: true }));
    }
  }, [location.pathname]);

  // Push layout
  useEffect(() => {
    document.body.classList.toggle("sidebar-open", open);
    return () => document.body.classList.remove("sidebar-open");
  }, [open]);

  // Draggable hamburger (mouse)
  useEffect(() => {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const onMove = (e) => {
      if (!dragging) return;

      const dx = Math.abs(e.clientX - startPointRef.current.x);
      const dy = Math.abs(e.clientY - startPointRef.current.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        didDragRef.current = true;
      }

      const maxX = window.innerWidth - BTN_SIZE - EDGE_GAP;
      const maxY = window.innerHeight - BTN_SIZE - EDGE_GAP;

      const nextX = clamp(e.clientX - dragOffsetRef.current.x, EDGE_GAP, maxX);
      const nextY = clamp(e.clientY - dragOffsetRef.current.y, EDGE_GAP, maxY);

      setHamburgerPos({ x: nextX, y: nextY });
    };

    const onUp = () => {
      if (!dragging) return;
      setDragging(false);

      // SNAP to left or right
      setHamburgerPos((prev) => {
        const centerX = prev.x + BTN_SIZE / 2;
        const snapLeftX = EDGE_GAP;
        const snapRightX = window.innerWidth - BTN_SIZE - EDGE_GAP;

        return {
          x: centerX >= window.innerWidth / 2 ? snapRightX : snapLeftX,
          y: prev.y,
        };
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  return (
    <>
      <button
        className={`sidebar-hamburger ${open ? "is-open" : ""}`}
        type="button"
        onClick={(e) => {
          if (didDragRef.current) {
            e.preventDefault();
            e.stopPropagation();
            didDragRef.current = false;
            return;
          }
          setOpen((v) => !v);
        }}
        onMouseDown={(e) => {
          setDragging(true);

          startPointRef.current = { x: e.clientX, y: e.clientY };
          didDragRef.current = false;

          dragOffsetRef.current = {
            x: e.clientX - hamburgerPos.x,
            y: e.clientY - hamburgerPos.y,
          };
        }}
        style={{ left: hamburgerPos.x, top: hamburgerPos.y }}
        aria-label={open ? "Close sidebar" : "Open sidebar"}
        title="Drag me (snaps left/right)"
      >
        {open ? "✕" : "☰"}
      </button>

      <div className={`sidebar-overlay ${open ? "show" : ""}`} />

      <aside className={`sidebar drawer ${open ? "open" : ""}`}>
        <div className="sidebar-drawer-top">
          <div className="brand">Campus Scheduler</div>
        </div>

        <nav className="sidebar-nav">
          {menu.map((item) => {
            if (item.type === "link") {
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""} navbar`}
                >
                  {item.name}
                </NavLink>
              );
            }

            const isOpen = !!openSection[item.key];
            const groupActive = isInSection(item.key);

            return (
              <div key={item.key} className="sidebar-group">
                <button
                  type="button"
                  className={`sidebar-group-btn ${groupActive ? "active" : ""}`}
                  onClick={() => toggleSection(item.key)}
                >
                  <span>{item.name}</span>
                  <span className="chev">{isOpen ? "▾" : "▸"}</span>
                </button>

                {isOpen && (
                  <div className="sidebar-sub">
                    {item.key === "approvals"
                      ? item.children.map((c) => {
                          const hash = c.path.includes("#") ? `#${c.path.split("#")[1]}` : "";
                          const active = location.pathname === "/approvals" && location.hash === hash;

                          return (
                            <NavLink
                              key={c.name}
                              to={c.path}
                              className={() => `sidebar-sub-link ${active ? "active" : ""}`}
                              onClick={(e) => {
                                e.preventDefault();

                                // already on approvals: just scroll
                                if (location.pathname === "/approvals") {
                                  window.location.hash = hash;
                                  const el = document.getElementById(hash.replace("#", ""));
                                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                  return;
                                }

                                // go approvals then scroll
                                navigate("/approvals");
                                setTimeout(() => {
                                  window.location.hash = hash;
                                  const el = document.getElementById(hash.replace("#", ""));
                                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }, 0);
                              }}
                            >
                              {c.name}
                            </NavLink>
                          );
                        })
                      : item.children.map((c) => {
                          // exact-only highlighting for base list pages
                          const exactOnly = c.path === "/events" || c.path === "/bookings" || c.path === "/venue-requests";

                          return (
                            <NavLink
                              key={c.name}
                              to={c.path}
                              end={exactOnly}
                              className={({ isActive }) => `sidebar-sub-link ${isActive ? "active" : ""}`}
                            >
                              {c.name}
                            </NavLink>
                          );
                        })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
