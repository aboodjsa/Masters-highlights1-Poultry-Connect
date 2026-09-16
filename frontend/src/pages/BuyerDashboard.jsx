import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const BuyerDashboard = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders/my").then(({ data }) => setOrders(data.orders));
  }, []);

  return (
    <div>
      <h1>My orders</h1>

      {orders.length === 0 && (
        <p className="empty-state">
          You haven't placed any orders yet. <Link to="/listings">Browse the marketplace</Link>.
        </p>
      )}

      <div className="listing-list">
        {orders.map((order) => (
          <div className="card list-row" key={order._id}>
            <div>
              <h4>{order.listing?.title}</h4>
              <p className="listing-meta">
                {order.quantityOrdered} {order.listing?.unit} · Total{" "}
                {order.totalPrice.toLocaleString()}
              </p>
              <p className="listing-meta">
                Farmer: {order.farmer?.name} ({order.farmer?.phone}) · {order.farmer?.location}
              </p>
              <p className="order-status">Status: {order.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerDashboard;
