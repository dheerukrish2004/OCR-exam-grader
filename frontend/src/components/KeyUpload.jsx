import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../glass.css";
import bg from "../assets/features-bg.jpg";

export default function KeyUpload() {
  const navigate = useNavigate();

  const uploadKey = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    await fetch("http://127.0.0.1:5000/upload-key", {
      method: "POST",
      body: fd
    });

    // 🔥 GO TO RESULT
    navigate("/result");
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
          width: 420,
          padding: "50px",
          textAlign: "center"
        }}
      >
        <h2>Upload Answer Key</h2>

        <motion.input
          type="file"
          accept=".txt"
          onChange={uploadKey}
          whileHover={{ scale: 1.05 }}
          style={{
            marginTop: 25,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.3)",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            cursor: "pointer"
          }}
        />
      </motion.div>
    </div>
  );
}
