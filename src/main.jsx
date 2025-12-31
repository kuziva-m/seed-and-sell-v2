import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/* --- CSS Imports (Order matches your original index.html) --- */
import "./css/_base.css"; //
import "./css/_header.css"; //
import "./css/_footer.css"; //
import "./css/_forms.css"; //
import "./css/_listings.css"; //
import "./css/_dashboard.css"; //
import "./css/_chat.css"; //
import "./css/_components.css"; //
import "./css/_toggle.css"; //
import "./css/_modal.css"; //
import "./css/_responsive.css"; //
import "./css/styles.css"; //

/* Note: FontAwesome is best kept in index.html <head> or installed via npm */

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
