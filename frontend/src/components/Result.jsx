import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CircularProgress from "./CircularProgress";

export default function Result() {
  const { state } = useLocation();
  const studentEmail = state?.studentEmail || "";

  const [scores, setScores] = useState({});
  const [finalScore, setFinalScore] = useState(null);
  const [totalMarks, setTotalMarks] = useState(null);
  const [questionMarks, setQuestionMarks] = useState({});
  const [feedback, setFeedback] = useState({});

  const [studentAnswers, setStudentAnswers] = useState({});
  const [teacherAnswers, setTeacherAnswers] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQ, setExpandedQ] = useState(null);

  const examNameInit = state?.examName || "";
  const [examName, setExamName] = useState(examNameInit);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);

  useEffect(() => {
    console.log("Calling evaluate...");
    fetch("http://127.0.0.1:5000/evaluate", { credentials: "include" })
      .then(res => res.json())
      .then(res => {
        if (res.ready) {
          setScores(res.scores || {});
          setFinalScore(res.final_score);
          setTotalMarks(res.total_marks);
          setQuestionMarks(res.question_marks || {});
          setFeedback(res.feedback || {});

          setStudentAnswers(res.student_answers || {});
          setTeacherAnswers(res.teacher_answers || {});
        } else {
          setError(res.message || "Failed to retrieve evaluation from ML pipeline.");
        }
      })
      .catch(() => setError("Backend offline or request timed out."))
      .finally(() => setLoading(false));

    // Prefetch active Subject DB mappings securely
    fetch("http://127.0.0.1:5000/api/subjects", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success" && data.subjects.length > 0) {
          setSubjectsList(data.subjects);
          setSelectedSubject(data.subjects[0]);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveResult = async () => {
    setSaving(true);
    setSaveError(null);
    const finalSubject = isAddingNewSubject ? customSubject.trim() : selectedSubject;

    try {
      const res = await fetch("http://127.0.0.1:5000/api/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          student_email: studentEmail,
          exam_name: examName.trim() || "Untitled Exam",
          subject: finalSubject || "General"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setIsModalOpen(false), 2000); // Auto close modal bounds
      }
      else setSaveError(data.error || "Execution failed securely capturing DB vectors.");
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score, max) => {
    if (max === 0 || !max) return "average";
    const pct = score / max;
    if (pct >= 0.8) return "good";
    if (pct >= 0.5) return "average";
    return "poor";
  };

  const getTextColorClass = (score, max) => {
    const theme = getScoreColor(score, max);
    if (theme === "good") return "text-success";
    if (theme === "average") return "text-warning";
    return "text-danger";
  };

  return (
    <div className="layout-wrapper">
      <div className="main-content">

        {loading && (
          <div style={{ textAlign: "center", marginTop: 100 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spinner" style={{ marginBottom: 20 }}>
              <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
            <h2>Grading in progress...</h2>
            <p style={{ color: "var(--text-muted)", marginTop: 10 }}>Our AI is evaluating the student answers. This may take up to 15 seconds.</p>
          </div>
        )}

        {error && (
          <div className="feedback-card poor" style={{ textAlign: "center", maxWidth: 600, margin: "60px auto" }}>
            <h3 className="text-danger">Evaluation Error</h3>
            <p>{error}</p>
            <div style={{ marginTop: 25 }}>
              <Link to="/upload" className="btn-primary" style={{ display: "inline-flex", width: "auto" }}>Try Again</Link>
            </div>
          </div>
        )}

        {!loading && !error && finalScore !== null && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="result-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 30 }}>
              <div>
                <p style={{ color: "var(--text-muted)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 15px 0" }}>Overall Assessment Score</p>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <CircularProgress score={finalScore} total={totalMarks} size={110} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className={getTextColorClass(finalScore, totalMarks)} style={{ fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{finalScore} <span style={{ fontSize: 24, color: "var(--text-muted)", fontWeight: 600 }}>/ {totalMarks} pts</span></span>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-color)", padding: "18px 25px", borderRadius: 12, border: "2px solid var(--border-color)", minWidth: 250 }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13, textTransform: "uppercase", fontWeight: 700, margin: "0 0 8px 0" }}>Evaluated Target Node</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{studentEmail}</p>
                {examNameInit && <p style={{ margin: "6px 0 0 0", color: "var(--primary)", fontWeight: 600, fontSize: 14 }}>{examNameInit}</p>}
              </div>
            </div>

            <div style={{ maxWidth: 840, margin: "0 auto" }}>
              <h2 style={{ marginBottom: 25, fontSize: 24 }}>Detailed Breakdown</h2>

              {Object.keys(scores).map((q, idx) => {
                const maxM = questionMarks[q] || 0;
                const score = scores[q];
                const theme = getScoreColor(score, maxM);
                const isExpanded = expandedQ === q;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    key={q}
                    className={`feedback-card ${theme}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                      <h3 style={{ margin: 0, fontSize: 18 }}>Question {q}</h3>
                      <div style={{ fontWeight: 700, fontSize: 18 }} className={getTextColorClass(score, maxM)}>
                        {score} / {maxM} points
                      </div>
                    </div>

                    {feedback[q] ? (
                      <p style={{ margin: 0, lineHeight: 1.6, color: "var(--text-main)" }}>
                        {feedback[q]}
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: "var(--text-muted)", fontStyle: "italic" }}>No feedback generated.</p>
                    )}

                    <div style={{ marginTop: 15 }}>
                      <button
                        onClick={() => setExpandedQ(isExpanded ? null : q)}
                        style={{
                          background: "none", border: "none", color: "var(--primary)",
                          fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0
                        }}
                      >
                        {isExpanded ? "Hide Comparison" : "View Comparison"}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="comparison-grid" style={{
                            marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border-color)",
                          }}>
                            <div className="comparison-column">
                              <h4 style={{ margin: "0 0 10px 0", color: "var(--text-main)", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>Student Answer</h4>
                              <div style={{ background: "var(--bg-color)", padding: 15, borderRadius: 8, fontSize: 14, color: "var(--text-muted)", whiteSpace: "pre-wrap", border: "1px solid var(--border-color)", lineHeight: 1.6 }}>
                                {studentAnswers[q] || "No answer provided"}
                              </div>
                            </div>
                            <div className="comparison-column">
                              <h4 style={{ margin: "0 0 10px 0", color: "var(--text-main)", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>Expected Answer</h4>
                              <div style={{ background: "var(--bg-color)", padding: 15, borderRadius: 8, fontSize: 14, color: "var(--text-muted)", whiteSpace: "pre-wrap", border: "1px solid var(--border-color)", borderLeft: `4px solid var(--success)`, lineHeight: 1.6 }}>
                                {teacherAnswers[q] || "No expected answer found"}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}

              {/* Secure Result Target Array Saves */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 50, marginBottom: 50, gap: 20, flexWrap: "wrap" }}>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {!saveSuccess ? (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      disabled={!studentEmail}
                      className="btn-primary"
                      style={{ background: !studentEmail ? "#ccc" : "var(--primary-gradient)", cursor: !studentEmail ? "not-allowed" : "pointer", padding: "14px 40px" }}
                    >
                      Process & Save Result
                    </button>
                  ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ padding: "16px 40px", borderRadius: 999, background: "var(--success)", color: "white", fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      Result Saved & Sent Successfully!
                    </motion.div>
                  )}
                  {!studentEmail && !saveSuccess && <span style={{ color: "var(--warning)", fontSize: 13, marginTop: 10 }}>Cannot save: No registered student email appended dynamically.</span>}
                </div>

                <Link to="/upload" className="btn-secondary" style={{ textDecoration: "none" }}>
                  Evaluate Another Student
                </Link>

              </div>

              {/* Database Evaluation Save Modal */}
              <AnimatePresence>
                {isModalOpen && !saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
                  >
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 500, padding: 30, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 22 }}>Finalize Archiving details</h2>
                        <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                          <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Exam Name</label>
                          <input type="text" value={examName} onChange={e => setExamName(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "2px solid var(--border-color)", fontSize: 15 }} />
                        </div>

                        <div>
                          <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Select Subject Limit</label>
                          <select
                            value={isAddingNewSubject ? "ADD_NEW" : selectedSubject}
                            onChange={e => {
                              if (e.target.value === "ADD_NEW") setIsAddingNewSubject(true);
                              else { setIsAddingNewSubject(false); setSelectedSubject(e.target.value); }
                            }}
                            style={{ width: "100%", padding: 12, borderRadius: 8, border: "2px solid var(--border-color)", fontSize: 15, marginBottom: isAddingNewSubject ? 10 : 0, background: "white" }}
                          >
                            <option value="" disabled>Choose a subject...</option>
                            {subjectsList.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                            <option value="ADD_NEW" style={{ fontWeight: 700, color: "var(--primary)" }}>+ Add New Subject</option>
                          </select>

                          {isAddingNewSubject && (
                            <input
                              type="text"
                              placeholder="e.g Physics 101"
                              value={customSubject}
                              onChange={e => setCustomSubject(e.target.value)}
                              style={{ width: "100%", padding: 12, borderRadius: 8, border: "2px dashed var(--primary)", fontSize: 15, background: "var(--bg-color)" }}
                            />
                          )}
                        </div>

                        {saveError && <div style={{ background: "#FEE2E2", color: "var(--danger)", padding: 12, borderRadius: 8, fontSize: 14 }}>{saveError}</div>}

                        <div style={{ display: "flex", gap: 15, marginTop: 10 }}>
                          <button className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, margin: 0, padding: 12 }}>Cancel</button>
                          <button className="btn-primary" onClick={handleSaveResult} disabled={saving} style={{ flex: 1, margin: 0, padding: 12, background: saving ? "#ccc" : "var(--primary-gradient)" }}>
                            {saving ? "Deploying..." : "Confirm & Save"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}