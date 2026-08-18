import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CircularProgress from "./CircularProgress";

export default function TeacherHistory() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetch("http://127.0.0.1:5000/api/teacher-results", { credentials: "include" })
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
                <h2>Loading Evaluated Papers...</h2>
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

    return (
        <div className="layout-wrapper">
            <div className="main-content" style={{ maxWidth: 900 }}>
                <h1 style={{ fontSize: "2.5rem", marginBottom: 10 }}>Evaluated Papers</h1>
                <p style={{ color: "var(--text-muted)", marginBottom: 40 }}>Review all student evaluations you have processed historically.</p>

                {results.length === 0 ? (
                    <div className="feature-card" style={{ textAlign: "center", padding: 50 }}>
                        <h3 style={{ color: "var(--text-muted)" }}>No evaluations found.</h3>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {results.map((res, index) => {
                            const isExpanded = expandedId === res.id;
                            const dateStr = new Date(res.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

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
                                                <h3 style={{ margin: 0, fontSize: 18 }}>{res.exam_name || "Evaluation Record"}</h3>
                                            </div>
                                            <p style={{ margin: "5px 0", color: "var(--text-muted)", fontSize: 14 }}>Student: <strong style={{ color: "var(--text-main)" }}>{res.student_name}</strong> ({res.student_email})</p>
                                            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                {dateStr}
                                            </p>
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
                                                                    <h5 style={{ margin: "0 0 8px 0", fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 0.5 }}>Student Answer</h5>
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
        </div>
    );
}
