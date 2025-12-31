import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = ({ onOpenMenu }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="global-header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo-link">
          <img
            src="/images/logo.webp"
            alt="Seed & Sell Logo"
            className="header-logo"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/listings" className="nav-link">
            Marketplace
          </Link>
          <Link to="/program" className="nav-link">
            Contract Farming
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
        </nav>

        {/* Auth Buttons (Desktop) */}
        <div className="header-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              <i className="fa-solid fa-user"></i> Dashboard
            </Link>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth" className="btn btn-secondary">
                Log In
              </Link>
              <Link to="/auth?mode=register" className="btn btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-btn"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;
