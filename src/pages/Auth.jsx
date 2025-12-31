import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Refs for DOM elements
  const phoneInputRef = useRef(null);
  const itiRef = useRef(null);

  // Form Data State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    entityType: "",
    city: "",
    area: "",
    role: "",
  });

  // Initialize Phone Input & Check URL Params
  useEffect(() => {
    // Check ?mode=register in URL
    if (searchParams.get("mode") === "register") {
      setIsLoginView(false);
    }

    // Initialize Intl Tel Input if on Signup view
    if (!isLoginView && phoneInputRef.current) {
      itiRef.current = intlTelInput(phoneInputRef.current, {
        initialCountry: "zw",
        preferredCountries: ["zw", "za", "zm", "mz"],
        separateDialCode: true,
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
      });
    }

    // Cleanup
    return () => {
      if (itiRef.current) itiRef.current.destroy();
    };
  }, [isLoginView, searchParams]);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
    } else {
      setMessage({ text: "Login successful! Redirecting...", type: "success" });
      // AuthContext will detect the change automatically, we just navigate
      setTimeout(() => navigate("/dashboard"), 1000);
    }
  };

  // --- SIGNUP LOGIC ---
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    // 1. Validate Phone
    if (itiRef.current && !itiRef.current.isValidNumber()) {
      setMessage({ text: "Please enter a valid phone number.", type: "error" });
      setLoading(false);
      return;
    }
    const fullPhone = itiRef.current.getNumber();

    // 2. Sign Up Auth User
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
      return;
    }

    // 3. Create Profile Entry
    if (data.user) {
      const fullLocation = `${formData.city}, ${formData.area}`;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: formData.fullName,
        phone_number: fullPhone,
        location: fullLocation,
        user_role: formData.role,
      });

      if (profileError) {
        setMessage({
          text: "Account created but profile failed. Please contact support.",
          type: "error",
        });
      } else {
        setMessage({ text: "Account created successfully!", type: "success" });
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* --- LOGIN FORM --- */}
      {isLoginView ? (
        <div className="auth-form is-active" id="login-card">
          <h2>Log In to Your Account</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Logging In..." : "Log In"}
            </button>
          </form>
          <p className="auth-toggle">
            Don't have an account?{" "}
            <button className="text-link" onClick={() => setIsLoginView(false)}>
              Sign Up
            </button>
          </p>
        </div>
      ) : (
        /* --- SIGNUP FORM --- */
        <div className="auth-form is-active" id="signup-card">
          <h2>Create Your Account</h2>
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                ref={phoneInputRef}
                required
                style={{ width: "100%" }} // Fix for intl-tel-input width
              />
            </div>

            <div className="form-group">
              <label>I operate as a...</label>
              <select
                name="entityType"
                value={formData.entityType}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  -- Select Entity Type --
                </option>
                <option value="individual">
                  Individual / Small Scale Farmer
                </option>
                <option value="company">Registered Company</option>
              </select>
            </div>

            <div className="form-row" style={{ display: "flex", gap: "1rem" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>City / Town</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    -- Select --
                  </option>
                  <option value="Harare">Harare</option>
                  <option value="Bulawayo">Bulawayo</option>
                  <option value="Mutare">Mutare</option>
                  {/* Add other cities as needed */}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Area</label>
                <input
                  type="text"
                  name="area"
                  placeholder="e.g. Borrowdale"
                  value={formData.area}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Primary Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  -- Select Role --
                </option>
                <option value="farmer">Seller (Farmer/Supplier)</option>
                <option value="buyer">Buyer (Customer)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password (min. 6 chars)</label>
              <input
                type="password"
                name="password"
                minLength="6"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
          <p className="auth-toggle">
            Already have an account?{" "}
            <button className="text-link" onClick={() => setIsLoginView(true)}>
              Log In
            </button>
          </p>
        </div>
      )}

      {message.text && (
        <p id="auth-message" className={message.type}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default Auth;
