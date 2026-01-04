import { motion } from "framer-motion";
import "../glass.css";
import bg from "../assets/features-bg.jpg";
import { useEffect, useState, useRef } from "react";

export default function Result() {
  const [score, setScore] = useState(null);
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  // ------------------------------
  // Load score instantly
  // ------------------------------
  useEffect(() => {
    fetch("http://127.0.0.1:5000/evaluate")
      .then(res => res.json())
      .then(res => {
        if (res.ready) setScore(res.score);
        else setError(res.message);
      })
      .catch(() => setError("Backend not reachable"));
  }, []);

  // ------------------------------
  // SAFE typing animation (FINAL)
  // ------------------------------
  const typeText = (rawText) => {
    if (typeof rawText !== "string") return;

    const text = rawText.trim(); // freeze + normalize
    setTyped("");

    let i = 0;
    const interval = setInterval(() => {
      if (i >= text.length) {
        clearInterval(interval);
        return;
      }

      setTyped(prev => prev + text.charAt(i));
      i++;
    }, 20);
  };

  // ------------------------------
  // Fetch feedback with polling
  // ------------------------------
  const getFeedback = () => {
    setLoading(true);

    pollingRef.current = setInterval(async () => {
      const res = await fetch("http://127.0.0.1:5000/get-feedback");
      const data = await res.json();

      if (data.ready && typeof data.feedback === "string") {
        clearInterval(pollingRef.current);
        setLoading(false);
        typeText(data.feedback);
      }
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <motion.div className="glass" style={{ width: 480, padding: 50 }}>
        {error && <p>{error}</p>}

        {score !== null && (
          <>
            <h2>Final Score</h2>
            <motion.h1>{score} / 100</motion.h1>

            {!typed && (
              <motion.button
                className="glass-btn"
                onClick={getFeedback}
                whileHover={{ scale: 1.05 }}
                style={{ marginTop: 30 }}
                disabled={loading}
              >
                {loading ? "Analyzing Answer..." : "Show Feedback"}
              </motion.button>
            )}

            {typed && (
              <>
                <h3 style={{ marginTop: 30 }}>Feedback</h3>
                <p style={{ lineHeight: 1.6 }}>
                  {typed}
                  <span style={{ opacity: 0.4 }}>▌</span>
                </p>
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
