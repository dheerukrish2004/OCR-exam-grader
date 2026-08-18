import { motion } from "framer-motion";

export default function CircularProgress({ score, total, size = 80 }) {
  const percentage = total > 0 ? (score / total) : 0;
  const radius = size / 2;
  const strokeWidth = Math.max(size * 0.08, 4); // Adaptive stroke width
  const normalizedRadius = radius - strokeWidth * 1.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - percentage * circumference;

  let color = "var(--danger)";
  if (percentage >= 0.8) color = "var(--success)";
  else if (percentage >= 0.5) color = "var(--warning)";

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg height={size} width={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        
        {/* Background Track */}
        <circle
          stroke="var(--border-color)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        {/* Animated Progress Ring */}
        <motion.circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        />
      </svg>
      
      {/* Centered Percentage Text */}
      <div style={{ position: "absolute", fontWeight: 800, fontSize: size * 0.22, color: "var(--text-main)", letterSpacing: "-0.05em" }}>
        {Math.round(percentage * 100)}%
      </div>
    </div>
  );
}
