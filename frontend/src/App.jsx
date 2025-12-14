import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./components/Landing";
import Services from "./components/Services";
import OCR from "./components/OCR";
import KeyUpload from "./components/KeyUpload";
import Result from "./components/Result";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Services />} />
        <Route path="/ocr" element={<OCR />} />
        <Route path="/key" element={<KeyUpload />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}
