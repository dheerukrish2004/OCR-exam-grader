import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.user) {
        window.dispatchEvent(new Event("auth_change"));
        const role = data.user.role?.toLowerCase();
        if (role === "teacher") {
          navigate("/teacher-dashboard");
        } else {
          navigate("/student-dashboard");
        }
      } else {
        setError(data.error || data.message || "Invalid credentials");
      }
    } catch (err) {
      setLoading(false);
      setError("Unable to communicate with the server.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F8FAFC", padding: 20 }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: "#fff", width: "100%", maxWidth: 400, borderRadius: 20, padding: 40, boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #E2E8F0" }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: "bold", margin: "0 auto 16px" }}>
            SE
          </div>
          <h2 style={{ margin: 0, color: "#1E293B", fontSize: 24, fontWeight: 700 }}>Welcome Back</h2>
          <p style={{ margin: "8px 0 0 0", color: "#64748B", fontSize: 14 }}>Log in to your ScriptEval account</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: "#FEF2F2", color: "#DC2626", padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 20, textAlign: "center", border: "1px solid #FECACA" }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
              name="password" type="password" value={form.password} onChange={handleChange} required
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
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", margin: "24px 0 0 0", fontSize: 14, color: "#64748B" }}>
          Don't have an account? <Link to="/signup" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}