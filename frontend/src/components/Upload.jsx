import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CalendarWidget from "./CalendarWidget";

export default function Upload() {
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);

  // Authenticate Teacher Layer
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (!data.logged_in) navigate("/login");
        else if (data.user.role !== "Teacher") navigate("/student-dashboard");
        else setAuthLoading(false);
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const [studentFiles, setStudentFiles] = useState([]);
  const [keyFiles, setKeyFiles] = useState([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [examName, setExamName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleStudentDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || e.target.files);
    setStudentFiles(prev => [...prev, ...files]);
  }, []);

  const handleKeyDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || e.target.files);
    setKeyFiles(prev => [...prev, ...files]);
  }, []);

  const handleEvaluate = async () => {
    if (studentFiles.length === 0 || keyFiles.length === 0) {
      setError("Please upload at least one student document and the reference answer key.");
      return;
    }
    if (!studentEmail.trim()) {
      setError("Please attach a registered student email before generating evaluation structures.");
      return;
    }

    setUploading(true);
    setError(null);

    const studentData = new FormData();
    studentFiles.forEach(f => studentData.append("file", f));

    const keyData = new FormData();
    keyFiles.forEach(f => keyData.append("file", f));

    try {
      const res1 = await fetch("http://127.0.0.1:5000/upload-student", {
        method: "POST",
        body: studentData,
        credentials: "include"
      });
      if (!res1.ok) {
        const d = await res1.json();
        throw new Error(d.error || "Failed to process student documents.");
      }

      const res2 = await fetch("http://127.0.0.1:5000/upload-key", {
        method: "POST",
        body: keyData,
        credentials: "include"
      });
      if (!res2.ok) {
        const d = await res2.json();
        throw new Error(d.error || "Failed to process the answer key.");
      }

      // Propagate the tied studentEmail and examName directly using session arrays natively
      navigate("/result", { state: { studentEmail, examName } });
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="layout-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
        <h2>Verifying System Identity...</h2>
      </div>
    );
  }

  return (
    <div className="layout-wrapper" style={{ alignItems: "flex-start", padding: "40px 20px" }}>
      <div style={{ display: "flex", gap: "30px", width: "100%", maxWidth: 1250, margin: "0 auto", flexWrap: "wrap", alignItems: "flex-start", height: "100%" }}>

        <div className="main-content" style={{ flex: 1, minWidth: 600, margin: 0, height: "100%" }}>

          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <h1 style={{ fontSize: "2.5rem", marginBottom: 15 }}>Evaluation Dashboard</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Upload the Documents.</p>
          </div>

          {/* Student Email target Definition */}
          <div className="feature-card" style={{ padding: "20px 30px", marginBottom: 30, display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontWeight: 600, marginBottom: 8, display: "block", fontSize: "1.05rem", color: "var(--text-main)" }}>Target Student Email</label>
                <input
                  type="email"
                  placeholder="e.g student@university.edu"
                  required
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  style={{ width: "100%", padding: "12px 15px", borderRadius: 10, border: "2px solid var(--border-color)", fontSize: 16 }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontWeight: 600, marginBottom: 8, display: "block", fontSize: "1.05rem", color: "var(--text-main)" }}>Exam Name</label>
                <input
                  type="text"
                  placeholder="e.g Midterm 2026"
                  required
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  style={{ width: "100%", padding: "12px 15px", borderRadius: 10, border: "2px solid var(--border-color)", fontSize: 16 }}
                />
              </div>

            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>To link the results to the correct student.</p>
          </div>

          {error && (
            <div style={{ background: "#FEE2E2", color: "var(--danger)", padding: 15, borderRadius: 8, marginBottom: 30, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <div className="upload-grid">

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 style={{ marginBottom: 15 }}>1. Student Answers</h3>
              <div
                className={`dropzone ${studentFiles.length > 0 ? "active" : ""}`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleStudentDrop}
                onClick={() => document.getElementById('student-upload').click()}
              >
                <input
                  type="file"
                  id="student-upload"
                  multiple
                  accept="image/*,.pdf"
                  style={{ display: "none" }}
                  onChange={handleStudentDrop}
                />
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 15 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p style={{ margin: 0, fontWeight: 500 }}>Please select student answer sheet images or a PDF.</p>
              </div>

              {studentFiles.length > 0 && (
                <div className="file-list">
                  {studentFiles.map((f, i) => (
                    <div key={i} className="file-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path></svg>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 style={{ marginBottom: 15 }}>2. Teacher Key</h3>
              <div
                className={`dropzone ${keyFiles.length > 0 ? "active" : ""}`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleKeyDrop}
                onClick={() => document.getElementById('key-upload').click()}
              >
                <input
                  type="file"
                  id="key-upload"
                  multiple
                  accept=".txt,.pdf,image/*"
                  style={{ display: "none" }}
                  onChange={handleKeyDrop}
                />
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 15 }}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <p style={{ margin: 0, fontWeight: 500 }}>Upload Exam sheet answer key to be evaluated against student's answer</p>
              </div>

              {keyFiles.length > 0 && (
                <div className="file-list">
                  {keyFiles.map((f, i) => (
                    <div key={i} className="file-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>

          {uploading ? (
            <div className="feature-card" style={{ marginTop: 40, textAlign: "center", padding: "40px 20px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spinner" style={{ marginBottom: 20 }}>
                <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              <h3 style={{ margin: 0 }}>Evaluating answers...</h3>
              <p style={{ color: "var(--text-muted)", marginTop: 10 }}>Comparing with the answer key semantically.</p>
            </div>
          ) : (
            <div style={{ marginTop: 50, textAlign: "center" }}>
              <button type="button" className="btn-primary" onClick={handleEvaluate}>
                Evaluate Answer sheet
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          )}

        </div>

        <div style={{ width: "100%", maxWidth: 360, alignSelf: "stretch" }}>
          <CalendarWidget role="Teacher" />
        </div>

      </div>
    </div>
  );
}
