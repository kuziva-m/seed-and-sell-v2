import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MobileNav = () => {
  const { user } = useAuth();

  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/listings"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <i className="fa-solid fa-store"></i>
        <span>Market</span>
      </NavLink>

      <NavLink
        to="/program"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <i className="fa-solid fa-handshake"></i>
        <span>Program</span>
      </NavLink>

      <NavLink
        to={user ? "/dashboard" : "/auth"}
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <i
          className={`fa-solid ${user ? "fa-user" : "fa-right-to-bracket"}`}
        ></i>
        <span>{user ? "Profile" : "Login"}</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;
