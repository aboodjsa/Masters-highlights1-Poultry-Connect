import { useEffect, useState } from "react";
import api from "../api/axios";

const POULTRY_TYPES = ["Broiler Chicken", "Layer Chicken", "Eggs", "Turkey", "Duck", "Other"];
const UNITS = ["birds", "crates", "kg"];

const emptyForm = {
  title: "",
  poultryType: "Broiler Chicken",
  description: "",
  quantity: "",
  unit: "birds",
  pricePerUnit: "",
  location: "",
};

const FarmerDashboard = () => {
  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadListings = async () => {
    const { data } = await api.get("/listings/my/listings");
    setListings(data.listings);
  };

  const loadOrders = async () => {
    const { data } = await api.get("/orders/received");
    setOrders(data.orders);
  };

  useEffect(() => {
    loadListings();
    loadOrders();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        pricePerUnit: Number(form.pricePerUnit),
      };
      if (editingId) {
        await api.put(`/listings/${editingId}`, payload);
      } else {
        await api.post("/listings", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      loadListings();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save listing");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (listing) => {
    setEditingId(listing._id);
    setForm({
      title: listing.title,
      poultryType: listing.poultryType,
      description: listing.description || "",
      quantity: listing.quantity,
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit,
      location: listing.location,
    });
    setTab("listings");
  };

  const handleDelete = async (listingId) => {
    if (!confirm("Delete this listing?")) return;
    await api.delete(`/listings/${listingId}`);
    loadListings();
  };

  const toggleStatus = async (listing) => {
    const status = listing.status === "available" ? "sold out" : "available";
    await api.put(`/listings/${listing._id}`, { status });
    loadListings();
  };

  const handleOrderStatus = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status });
    loadOrders();
  };

  return (
    <div>
      <h1>My farm dashboard</h1>

      <div className="tabs">
        <button className={tab === "listings" ? "tab active" : "tab"} onClick={() => setTab("listings")}>
          My listings
        </button>
        <button className={tab === "orders" ? "tab active" : "tab"} onClick={() => setTab("orders")}>
          Orders received ({orders.length})
        </button>
      </div>

      {tab === "listings" && (
        <div className="dashboard-grid">
          <form className="card form" onSubmit={handleSubmit}>
            <h3>{editingId ? "Edit listing" : "Add a new listing"}</h3>

            <label>Title</label>
            <input name="title" value={form.title} onChange={handleChange} required />

            <label>Poultry type</label>
            <select name="poultryType" value={form.poultryType} onChange={handleChange}>
              {POULTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />

            <div className="input-row">
              <div>
                <label>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Unit</label>
                <select name="unit" value={form.unit} onChange={handleChange}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label>Price per unit</label>
            <input
              type="number"
              name="pricePerUnit"
              min="0"
              value={form.pricePerUnit}
              onChange={handleChange}
              required
            />

            <label>Location</label>
            <input name="location" value={form.location} onChange={handleChange} required />

            {error && <p className="error-text">{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {editingId ? "Save changes" : "Publish listing"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel edit
              </button>
            )}
          </form>

          <div className="listing-list">
            {listings.length === 0 && <p className="empty-state">You haven't listed any stock yet.</p>}
            {listings.map((item) => (
              <div className="card list-row" key={item._id}>
                <div>
                  <span className="listing-type">{item.poultryType}</span>
                  <h4>{item.title}</h4>
                  <p className="listing-meta">
                    {item.quantity} {item.unit} · {item.pricePerUnit.toLocaleString()} each ·{" "}
                    {item.status}
                  </p>
                </div>
                <div className="row-actions">
                  <button className="btn btn-small" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button className="btn btn-small" onClick={() => toggleStatus(item)}>
                    Mark {item.status === "available" ? "sold out" : "available"}
                  </button>
                  <button className="btn btn-small btn-danger" onClick={() => handleDelete(item._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="listing-list">
          {orders.length === 0 && <p className="empty-state">No orders yet.</p>}
          {orders.map((order) => (
            <div className="card list-row" key={order._id}>
              <div>
                <h4>{order.listing?.title}</h4>
                <p className="listing-meta">
                  {order.quantityOrdered} {order.listing?.unit} · Total{" "}
                  {order.totalPrice.toLocaleString()} · Buyer: {order.buyer?.name} (
                  {order.buyer?.phone})
                </p>
                <p className="order-status">Status: {order.status}</p>
              </div>
              {order.status === "pending" && (
                <div className="row-actions">
                  <button className="btn btn-small" onClick={() => handleOrderStatus(order._id, "accepted")}>
                    Accept
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleOrderStatus(order._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
              {order.status === "accepted" && (
                <div className="row-actions">
                  <button className="btn btn-small" onClick={() => handleOrderStatus(order._id, "completed")}>
                    Mark completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
