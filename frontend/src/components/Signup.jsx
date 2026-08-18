import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const backendRole = form.role.toLowerCase() === "student" ? "Student" : "Teacher";

      const res = await fetch("http://127.0.0.1:5000/api/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: backendRole })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === "success") {
        navigate("/login");
      } else {
        setError(data.msg || data.error || "Signup failed");
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to communicate with the server.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F8FAFC", padding: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: "#fff", width: "100%", maxWidth: 450, borderRadius: 20, padding: 40, boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #E2E8F0" }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h2 style={{ margin: 0, color: "#1E293B", fontSize: 24, fontWeight: 700 }}>Create Account</h2>
          <p style={{ margin: "8px 0 0 0", color: "#64748B", fontSize: 14 }}>Join ScriptEval to start evaluating efficiently.</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: "#FEF2F2", color: "#DC2626", padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 20, textAlign: "center", border: "1px solid #FECACA" }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Full Name</label>
              <input
                name="name" type="text" value={form.name} onChange={handleChange} required
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", transition: "0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#3B82F6"} onBlur={(e) => e.target.style.borderColor = "#CBD5E1"}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Account Type</label>
              <select
                name="role" value={form.role} onChange={handleChange}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", background: "white", cursor: "pointer" }}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Email Address</label>
            <input
              name="email" type="email" value={form.email} onChange={handleChange} required
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", transition: "0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "#3B82F6"} onBlur={(e) => e.target.style.borderColor = "#CBD5E1"}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Password</label>
            <input
              name="password" type="password" value={form.password} onChange={handleChange} required minLength={6}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", transition: "0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "#3B82F6"} onBlur={(e) => e.target.style.borderColor = "#CBD5E1"}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{ width: "100%", padding: 14, marginTop: 10, background: loading ? "#94A3B8" : "linear-gradient(135deg, #3B82F6, #6366F1)", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = 0.9; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", margin: "24px 0 0 0", fontSize: 14, color: "#64748B" }}>
          Already have an account? <Link to="/login" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}