import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CalendarWidget({ role }) {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  
  const fetchEvents = () => {
    fetch("http://127.0.0.1:5000/api/events", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") setEvents(data.events);
      })
      .catch(err => console.error("Fetch error:", err));
  };
  
  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `http://127.0.0.1:5000/api/events/${editingId}`
        : "http://127.0.0.1:5000/api/events";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description, date })
      });
      
      if (res.ok) {
        setTitle("");
        setDescription("");
        setDate("");
        setEditingId(null);
        fetchEvents();
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/events/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description || "");
    setDate(ev.date || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDate("");
  };

  return (
    <div className="feature-card" style={{ padding: 25 }}>
      <h3 style={{ margin: "0 0 20px 0", fontSize: 18, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        Upcoming Events
      </h3>
      
      {role === "Teacher" && (
        <form onSubmit={handleSaveEvent} style={{ marginBottom: 25, padding: 15, background: "var(--bg-color)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
          <h4 style={{ margin: "0 0 15px 0", fontSize: 14 }}>{editingId ? "Edit Event" : "Add New Event"}</h4>
          <input required type="text" placeholder="Event Title (e.g., Midterm Exam)" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 10, fontSize: 13 }} />
          <input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 10, fontSize: 13 }} />
          <textarea placeholder="Description (Optional)" value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 15, fontSize: 13, resize: "vertical", minHeight: 60 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: "10px", fontSize: 13, borderRadius: 8 }}>{editingId ? "Save Changes" : "Save Event"}</button>
            {editingId && <button type="button" onClick={cancelEdit} className="btn-secondary" style={{ padding: "10px", fontSize: 13, borderRadius: 8 }}>Cancel</button>}
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, padding: "20px 0" }}>No upcoming events.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: role === "Teacher" ? "350px" : "500px", overflowY: "auto", paddingRight: 5 }}>
          {events.map((ev, i) => (
            <motion.div key={ev.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ padding: 15, borderRadius: 12, border: "1px solid var(--border-color)", background: "white", position: "relative" }}>
              <h4 style={{ margin: "0 0 5px 0", fontSize: 15, color: "var(--text-main)" }}>{ev.title}</h4>
              <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>{new Date(ev.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              {ev.description && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{ev.description}</p>}
              
              {role === "Teacher" && (
                <div style={{ display: "flex", gap: 10, marginTop: 12, borderTop: "1px solid var(--border-color)", paddingTop: 10 }}>
                  <button onClick={() => startEdit(ev)} style={{ background: "none", border: "none", color: "var(--text-main)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>Edit</button>
                  <button onClick={() => handleDelete(ev.id)} style={{ background: "none", border: "none", color: "var(--danger)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>Delete</button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
