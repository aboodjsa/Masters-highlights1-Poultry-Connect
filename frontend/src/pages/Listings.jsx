import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const POULTRY_TYPES = ["Broiler Chicken", "Layer Chicken", "Eggs", "Turkey", "Duck", "Other"];

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [poultryType, setPoultryType] = useState("");
  const [location, setLocation] = useState("");

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (poultryType) params.poultryType = poultryType;
      if (location) params.location = location;
      const { data } = await api.get("/listings", { params });
      setListings(data.listings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div>
      <h1>Marketplace</h1>
      <p className="page-subtitle">Live stock listed directly by farmers.</p>

      <form className="filter-bar" onSubmit={handleFilter}>
        <select value={poultryType} onChange={(e) => setPoultryType(e.target.value)}>
          <option value="">All poultry types</option>
          {POULTRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          placeholder="Filter by location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button className="btn btn-outline" type="submit">
          Filter
        </button>
      </form>

      {loading && <p>Loading listings...</p>}
      {!loading && listings.length === 0 && (
        <p className="empty-state">No listings match your filters yet.</p>
      )}

      <div className="listing-grid">
        {listings.map((item) => (
          <Link to={`/listings/${item._id}`} className="listing-card" key={item._id}>
            <span className="listing-type">{item.poultryType}</span>
            <h3>{item.title}</h3>
            <p className="listing-meta">
              {item.quantity} {item.unit} available · {item.location}
            </p>
            <p className="listing-price">
              {item.pricePerUnit.toLocaleString()} / {item.unit.slice(0, -1) || item.unit}
            </p>
            <p className="listing-farmer">Sold by {item.farmer?.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Listings;
