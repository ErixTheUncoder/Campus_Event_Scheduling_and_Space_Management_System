import { useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const fmtTime = (d) => format(d, "HH:mm");

export default function ScheduleCalendar() {
  const [eventItems, setEventItems] = useState([]);
  const [bookingItems, setBookingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user?.user_id) {
          setError("Not logged in");
          return;
        }

        const roleParam = user.user_role === "Admin" ? "ADMIN" : "STUDENT";

        const [eventsRes, bookingsRes] = await Promise.all([
          fetch(`/api/calendar/calendar?user_id=${user.user_id}`),
          fetch(`/api/booking-requests/calendar?viewer_id=${user.user_id}&role=${roleParam}`),
        ]);

        const eventsData = await eventsRes.json().catch(() => ({}));
        const bookingsData = await bookingsRes.json().catch(() => ({}));

        if (!eventsRes.ok) throw new Error(eventsData.error || "Failed to load events calendar");
        if (!bookingsRes.ok) throw new Error(bookingsData.error || "Failed to load bookings calendar");

        setEventItems(eventsData.calendar || []);
        setBookingItems(bookingsData.calendar || []);
      } catch (e) {
        setError(e.message || "Error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const mergedItems = useMemo(() => {
    const e = (eventItems || []).map((x) => ({ ...x, type: x.type || "EVENT" }));
    const b = (bookingItems || []).map((x) => ({ ...x, type: x.type || "BOOKING" }));

    // ✅ Dedupe by (type + id)
    const map = new Map();
    [...e, ...b].forEach((it) => {
      const k = `${it.type}:${it.id}`;
      if (!map.has(k)) map.set(k, it);
    });
    return Array.from(map.values());
  }, [eventItems, bookingItems]);

  const events = useMemo(() => {
    return mergedItems
      .map((it) => {
        if (!it.date || !it.start_time || !it.end_time) return null;

        const start = new Date(`${it.date}T${it.start_time}:00`);
        const end = new Date(`${it.date}T${it.end_time}:00`);

        return {
          id: `${it.type}-${it.id}`, // ✅ unique
          title: it.title || (it.type === "BOOKING" ? "Booking" : "(No Title)"),
          start,
          end,
          resource: it,
        };
      })
      .filter(Boolean);
  }, [mergedItems]);

  const eventPropGetter = (event) => {
    const t = event?.resource?.type;
    if (t === "EVENT") {
      return {
        style: {
          backgroundColor: "#2563eb",
          borderColor: "#1d4ed8",
          color: "#fff",
          borderRadius: 8,
          paddingLeft: 6,
          paddingRight: 6,
        },
      };
    }
    return {
      style: {
        backgroundColor: "#16a34a",
        borderColor: "#15803d",
        color: "#fff",
        borderRadius: 8,
        paddingLeft: 6,
        paddingRight: 6,
      },
    };
  };

  const EventCell = ({ event }) => {
    const t = event?.resource?.type;
    return (
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {t === "EVENT" ? "Event: " : "Booking: "}
          {event.title}
        </div>
        <div style={{ fontSize: 11, opacity: 0.95 }}>
          {fmtTime(event.start)} - {fmtTime(event.end)}
        </div>
      </div>
    );
  };

  const closeModal = () => setSelected(null);

  return (
    <div className="content">
      <h2 style={{ marginTop: 0 }}>Schedule Calendar</h2>

      {loading && <div>Loading...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 12 }}>
          {/* Calendar */}
          <div style={{ height: "72vh" }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={["month", "week", "day", "agenda"]}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              popup
              components={{ event: EventCell }}
              onSelectEvent={(e) => setSelected(e)}
              eventPropGetter={eventPropGetter}
            />
          </div>

          {/* ✅ Legend BELOW calendar (no blocking) */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 12,
                minWidth: 160,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>Legend</div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: "#2563eb",
                    border: "1px solid #1d4ed8",
                    display: "inline-block",
                  }}
                />
                <span>Events</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: "#16a34a",
                    border: "1px solid #15803d",
                    display: "inline-block",
                  }}
                />
                <span>Bookings</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="cal-modal-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h2 style={{ margin: 0 }}>{selected.title}</h2>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <div><b>Type:</b> {selected.resource?.type || "-"}</div>
              <div><b>Date:</b> {selected.resource?.date || format(selected.start, "yyyy-MM-dd")}</div>
              <div><b>Time:</b> {fmtTime(selected.start)} - {fmtTime(selected.end)}</div>
              <div><b>Venue:</b> {(selected.resource?.venues || []).join(", ") || "-"}</div>
              <div><b>Status:</b> {selected.resource?.status || "-"}</div>

              {selected.resource?.type === "EVENT" && (
                <div style={{ marginTop: 6 }}>
                  <b>Purpose:</b>
                  <div
                    style={{
                      marginTop: 6,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selected.resource?.purpose || "-"}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
