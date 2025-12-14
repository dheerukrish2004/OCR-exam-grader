import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../glass.css";
import bg from "../assets/features-bg.jpg";

export default function OCR() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadStudent = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setLoading(true);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:5000/upload-student", {
        method: "POST",
        body: fd
      });

      if (!res.ok) throw new Error("Upload failed");

      // ✅ move to feature 2
      navigate("/key");
    } catch (err) {
      alert("Failed to upload student answer sheet");
    } finally {
      setLoading(false);
    }
  };

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
          width: 440,
          padding: "50px",
          textAlign: "center"
        }}
      >
        <h2>Upload Student Answer Sheet</h2>

        <motion.input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          whileHover={{ scale: 1.03 }}
          style={{
            marginTop: 25,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.3)",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            cursor: "pointer",
            width: "100%"
          }}
        />

        <motion.button
          onClick={uploadStudent}
          disabled={loading}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          style={{
            marginTop: 30,
            padding: "14px 36px",
            borderRadius: 30,
            border: "none",
            background:
              "linear-gradient(135deg, rgba(170,120,255,0.95), rgba(120,70,220,0.95))",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Uploading..." : "Upload & Continue"}
        </motion.button>
      </motion.div>
    </div>
  );
}
