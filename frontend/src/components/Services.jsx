import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../glass.css";
import bg from "../assets/features-bg.jpg";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.35
    }
  }
};

const card = {
  hidden: {
    x: -80,
    scale: 0.7,
    opacity: 0
  },
  show: {
    x: 0,
    scale: 1.05,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18
    }
  }
};

export default function Services() {
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
        alignItems: "center"
      }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: "flex",
          gap: 40
        }}
      >
        {/* FEATURE 1 */}
        <motion.div
          className="glass"
          variants={card}
          whileHover={{ scale: 1.12 }}
          onClick={() => navigate("/ocr")}
          style={{
            width: 300,
            padding: "45px 35px",
            cursor: "pointer",
            textAlign: "center"
          }}
        >
          <h2>Upload Answer Sheet</h2>
          <p style={{ opacity: 0.8 }}>
            Upload student handwritten answers for OCR
          </p>
        </motion.div>

        {/* FEATURE 2 */}
        <motion.div
          className="glass"
          variants={card}
          whileHover={{ scale: 1.12 }}
          style={{
            width: 300,
            padding: "45px 35px",
            textAlign: "center"
          }}
        >
          <h2>Upload Answer Key</h2>
          <p style={{ opacity: 0.8 }}>
            Provide the correct answers for evaluation
          </p>
        </motion.div>

        {/* FEATURE 3 */}
        <motion.div
          className="glass"
          variants={card}
          whileHover={{ scale: 1.12 }}
          style={{
            width: 300,
            padding: "45px 35px",
            textAlign: "center"
          }}
        >
          <h2>Get Score</h2>
          <p style={{ opacity: 0.8 }}>
            AI compares answers and generates marks
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
