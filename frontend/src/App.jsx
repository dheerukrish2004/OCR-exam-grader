import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./components/Landing";
import Upload from "./components/Upload";
import Result from "./components/Result";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StudentDashboard from "./components/StudentDashboard";
import TeacherHistory from "./components/TeacherHistory";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/teacher-dashboard" element={<Upload />} />
        <Route path="/teacher-history" element={<TeacherHistory />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/result" element={<Result />} />
        {/* Support old paths just in case to prevent errors */}
        <Route path="/ocr" element={<Navigate to="/upload" />} />
        <Route path="/key" element={<Navigate to="/upload" />} />
      </Routes>
    </BrowserRouter>
  );
}