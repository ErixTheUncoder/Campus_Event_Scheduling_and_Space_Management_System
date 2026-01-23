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

// small helper for time formatting
const fmtTime = (d) => format(d, "HH:mm");

export default function EventCalendar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // controlled calendar state (keeps toolbar working)
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());

  // modal state
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

        const res = await fetch(`/api/calendar/calendar?user_id=${user.user_id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load calendar");

        setItems(data.calendar || []);
      } catch (e) {
        setError(e.message || "Error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Convert backend items -> react-big-calendar event objects
  const events = useMemo(() => {
    return (items || [])
      .map((it) => {
        if (!it.date || !it.start_time || !it.end_time) return null;

        const start = new Date(`${it.date}T${it.start_time}:00`);
        const end = new Date(`${it.date}T${it.end_time}:00`);

        return {
          id: it.id,
          title: it.title || "(No Title)",
          start,
          end,
          resource: it, // keep original payload
        };
      })
      .filter(Boolean);
  }, [items]);

  // Custom event rendering: Title + Time below it
  const EventCell = ({ event }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
      <h2 style={{ marginTop: 0 }}>Calendar View</h2>

      {loading && <div>Loading...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div style={{ height: "75vh", background: "#fff", borderRadius: 12, padding: 12 }}>
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
            components={{
              event: EventCell, // show time under title
            }}
            onSelectEvent={(e) => {
              // open modal instead of alert
              setSelected(e);
            }}
          />
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div
          className="cal-modal-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h2 style={{ margin: 0 }}>{selected.title}</h2>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <div>
                <b>Type:</b> {selected.resource?.type || "-"}
              </div>
              <div>
                <b>Date:</b> {selected.resource?.date || format(selected.start, "yyyy-MM-dd")}
              </div>
              <div>
                <b>Time:</b> {fmtTime(selected.start)} - {fmtTime(selected.end)}
              </div>
              <div>
                <b>Venue:</b> {(selected.resource?.venues || []).join(", ") || "-"}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
