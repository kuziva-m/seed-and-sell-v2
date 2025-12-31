import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListingDetails();
  }, [id]);

  const fetchListingDetails = async () => {
    setLoading(true);
    // 1. Fetch Listing
    const { data: item, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching listing:", error);
      setLoading(false);
      return;
    }
    setListing(item);

    // 2. Fetch Seller Details
    if (item.farmer_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", item.farmer_id)
        .single();
      setSellerProfile(profile);
    }
    setLoading(false);
  };

  const handleMessageSeller = async () => {
    if (!user) {
      navigate("/auth?redirect=messages");
      return;
    }
    // Navigate to messages with the seller ID pre-selected (Logic to be implemented in Messages.jsx)
    navigate(`/messages?chat_with=${listing.farmer_id}`);
  };

  if (loading)
    return <div className="loading-container">Loading details...</div>;
  if (!listing)
    return <div className="error-container">Listing not found.</div>;

  return (
    <div className="listing-detail-page">
      <div className="container">
        <Link to="/listings" className="back-link">
          <i className="fa-solid fa-arrow-left"></i> Back to Market
        </Link>

        <div className="detail-layout">
          {/* Left: Image */}
          <div className="detail-image-container">
            <img
              src={listing.main_image_url || "/images/field.webp"}
              alt={listing.product_name}
              className="main-detail-image"
            />
          </div>

          {/* Right: Info */}
          <div className="detail-info-container">
            <span className="category-tag">
              {listing.category} / {listing.sub_category}
            </span>
            <h1>{listing.product_name}</h1>
            <h2 className="detail-price">${listing.price}</h2>

            <div className="seller-info-box">
              <p>
                <strong>Seller:</strong>{" "}
                {sellerProfile?.full_name || "Verified Farmer"}
              </p>
              <p>
                <strong>Location:</strong> {listing.location}
              </p>
              <p>
                <strong>Available Quantity:</strong>{" "}
                {listing.quantity_available || "N/A"}
              </p>
            </div>

            <div className="description-box">
              <h3>Description</h3>
              <p>{listing.description || "No description provided."}</p>
            </div>

            <div className="action-buttons">
              {user && user.id === listing.farmer_id ? (
                <Link to="/dashboard" className="btn btn-secondary">
                  Edit My Listing
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleMessageSeller}
                    className="btn btn-primary"
                  >
                    <i className="fa-solid fa-comment-dots"></i> Message Seller
                  </button>
                  <a
                    href={`https://wa.me/?text=Hi, I am interested in your ${listing.product_name} listed on Seed&Sell.`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-whatsapp"
                  >
                    <i className="fa-brands fa-whatsapp"></i> Share on WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
