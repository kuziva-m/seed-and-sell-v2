import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { CONFIG } from "../config";

// Taxonomy Config
const ZIM_CATEGORIES = {
  produce: {
    label: "Farm Produce",
    unit: "Quantity (Crates, Buckets, Tons)",
    types: [
      "Maize",
      "Tomatoes",
      "Onions",
      "Leafy Vegetables",
      "Potatoes",
      "Poultry",
      "Beef",
      "Goats",
      "Eggs",
      "Mushrooms",
      "Soya Beans",
      "Tobacco",
    ],
  },
  inputs: {
    label: "Farm Inputs",
    unit: "Quantity (Bags, Litres, KGs)",
    types: [
      "Maize Seed",
      "Fertilizer (Compound D)",
      "Fertilizer (AN)",
      "Lime",
      "Herbicides",
      "Pesticides",
      "Stockfeed",
      "Veterinary Medicine",
    ],
  },
  services: {
    label: "Services",
    unit: "Availability (Hours, Hectares)",
    types: [
      "Tractor Ploughing",
      "Crop Spraying",
      "Transport",
      "Borehole Drilling",
      "Harvesting",
      "Veterinary Services",
      "Farm Fencing",
    ],
  },
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'listings' | 'form'
  const [profile, setProfile] = useState({
    full_name: "",
    phone_number: "",
    location: "",
  });
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Form State (New Listing)
  const [listingForm, setListingForm] = useState({
    id: null,
    category: "",
    sub_category: "",
    product_name: "",
    price: "",
    quantity: "",
    location: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    if (!user) return; // Wait for AuthContext
    fetchProfile();
    fetchMyListings();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchMyListings = async () => {
    setLoadingListings(true);
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setMyListings(data || []);
    setLoadingListings(false);
  };

  // --- FORM HANDLERS ---
  const handleCategoryChange = (e) => {
    setListingForm({
      ...listingForm,
      category: e.target.value,
      sub_category: "",
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (listing) => {
    setListingForm({
      id: listing.id,
      category: listing.category,
      sub_category: listing.sub_category,
      product_name: listing.product_name,
      price: listing.price,
      quantity: listing.quantity_available,
      location: listing.location,
      description: listing.description,
    });
    setImagePreview(listing.main_image_url);
    setActiveTab("form"); // Switch to form tab
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .eq("farmer_id", user.id);
    fetchMyListings();
  };

  const handleListingSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "Saving...", type: "info" });

    let imageUrl = listingForm.id ? imagePreview : null; // Keep existing if editing

    // Upload Image if new file selected
    if (imageFile) {
      const path = `public/${user.id}_${Date.now()}_${imageFile.name.replace(
        /[^a-zA-Z0-9.]/g,
        ""
      )}`;
      const { error: uploadError } = await supabase.storage
        .from(CONFIG.IMAGES.BUCKET)
        .upload(path, imageFile);

      if (uploadError) {
        setMessage({ text: "Image upload failed", type: "error" });
        return;
      }
      const { data } = supabase.storage
        .from(CONFIG.IMAGES.BUCKET)
        .getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const payload = {
      farmer_id: user.id,
      category: listingForm.category,
      sub_category: listingForm.sub_category,
      product_name: listingForm.product_name,
      price: listingForm.price,
      quantity_available: listingForm.quantity,
      location: listingForm.location,
      description: listingForm.description,
      main_image_url: imageUrl,
    };

    let error;
    if (listingForm.id) {
      // Update
      const { error: updateError } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", listingForm.id);
      error = updateError;
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from("listings")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ text: "Listing saved successfully!", type: "success" });
      setListingForm({
        id: null,
        category: "",
        sub_category: "",
        product_name: "",
        price: "",
        quantity: "",
        location: "",
        description: "",
      }); // Reset
      setImageFile(null);
      setImagePreview(null);
      fetchMyListings();
      setTimeout(() => setActiveTab("listings"), 1000);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: "Updating profile...", type: "info" });
    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", user.id);
    if (error) setMessage({ text: error.message, type: "error" });
    else setMessage({ text: "Profile updated!", type: "success" });
  };

  // --- RENDER ---
  return (
    <div className="dashboard-layout is-ready">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <nav className="dashboard-nav">
          <button
            className={`dashboard-nav-link ${
              activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <i className="fa-solid fa-user icon"></i>My Profile
          </button>
          <button
            className={`dashboard-nav-link ${
              activeTab === "listings" ? "active" : ""
            }`}
            onClick={() => setActiveTab("listings")}
          >
            <i className="fa-solid fa-list-check icon"></i>My Listings
          </button>
          <button
            className={`dashboard-nav-link ${
              activeTab === "form" ? "active" : ""
            }`}
            onClick={() => {
              // Reset form when clicking "Post New"
              setListingForm({
                id: null,
                category: "",
                sub_category: "",
                product_name: "",
                price: "",
                quantity: "",
                location: "",
                description: "",
              });
              setImagePreview(null);
              setActiveTab("form");
            }}
          >
            <i className="fa-solid fa-square-plus icon"></i>Post New Listing
          </button>
        </nav>
      </aside>

      {/* CONTENT AREA */}
      <section className="dashboard-content">
        {/* Verification Banner */}
        <div
          className="dashboard-card"
          style={{
            border: "2px solid #ffa726",
            backgroundColor: "#fff3e0",
            padding: "1.5rem",
            marginBottom: "1rem",
          }}
        >
          <h3 style={{ color: "#ef6c00", marginBottom: "0.5rem" }}>
            <i className="fa-solid fa-circle-exclamation"></i> Verification
            Pending
          </h3>
          <p style={{ marginBottom: "1rem", color: "#333" }}>
            Our team will automatically contact you via WhatsApp to verify your
            account.
          </p>
          <a
            href="https://wa.me/263785141781"
            target="_blank"
            className="btn btn-primary"
            style={{ backgroundColor: "#25d366", borderColor: "#25d366" }}
          >
            <i className="fa-brands fa-whatsapp"></i> Verify Now
          </a>
        </div>

        {/* FEEDBACK MESSAGE */}
        {message.text && (
          <div
            className={`toast ${message.type}`}
            style={{
              marginBottom: "1rem",
              padding: "1rem",
              borderRadius: "8px",
              background: message.type === "error" ? "#ffebee" : "#e8f5e9",
            }}
          >
            {message.text}
          </div>
        )}

        {/* PANEL: PROFILE */}
        {activeTab === "profile" && (
          <div className="dashboard-panel active">
            <div className="dashboard-card">
              <h2>
                <i className="fa-solid fa-user-pen icon"></i> My Profile
              </h2>
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone_number || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, phone_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={profile.location || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, location: e.target.value })
                    }
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Update Profile
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PANEL: LISTINGS */}
        {activeTab === "listings" && (
          <div className="dashboard-panel active">
            <div className="dashboard-card">
              <h2>
                <i className="fa-solid fa-list-check icon"></i>My Active
                Listings
              </h2>
              <div id="my-listings-grid">
                {loadingListings ? (
                  <p>Loading your listings...</p>
                ) : myListings.length === 0 ? (
                  <p>
                    No listings yet. Click "Post New Listing" to start selling.
                  </p>
                ) : (
                  myListings.map((item) => (
                    <div key={item.id} className="listing-card">
                      <div
                        className="listing-card-content"
                        style={{ padding: "1rem" }}
                      >
                        <h4
                          style={{
                            margin: "0 0 0.5rem 0",
                            fontSize: "0.8rem",
                            color: "#666",
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}
                        >
                          {item.category} - {item.sub_category}
                        </h4>
                        <h3 style={{ margin: "0 0 0.5rem 0" }}>
                          {item.product_name}
                        </h3>
                        <p
                          style={{
                            color: "var(--primary-color)",
                            fontWeight: 700,
                          }}
                        >
                          ${item.price}
                        </p>
                      </div>
                      <div
                        className="listing-card-actions"
                        style={{
                          padding: "0 1rem 1rem 1rem",
                          display: "flex",
                          gap: "0.5rem",
                        }}
                      >
                        <button
                          onClick={() => handleEditClick(item)}
                          className="btn edit-btn"
                          style={{ flex: 1 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn delete-btn"
                          style={{ flex: 1 }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANEL: FORM (NEW/EDIT) */}
        {activeTab === "form" && (
          <div className="dashboard-panel active">
            <div className="dashboard-card">
              <h2>
                <i className="fa-solid fa-square-plus icon"></i>{" "}
                {listingForm.id ? "Edit Listing" : "Post New Listing"}
              </h2>
              <form onSubmit={handleListingSubmit}>
                <div
                  className="form-row"
                  style={{ display: "flex", gap: "1rem" }}
                >
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Category</label>
                    <select
                      value={listingForm.category}
                      onChange={handleCategoryChange}
                      required
                    >
                      <option value="" disabled>
                        -- Select Category --
                      </option>
                      {Object.keys(ZIM_CATEGORIES).map((key) => (
                        <option key={key} value={key}>
                          {ZIM_CATEGORIES[key].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Sub-Category</label>
                    <select
                      value={listingForm.sub_category}
                      onChange={(e) =>
                        setListingForm({
                          ...listingForm,
                          sub_category: e.target.value,
                        })
                      }
                      required
                      disabled={!listingForm.category}
                    >
                      <option value="" disabled>
                        -- Select Type --
                      </option>
                      {listingForm.category &&
                        ZIM_CATEGORIES[listingForm.category].types.map(
                          (type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          )
                        )}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Title / Name</label>
                  <input
                    type="text"
                    value={listingForm.product_name}
                    onChange={(e) =>
                      setListingForm({
                        ...listingForm,
                        product_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div
                  className="form-row"
                  style={{ display: "flex", gap: "1rem" }}
                >
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={listingForm.price}
                      onChange={(e) =>
                        setListingForm({
                          ...listingForm,
                          price: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={listingForm.quantity}
                      onChange={(e) =>
                        setListingForm({
                          ...listingForm,
                          quantity: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={listingForm.location}
                    onChange={(e) =>
                      setListingForm({
                        ...listingForm,
                        location: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="4"
                    value={listingForm.description}
                    onChange={(e) =>
                      setListingForm({
                        ...listingForm,
                        description: e.target.value,
                      })
                    }
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: "10px" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary">
                  {listingForm.id ? "Update Listing" : "Post Listing"}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
