import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileNav from "./components/MobileNav";
import MobileMenu from "./components/MobileMenu";

// Pages
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import Messages from "./pages/Messages";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Header onOpenMenu={() => setIsMenuOpen(true)} />
          <MobileMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          />

          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/messages" element={<Messages />} />
              <Route
                path="*"
                element={
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    404 - Page Not Found
                  </div>
                }
              />
            </Routes>
          </main>

          <Footer />
          <MobileNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
