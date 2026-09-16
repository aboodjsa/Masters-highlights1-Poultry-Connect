import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [quantityOrdered, setQuantityOrdered] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}`).then(({ data }) => setListing(data.listing));
  }, [id]);

  const handleOrder = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!user) {
      navigate("/login");
      return;
    }

    setPlacingOrder(true);
    try {
      await api.post("/orders", { listingId: id, quantityOrdered: Number(quantityOrdered) });
      setMessage("Order placed! Track its status from your buyer dashboard.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!listing) return <p>Loading...</p>;

  return (
    <div className="detail-page">
      <span className="listing-type">{listing.poultryType}</span>
      <h1>{listing.title}</h1>
      <p className="listing-meta">
        {listing.quantity} {listing.unit} available · {listing.location} · Status:{" "}
        {listing.status}
      </p>
      <p className="listing-price large">
        {listing.pricePerUnit.toLocaleString()} per {listing.unit.slice(0, -1) || listing.unit}
      </p>

      {listing.description && <p className="listing-description">{listing.description}</p>}

      <div className="card farmer-card">
        <h3>Farmer contact</h3>
        <p>{listing.farmer?.name}</p>
        <p>{listing.farmer?.location}</p>
        <p>{listing.farmer?.phone}</p>
      </div>

      {(!user || user.role === "buyer") && listing.status === "available" && (
        <form className="card form order-form" onSubmit={handleOrder}>
          <h3>Place an order</h3>
          <label>Quantity ({listing.unit})</label>
          <input
            type="number"
            min="1"
            max={listing.quantity}
            value={quantityOrdered}
            onChange={(e) => setQuantityOrdered(e.target.value)}
            required
          />
          <p className="order-total">
            Estimated total: {(quantityOrdered * listing.pricePerUnit).toLocaleString()}
          </p>
          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}
          <button className="btn btn-primary" type="submit" disabled={placingOrder}>
            {user ? (placingOrder ? "Placing order..." : "Place order") : "Log in to order"}
          </button>
        </form>
      )}

      {listing.status !== "available" && (
        <p className="empty-state">This listing is currently sold out.</p>
      )}
    </div>
  );
};

export default ListingDetail;
