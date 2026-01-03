import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../glass.css";
import bg from "../assets/landing-bg.jpg";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <motion.div
        className="glass"
        style={{
          padding: "52px 58px",
          width: 420,
          textAlign: "center",
        }}
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: "2.6rem", fontWeight: 700 }}
        >
          Exam Grader
        </motion.h1>

        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          style={{ opacity: 0.85, marginTop: 10 }}
        >
          Intelligent evaluation of handwritten exams
        </motion.p>

        <motion.button
          onClick={() => navigate("/features")}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.75, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          style={{
            marginTop: 34,
            padding: "14px 36px",
            borderRadius: 32,
            border: "none",
            background:
              "linear-gradient(135deg, rgba(170,120,255,0.95), rgba(120,70,220,0.95))",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Get Started
        </motion.button>
      </motion.div>
    </div>
  );
}
