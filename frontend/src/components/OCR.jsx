import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import bg from "../assets/bggf.jpg";

export default function OCR() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadStudent = async () => {
    if (!file) {
      alert("Please select a student answer sheet image");
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

      navigate("/key");
    } catch {
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
      <div style={{ display: "flex", gap: 40, width: "80%", maxWidth: 1100 }}>
        
        {/* LEFT GLASS CARD */}
        <motion.div
          whileHover={{ y: -8 }}
          style={{
            flex: 2,
            padding: 60,
            borderRadius: 30,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.25)"
          }}
        >
          <h2 style={{ marginBottom: 30 }}>Upload Student Answer Sheet</h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              padding: 18,
              width: "100%",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.25)"
            }}
          />
        </motion.div>

        {/* RIGHT BLACK CARD */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={!loading ? uploadStudent : null}
          style={{
            flex: 1,
            borderRadius: 30,
            background: "black",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 20,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 30px 60px rgba(0,0,0,0.4)"
          }}
        >
          {loading ? "Uploading..." : "Continue →"}
        </motion.div>
      </div>
    </div>
  );
}