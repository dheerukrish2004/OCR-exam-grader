import { motion } from "framer-motion";
import "../glass.css";
import bg from "../assets/features-bg.jpg";
import { useEffect, useState } from "react";

export default function Result() {
  const [score, setScore] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/evaluate")
      .then(res => res.json())
      .then(data => setScore(data.score));
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
        transition={{ type: "spring", stiffness: 120 }}
        style={{
          width: 420,
          padding: "60px",
          textAlign: "center"
        }}
      >
        <h2>Final Score</h2>
        {score !== null && (
          <motion.h1
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            {score} / 100
          </motion.h1>
        )}
      </motion.div>
    </div>
  );
}
