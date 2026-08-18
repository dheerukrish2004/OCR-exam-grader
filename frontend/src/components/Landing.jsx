import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../glass.css";
import group from "../assets/group.png";
import { useCallback, useEffect } from "react";

const letterContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
};

const letter = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

function AnimatedWord({ text, style }) {
  return (
    <motion.div variants={letterContainer} initial="hidden" animate="show" style={{ display: "flex", ...style }}>
      {text.split("").map((char, i) => (
        <motion.span key={i} variants={letter} style={{ display: "inline-block" }}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  // Enforce smooth scrolling globally whenever Landing is mounted
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  const handleMouseMove = useCallback((e, index) => {
    const card = document.getElementById(`feature-card-${index}`);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Map mouse position to rotation (max 15 degrees)
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    card.style.boxShadow = "0 30px 60px rgba(0,0,0,0.15)";
  }, []);

  const handleMouseLeave = useCallback((index) => {
    const card = document.getElementById(`feature-card-${index}`);
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.boxShadow = "none";
  }, []);

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features-section");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div style={{ background: "#ffffff", overflowX: "hidden" }}>
      {/* ================= HERO SECTION ================= */}
      <section
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          padding: "0 20px",
          background: "radial-gradient(circle at center, #ffffff 0%, #f4f8fc 100%)" // Subtle depth matching our light theme
        }}
      >
        {/* ================= FLOATING WIDGET LEFT ================= */}
        <motion.div
          initial={{ opacity: 0, x: -50, y: 20 }}
          animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
          transition={{ y: { duration: 5, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.8 }, x: { duration: 0.8 } }}
          style={{
            position: "absolute",
            left: "6%",
            top: "32%",
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(20px)",
            padding: "24px",
            borderRadius: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
            border: "1px solid rgba(255,255,255,1)",
            zIndex: 15,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "240px"
          }}
          className="hidden-mobile"
        >
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Time Saved</span>
          <h3 style={{ margin: 0, fontSize: "2.0rem", color: "var(--primary)", fontWeight: 800, letterSpacing: "-1px" }}>
            Hours of manual grading <span style={{ fontSize: "1.2rem", color: "#000" }}></span>
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,113,227,0.1)", padding: "8px 14px", borderRadius: "20px", width: "fit-content", marginTop: "10px" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.5rem" }}>✓</div>
            <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>Verified</span>
          </div>
        </motion.div>

        {/* ================= FLOATING WIDGET RIGHT ================= */}
        <motion.div
          initial={{ opacity: 0, x: 50, y: 20 }}
          animate={{ opacity: 1, x: 0, y: [0, -15, 0] }}
          transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }, opacity: { duration: 0.8, delay: 0.2 }, x: { duration: 0.8, delay: 0.2 } }}
          style={{
            position: "absolute",
            right: "6%",
            top: "35%",
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(20px)",
            padding: "26px",
            borderRadius: "32px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
            border: "1px solid rgba(255,255,255,1)",
            zIndex: 15,
            width: "250px"
          }}
          className="hidden-mobile"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontSize: "0.8rem" }}>➔</div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Model Accuracy</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Global Precision</span>
          <p style={{ margin: "5px 0 0 0", fontSize: "1.2rem", fontWeight: 700, color: "#000", lineHeight: 1.4 }}>
            Semantic Analysis<br />
            <span style={{ fontSize: "1.8rem" }}>98.5% 🎯</span>
          </p>
          <div style={{ marginTop: "20px", borderTop: "1px dashed rgba(0,0,0,0.1)", paddingTop: "15px", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>

          </div>
        </motion.div>

        {/* ================= MAIN CENTER CONTENT ================= */}
        <div style={{ zIndex: 10, textAlign: "center", width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", alignItems: "center", marginTop: "-31vh" }}>

          {/* Top Pill Tag */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0,0,0,0.06)",
              padding: "8px 20px",
              borderRadius: "50px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-muted)",
               marginTop: "-30px",
              marginBottom: "35px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.03)"
            }}
          >
            Grade Smarter With <span style={{ color: "var(--primary)", fontWeight: 700 }}>ScriptEval</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={{ fontSize: "4.0rem", fontWeight: 800, letterSpacing: "-2.5px", lineHeight: 1.05, marginTop: "-20px",marginBottom: "25px", color: "#000" }}
          >
            Save Time & Effort <br /> On Every <span style={{ color: "var(--primary)" }}>Exam </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ fontSize: "1.2rem", color: "var(--text-muted)", maxWidth: "580px", margin: "0 auto 40px auto", lineHeight: 1.6, fontWeight: 400 }}
          >
            Discover effortless grading, get personalized semantic AI accuracy, and process paper reviews instantly with our automated platform.
          </motion.p>

          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.05, boxShadow: "0 15px 40px rgba(0, 113, 227, 0.45)", y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              padding: "14px 14px 14px 32px",
              borderRadius: "50px",
              display: "flex",
              alignItems: "center",
             
              gap: "24px"
            }}
            onClick={() => navigate("/ocr")}
          >
            Evaluate Exams Now
            <div style={{
              background: "#fff",
              color: "var(--primary)",
              width: "42px", height: "42px",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold", fontSize: "1.4rem",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
            }}>
              ➞
            </div>
          </motion.button>
        </div>

        {/* Infinite Floating Bottom Group Image (Acts as the center terminal in the ref) */}
        <motion.img
          src={group}
          alt="Students Group"
          style={{
            position: "absolute",
            bottom: -10,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "800px",
            height: "55%",
            objectFit: "contain",
            objectPosition: "center bottom",
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0.9
          }}
          initial={{ opacity: 0, y: 50, x: "-50%" }}
          animate={{ opacity: 1, y: [0, -12, 0], x: "-50%" }}
          transition={{
            opacity: { duration: 1, delay: 0.2 },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
        />
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section
        id="features-section"
        style={{
          minHeight: "100vh",
          background: "#f8fafd", // Very subtle off-white contrast separator seamlessly 
          padding: "120px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ textAlign: "center", marginBottom: "80px", maxWidth: "700px" }}
        >
          <h2 style={{ fontSize: "3rem", marginBottom: "20px", letterSpacing: "-1px" }}>
            The standard for modern grading.
          </h2>
          <p style={{ fontSize: "1.15rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            ScriptEval simplifies your entire exam evaluation workflow securely utilizing edge-case OCR analysis and semantic comparisons automatically.
          </p>
        </motion.div>

        {/* Native 3D Tilt Grid */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "40px", maxWidth: "1200px" }}>
          {[
            {
              title: "Upload Answer Sheet",
              desc: "Scan handwritten student answers directly using PaddleOCR bindings automatically parsing messy fonts precisely.",
              img: "/src/assets/feature-ocr.png",
              delay: 0.1
            },
            {
              title: "Upload Answer Key",
              desc: "Provide reference teacher answers seamlessly evaluating absolute grading benchmarks actively mapped strictly locally.",
              img: "/src/assets/feature-key.png",
              delay: 0.3
            },
            {
              title: "Get Score & Feedback",
              desc: "Deploy highly contextual generative AI analytics grading feedback instantaneously without silent failures natively.",
              img: "/src/assets/feature-score.png",
              delay: 0.5
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              id={`feature-card-${i}`}
              className="glass"
              initial={{ opacity: 0, x: -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: f.delay, ease: [0.16, 1, 0.3, 1] }}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => handleMouseLeave(i)}
              style={{
                width: "340px",
                padding: "32px",
                borderRadius: "24px",
                textAlign: "left",
                background: "rgba(255, 255, 255, 0.75)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
                transition: "transform 0.15s ease-out, box-shadow 0.3s ease",
                cursor: "pointer",
                position: "relative",
                zIndex: 2,
                transformStyle: "preserve-3d" // Necessary explicitly mapping native CSS Depth 
              }}
            >
              <img
                src={f.img}
                alt={f.title}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "16px",
                  marginBottom: "25px",
                  display: "block",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.05)"
                }}
              />
              <h3 style={{ fontSize: "1.4rem", marginBottom: "12px", letterSpacing: "-0.5px" }}>{f.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
