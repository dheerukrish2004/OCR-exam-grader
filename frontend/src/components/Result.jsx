import { motion } from "framer-motion";
import "../glass.css";
import bg from "../assets/features-bg.jpg";
import { useEffect, useState } from "react";

export default function Result() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/evaluate")
      .then(res => res.json())
      .then(res => {
        if (!res.ready) {
          setError(res.message);
        } else {
          setData(res);
        }
      })
      .catch(() => {
        setError("Failed to connect to backend");
      });
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
          width: 460,
          padding: "50px",
          textAlign: "center"
        }}
      >
        {/* ERROR STATE */}
        {error && (
          <>
            <h2>Evaluation Not Ready</h2>
            <p style={{ opacity: 0.85, marginTop: 15 }}>{error}</p>
          </>
        )}

        {/* SUCCESS STATE */}
        {data && (
          <>
            <h2>Final Score</h2>

            <motion.h1
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              style={{ marginTop: 20 }}
            >
              {data.score} / 100
            </motion.h1>

            <h3 style={{ marginTop: 30 }}>Feedback</h3>
            <p style={{ opacity: 0.9, marginTop: 10 }}>
              {data.feedback}
            </p>

            {data.improvements?.length > 0 && (
              <>
                <h3 style={{ marginTop: 30 }}>Needs Improvement</h3>
                <ul style={{ marginTop: 10, listStyle: "none", padding: 0 }}>
                  {data.improvements.map((item, i) => (
                    <li key={i} style={{ opacity: 0.85 }}>
                      • {item}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
