import "./App.css";
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import AiRecommendation from "./pages/AiRecommendation";

import Navbar from "./components/Navbar";
import ParallaxHeader from "./components/ParallaxHeader";

import Home from "./pages/Home";
import Reports from "./pages/Reports";
import About from "./pages/About";

function App() {
  // Search state (client-side only)
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <ParallaxHeader />

      <main>
        <Routes>
          <Route path="/" element={<Home searchTerm={searchTerm} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/about" element={<About />} />
        <Route path="/ai" element={<AiRecommendation />} />
        </Routes>
      </main>
    </>
  );
}

export default App;