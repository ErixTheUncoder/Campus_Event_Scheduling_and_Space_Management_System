import { NavLink } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";

const Sidebar = ({ user }) => {
  // Define all menu items with role restrictions
  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', roles: ['Admin', 'Event Organizer', 'Student'] },
    { name: 'Events', path: '/events', roles: ['Admin', 'Event Organizer'] },
    { name: 'Venues', path: '/venues', roles: ['Admin', 'Event Organizer', 'Student'] },
    { name: 'Approvals', path: '/approvals', roles: ['Admin'] },
    { name: 'User Management', path: '/users', roles: ['Admin'] },
    { name: 'Audit Log', path: '/audit-log', roles: ['Admin'] },
    { name: 'Settings', path: '/settings', roles: ['Admin', 'Event Organizer', 'Student'] }
  ];
  const [open, setOpen] = useState(false); // drawer open/close
  const [openSection, setOpenSection] = useState({ events: false });

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

      {
        type: "group",
        key: "events",
        name: "Events",
        roles: ["Admin", "Event Organizer"],
        children: [
          { name: "All Events", path: "/events", roles: ["Admin", "Event Organizer"] },
          { name: "Calendar View", path: "/events/calendar", roles: ["Admin", "Event Organizer"] },
          { name: "Add Event", path: "/events/add", roles: ["Admin", "Event Organizer"] },
        ],
      },

      { type: "link", name: "Venues", path: "/venues", roles: ["Admin", "Event Organizer", "Student"] },
      { type: "link", name: "Approvals", path: "/approvals", roles: ["Admin"] },
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

  const closeDrawer = () => setOpen(false);

  // Push layout + disable click-outside close:
  // When sidebar opens, add a class to body so CSS can shift main content.
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
      {/* Hamburger (draggable, stays on left) */}
      <button
        className={`sidebar-hamburger ${open ? "is-open" : ""}`}
        type="button"
        onClick={(e) => {
          // If user dragged, don't toggle
          if (didDragRef.current) {
            e.preventDefault();
            e.stopPropagation();
            didDragRef.current = false; // reset for next interaction
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



      {/* Overlay (NO click-to-close; only X should close) */}
      <div className={`sidebar-overlay ${open ? "show" : ""}`} />

      {/* Drawer sidebar */}
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
                  // (optional) keep open after navigation; remove if you want auto-close when clicking links:
                  // onClick={closeDrawer}
                >
                  {item.name}
                </NavLink>
              );
            }

            const isOpen = !!openSection[item.key];

            return (
              <div key={item.key} className="sidebar-group">
                <button type="button" className="sidebar-group-btn" onClick={() => toggleSection(item.key)}>
                  <span>{item.name}</span>
                  <span className="chev">{isOpen ? "▾" : "▸"}</span>
                </button>

                {isOpen && (
                  <div className="sidebar-sub">
                    {item.children.map((c) => (
                      <NavLink
                        key={c.name}
                        to={c.path}
                        className={({ isActive }) => `sidebar-sub-link ${isActive ? "active" : ""}`}
                        // (optional) keep open after navigation; remove if you want auto-close:
                        // onClick={closeDrawer}
                      >
                        {c.name}
                      </NavLink>
                    ))}
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
