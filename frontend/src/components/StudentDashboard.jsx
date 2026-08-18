import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CircularProgress from "./CircularProgress";
import CalendarWidget from "./CalendarWidget";

export default function StudentDashboard() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/student-results", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") setResults(data.results);
        else setError(data.error || "Failed to load results");
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="layout-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="layout-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
        <h3 className="text-danger">{error}</h3>
      </div>
    );
  }

  const subjects = [...new Set(results.map(r => r.subject).filter(Boolean))];
  
  const filteredResults = results.filter(res => {
    const matchesSearch = (res.exam_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject ? res.subject === filterSubject : true;
    return matchesSearch && matchesSubject;
  });

  // Prepare chart data (oldest to newest for trend line)
  const chartData = [...results].reverse().map(r => ({
    name: r.exam_name || "Exam",
    percentage: parseFloat(r.percentage) || 0,
    date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="layout-wrapper" style={{ alignItems: "flex-start", padding: "40px 20px" }}>
      <div style={{ display: "flex", gap: "30px", width: "100%", maxWidth: 1250, margin: "0 auto", flexWrap: "wrap", alignItems: "flex-start", height: "100%" }}>
        
        <div className="main-content" style={{ flex: 1, minWidth: 600, margin: 0, height: "100%" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: 10 }}>My Evaluations</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 30 }}>Review your historical examination grades and track your analytical performance securely.</p>

          {chartData.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="feature-card" style={{ padding: 25, marginBottom: 30 }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: 18, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Performance Trend
              </h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: "var(--text-muted)"}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 12, fill: "var(--text-muted)"}} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontSize: 13, fontWeight: 600 }}
                      itemStyle={{ color: "var(--primary)" }}
                    />
                    <Line type="monotone" dataKey="percentage" stroke="var(--primary)" strokeWidth={4} dot={{ r: 5, fill: "white", strokeWidth: 3, stroke: "var(--primary)" }} activeDot={{ r: 7 }} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          <div style={{ display: "flex", gap: 15, marginBottom: 30, flexWrap: "wrap" }}>
            <input 
              type="text" 
              placeholder="Search by exam name..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: "12px 18px", borderRadius: 12, border: "2px solid var(--border-color)", fontSize: 14, minWidth: 250 }}
            />
            <select 
              value={filterSubject} 
              onChange={e => setFilterSubject(e.target.value)}
              style={{ padding: "12px 18px", borderRadius: 12, border: "2px solid var(--border-color)", fontSize: 14, minWidth: 150, background: "white", cursor: "pointer" }}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {filteredResults.length === 0 ? (
            <div className="feature-card" style={{ textAlign: "center", padding: 50 }}>
              <h3 style={{ color: "var(--text-muted)" }}>{results.length === 0 ? "No evaluations found." : "No results match your search limits."}</h3>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {filteredResults.map((res, index) => {
                const isExpanded = expandedId === res.id;
                const dateStr = new Date(res.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

                return (
                  <motion.div 
                    key={res.id} 
                    className="feature-card" 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.1 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: isExpanded ? 20 : 0, borderBottom: isExpanded ? "1px solid var(--border-color)" : "none", flexWrap: "wrap", gap: 15 }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "var(--primary)", color: "white", letterSpacing: 0.5, textTransform: "uppercase" }}>{res.subject || "General"}</span>
                          <h3 style={{ margin: 0, fontSize: 18 }}>{res.exam_name || "Evaluation"}</h3>
                        </div>
                        <p style={{ margin: "5px 0", color: "var(--text-muted)", fontSize: 14 }}>Evaluated by <strong>Teacher {res.teacher_name}</strong></p>
                        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>{dateStr}</p>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                          <CircularProgress score={res.score} total={res.total_marks} size={60} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginTop: -5 }}>{res.score}/{res.total_marks} pts</span>
                        </div>
                        <button onClick={() => setExpandedId(isExpanded ? null : res.id)} className="btn-secondary" style={{ padding: "10px 20px" }}>
                          {isExpanded ? "Close" : "View Details"}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                          <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                            {res.details.map((q) => (
                              <div key={q.question_no} style={{ background: "var(--bg-color)", padding: 20, borderRadius: 12, border: "1px solid var(--border-color)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                                  <h4 style={{ margin: 0, fontSize: 16 }}>Question {q.question_no}</h4>
                                  <span style={{ fontWeight: 600 }}>{q.score} points</span>
                                </div>
                                <p style={{ margin: "0 0 15px 0", lineHeight: 1.6, color: "var(--text-main)" }}>{q.feedback}</p>
                                
                                <div className="comparison-grid">
                                  <div className="comparison-column">
                                    <h5 style={{ margin: "0 0 8px 0", fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 0.5 }}>Your Answer</h5>
                                    <div style={{ background: "white", padding: 12, borderRadius: 8, fontSize: 13, border: "1px solid var(--border-color)" }}>{q.student_answer}</div>
                                  </div>
                                  <div className="comparison-column">
                                    <h5 style={{ margin: "0 0 8px 0", fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 0.5 }}>Expected Answer</h5>
                                    <div style={{ background: "white", padding: 12, borderRadius: 8, fontSize: 13, border: "1px solid var(--border-color)", borderLeft: "4px solid var(--success)" }}>{q.teacher_answer}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        
        <div style={{ width: "100%", maxWidth: 360, alignSelf: "stretch" }}>
          <CalendarWidget role="Student" />
        </div>
        
      </div>
    </div>
  );
}
