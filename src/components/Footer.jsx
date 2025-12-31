import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="global-footer" className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Seed & Sell</h4>
          <p>
            Connecting Zimbabwe's farmers with reliable markets and quality
            inputs.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/listings">Buy Produce</Link>
            </li>
            <li>
              <Link to="/program">Contract Farming</Link>
            </li>
            <li>
              <Link to="/contact">Contact Support</Link>
            </li>
            <li>
              <Link to="/auth">Login / Register</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>
            <i className="fa-brands fa-whatsapp"></i> +263 78 514 1781
          </p>
          <p>
            <i className="fa-solid fa-envelope"></i> info@seedandsell.co.zw
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} Seed & Sell. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
