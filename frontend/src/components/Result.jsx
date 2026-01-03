import { motion } from "framer-motion";
import "../glass.css";
import bg from "../assets/features-bg.jpg";
import { useEffect, useState } from "react";

export default function Result() {
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/evaluate")
      .then(res => res.json())
      .then(data => {
        console.log("Backend response:", data);

        if (!data.ready) {
          setError(data.message);
          return;
        }

        setScore(data.score);
      })
      .catch(() => setError("Failed to fetch result"));
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
      <motion.div
        className="glass"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ width: 420, padding: 60, textAlign: "center" }}
      >
        <h2>Final Score</h2>

        {error && (
          <p style={{ color: "#ffb3b3", marginTop: 20 }}>
            {error}
          </p>
        )}

        {score !== null && (
          <motion.h1
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            style={{ marginTop: 20 }}
          >
            {score} / 100
          </motion.h1>
        )}
      </motion.div>
    </div>
  );
}
