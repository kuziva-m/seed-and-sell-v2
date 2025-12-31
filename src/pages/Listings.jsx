import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { CONFIG } from "../config";

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters from URL
  const typeFilter = searchParams.get("type") || "peer"; // 'peer' (Farmers) or 'featured' (Bulk)
  const categoryFilter = searchParams.get("cat") || "all";
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    fetchListings();
  }, [typeFilter, categoryFilter, searchQuery]);

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    // 1. Handle "Farmer" vs "Bulk Supply" Toggle
    if (typeFilter === "featured") {
      // Show only Company listings
      query = query.eq("farmer_id", CONFIG.COMPANY_USER_ID);
    } else {
      // Show everyone ELSE (Peer-to-peer)
      query = query.neq("farmer_id", CONFIG.COMPANY_USER_ID);
    }

    // 2. Category Filter
    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    // 3. Search Filter (matches title or description)
    if (searchQuery) {
      query = query.or(
        `product_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;
    if (error) console.error("Error fetching listings:", error);
    else setItems(data || []);
    setLoading(false);
  };

  // Helper to update URL params
  const updateFilter = (key, value) => {
    searchParams.set(key, value);
    setSearchParams(searchParams);
  };

  return (
    <div className="listings-page">
      <div className="container">
        {/* --- Controls Section --- */}
        <div className="listings-controls">
          {/* Search Bar */}
          <div className="search-bar">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search maize, fertilizer..."
              value={searchQuery}
              onChange={(e) => updateFilter("q", e.target.value)}
            />
          </div>

          {/* Toggle (Farmer vs Bulk) */}
          <div className="marketplace-toggle">
            <button
              className={`toggle-option ${
                typeFilter === "peer" ? "active" : ""
              }`}
              onClick={() => updateFilter("type", "peer")}
            >
              Farmer Listings
            </button>
            <button
              className={`toggle-option ${
                typeFilter === "featured" ? "active" : ""
              }`}
              onClick={() => updateFilter("type", "featured")}
            >
              Bulk Supply
            </button>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            <button
              className={`cat-btn ${categoryFilter === "all" ? "active" : ""}`}
              onClick={() => updateFilter("cat", "all")}
            >
              All
            </button>
            <button
              className={`cat-btn ${
                categoryFilter === "produce" ? "active" : ""
              }`}
              onClick={() => updateFilter("cat", "produce")}
            >
              Produce
            </button>
            <button
              className={`cat-btn ${
                categoryFilter === "inputs" ? "active" : ""
              }`}
              onClick={() => updateFilter("cat", "inputs")}
            >
              Inputs
            </button>
            <button
              className={`cat-btn ${
                categoryFilter === "services" ? "active" : ""
              }`}
              onClick={() => updateFilter("cat", "services")}
            >
              Services
            </button>
          </div>
        </div>

        {/* --- Grid Section --- */}
        <div className="marketplace-grid">
          {loading ? (
            <p className="loading-text">Loading marketplace...</p>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-basket-shopping"></i>
              <p>No listings found matching your criteria.</p>
              {typeFilter === "peer" && (
                <Link to="/dashboard" className="btn btn-primary">
                  Post the first one!
                </Link>
              )}
            </div>
          ) : (
            items.map((item) => (
              <Link
                to={`/listings/${item.id}`}
                key={item.id}
                className="listing-card"
              >
                <div className="card-image-wrapper">
                  <img
                    src={item.main_image_url || "/images/field.webp"}
                    alt={item.product_name}
                    loading="lazy"
                  />
                  <span className="card-badge">{item.sub_category}</span>
                </div>
                <div className="listing-card-content">
                  <h3>{item.product_name}</h3>
                  <p className="price">${item.price}</p>
                  <p className="location">
                    <i className="fa-solid fa-location-dot"></i> {item.location}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Listings;
