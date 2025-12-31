import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Layout Components (You will create these)
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileNav from "./components/MobileNav";

// Pages
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";
import Program from "./pages/Program";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Header appears on all pages */}
        <Header />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/program" element={<Program />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
        <MobileNav />
      </div>
    </Router>
  );
}

export default App;
