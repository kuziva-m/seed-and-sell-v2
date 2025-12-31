import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Home = () => {
  // Example of handling the toggle state with React Hooks instead of manual DOM manipulation
  const [activeTab, setActiveTab] = useState("peer-listings");

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text-column">
            <h2>Recruiting Verified Sellers!</h2>
            <p>
              We are onboarding Zimbabwe's best farmers and suppliers. Register
              now to get verified and secure your spot.
            </p>
            <div className="hero-actions">
              <Link to="/auth" className="btn btn-primary">
                Register Now
              </Link>
              <a href="https://wa.me/263785141781" className="btn">
                <i className="fa-brands fa-whatsapp"></i> +263 78 514 1781
              </a>
            </div>
          </div>
          <div className="hero-logo-column">
            <img
              src="/images/logo.webp"
              alt="Seed & Sell Logo"
              className="hero-logo"
            />
          </div>
        </div>
      </section>

      {/* Promo Section */}
      <section className="promo-section fade-in-section">
        <div className="b2b-cta">
          <div className="cta-column">
            <h3>
              <i className="fa-solid fa-truck-ramp-box icon"></i>Are You a
              Large-Scale Buyer?
            </h3>
            <p>
              Need a reliable, large-volume supply of produce? Our core company
              offers bulk contracts.
            </p>
            <a href="https://wa.me/263785141781" className="btn">
              +263 78 514 1781
            </a>
          </div>
          <div className="cta-column">
            <h3>
              <i className="fa-solid fa-tractor icon"></i>Are You a Farmer?
            </h3>
            <p>Tired of finding buyers? Join our Contract Program.</p>
            <Link to="/program" className="btn btn-primary">
              Join Our Program
            </Link>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <div className="container fade-in-section" id="marketplace-container">
        <div className="marketplace-toggle-wrapper">
          <div className="marketplace-toggle">
            <button
              className={`toggle-option ${
                activeTab === "peer-listings" ? "active" : ""
              }`}
              onClick={() => setActiveTab("peer-listings")}
            >
              Farmer Listings
            </button>
            <button
              className={`toggle-option ${
                activeTab === "featured-listings" ? "active" : ""
              }`}
              onClick={() => setActiveTab("featured-listings")}
            >
              Bulk Supply
            </button>
          </div>

          <div className="marketplace-content-wrapper">
            {activeTab === "peer-listings" && (
              <div className="marketplace-grid">
                <h2 className="grid-title">Farmer Listings</h2>
                {/* You would map over your Supabase data here */}
                <p>Loading listings...</p>
              </div>
            )}

            {activeTab === "featured-listings" && (
              <div className="marketplace-grid">
                <h2 className="grid-title">Featured Bulk Supply</h2>
                <p>Loading featured listings...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
