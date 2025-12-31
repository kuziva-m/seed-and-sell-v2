import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const MobileMenu = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    navigate("/");
  };

  return (
    <div
      className={`mobile-menu-overlay ${isOpen ? "is-visible" : ""}`}
      onClick={onClose}
    >
      <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-menu-header">
          <h3>
            {user
              ? `Hi, ${user.user_metadata?.full_name || "Farmer"}`
              : "Welcome, Guest"}
          </h3>
          <button onClick={onClose} className="close-menu-btn">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="mobile-menu-scroll">
          <div className="menu-section">
            <h4 className="menu-label">My Account</h4>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="menu-link highlight"
                  onClick={onClose}
                >
                  <i className="fa-solid fa-user"></i> My Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="menu-link"
                  style={{
                    color: "var(--danger-color)",
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <i className="fa-solid fa-right-from-bracket"></i> Log Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="menu-link highlight"
                onClick={onClose}
              >
                <i className="fa-solid fa-right-to-bracket"></i> Login / Sign Up
              </Link>
            )}
          </div>

          <div className="menu-section">
            <h4 className="menu-label">Marketplace</h4>
            <Link
              to="/listings?cat=produce"
              className="menu-link"
              onClick={onClose}
            >
              <i className="fa-solid fa-carrot"></i> Buy Produce
            </Link>
            <Link
              to="/listings?cat=inputs"
              className="menu-link"
              onClick={onClose}
            >
              <i className="fa-solid fa-sack-xmark"></i> Buy Inputs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
