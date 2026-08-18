import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchAuth = () => {
      fetch("http://127.0.0.1:5000/api/me", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.logged_in) setUser(data.user);
          else setUser(null);
        })
        .catch(console.error);
    };

    fetchAuth();
    window.addEventListener("auth_change", fetchAuth);
    return () => window.removeEventListener("auth_change", fetchAuth);
  }, []);
  
  const fetchNotifications = () => {
    fetch("http://127.0.0.1:5000/api/notifications", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") setNotifications(data.notifications);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Optional: Poll every 30 seconds for live updates
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdowns when clicking outside gracefully 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://127.0.0.1:5000/api/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      setDropdownOpen(false);
      window.dispatchEvent(new Event("auth_change"));
      navigate("/login");
    }
  };
  
  const markAsRead = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/notifications/read", {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setNotifications(notifications.map(n => ({...n, is_read: true})));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const goToDashboard = () => {
    setDropdownOpen(false);
    if (user?.role === "Teacher") navigate("/teacher-dashboard");
    else navigate("/student-dashboard");
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          ScriptEval
        </Link>
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "25px" }}>
          
          <Link to="/" className="nav-link">Home</Link>
          
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              
              {/* Notifications Component */}
              <div style={{ position: "relative" }} ref={notifRef}>
                <button 
                  onClick={() => setShowNotifs(!showNotifs)}
                  style={{ background: showNotifs ? "var(--bg-color)" : "none", border: "none", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-main)", position: "relative", transition: "0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-color)"}
                  onMouseLeave={(e) => { if (!showNotifs) e.currentTarget.style.background = "none"; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  {unreadCount > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: "absolute", top: 4, right: 6, width: 10, height: 10, borderRadius: "50%", background: "var(--danger)", border: "2px solid white" }} />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifs && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{ position: "absolute", top: "120%", right: -60, width: "320px", background: "white", borderRadius: "14px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", border: "1px solid var(--border-color)", overflow: "hidden", zIndex: 100 }}
                    >
                      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", background: "#FAFAFA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ margin: 0, fontWeight: 700, color: "var(--text-main)", fontSize: 14 }}>Notifications</p>
                        {unreadCount > 0 && (
                          <button onClick={markAsRead} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>Mark all as read</button>
                        )}
                      </div>
                      <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No recent notifications.</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 12, alignItems: "flex-start", background: n.is_read ? "white" : "rgba(14, 165, 233, 0.05)" }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.is_read ? "transparent" : "var(--primary)", marginTop: 6, flexShrink: 0 }}></div>
                              <div>
                                <p style={{ margin: "0 0 4px 0", fontSize: 13, color: "var(--text-main)", fontWeight: n.is_read ? 500 : 600, lineHeight: 1.4 }}>{n.message}</p>
                                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Dropdown */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button 
                  className="nav-link" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ 
                    background: dropdownOpen ? "var(--bg-color)" : "none", 
                    border: "none", outline: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", 
                    fontWeight: 600, padding: "6px 14px", borderRadius: "10px", color: "var(--text-main)", transition: "0.2s" 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-color)"}
                  onMouseLeave={(e) => { if (!dropdownOpen) e.currentTarget.style.background = "none"; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--primary-gradient)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {user.name}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{ position: "absolute", top: "120%", right: 0, width: "220px", background: "white", borderRadius: "14px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", border: "1px solid var(--border-color)", overflow: "hidden", zIndex: 100 }}
                    >
                      <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-color)", background: "#FAFAFA" }}>
                        <p style={{ margin: 0, fontWeight: 700, color: "var(--text-main)", fontSize: 15 }}>{user.name}</p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>{user.role} Account</p>
                      </div>
                      
                      <button onClick={goToDashboard} style={{ width: "100%", textAlign: "left", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)", transition: "0.2s", fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-color)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Dashboard
                      </button>

                      {user.role === "Teacher" && (
                        <button onClick={() => { setDropdownOpen(false); navigate("/teacher-history"); }} style={{ width: "100%", textAlign: "left", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)", transition: "0.2s", fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-color)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          Evaluated Papers
                        </button>
                      )}

                      <button onClick={handleLogout} style={{ width: "100%", textAlign: "left", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "12px", color: "var(--danger)", transition: "0.2s", fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.background = "#FEE2E2"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/signup" className="nav-link" style={{ background: "var(--primary-gradient)", color: "white", padding: "10px 20px", borderRadius: "10px", fontWeight: 600 }}>Create Account</Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}
