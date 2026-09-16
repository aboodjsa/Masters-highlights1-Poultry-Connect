import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <p className="hero-tag">Farm gate to wholesale, no middlemen</p>
        <h1>
          Sell your birds straight to the buyers who need them.
        </h1>
        <p className="hero-lead">
          PoultryConnect is a direct marketplace linking poultry farmers with
          wholesale buyers — hotels, distributors, and market traders — so
          farmers earn a fairer price and buyers source with confidence.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">
            Join as a farmer or buyer
          </Link>
          <Link to="/listings" className="btn btn-outline">
            Browse the marketplace
          </Link>
        </div>
      </section>

      <section className="how">
        <h2>How it works</h2>
        <div className="how-grid">
          <div className="how-item">
            <h3>1. List your stock</h3>
            <p>
              Farmers post available broilers, layers, eggs, turkey, or duck
              stock with quantity, price, and location.
            </p>
          </div>
          <div className="how-item">
            <h3>2. Buyers browse and order</h3>
            <p>
              Wholesale buyers search listings by type and location, then
              place an order directly with the farmer.
            </p>
          </div>
          <div className="how-item">
            <h3>3. Farmer confirms the sale</h3>
            <p>
              The farmer accepts, rejects, or completes the order from their
              dashboard — no broker fees, no guesswork.
            </p>
          </div>
        </div>
      </section>

      <section className="why">
        <h2>Why this matters</h2>
        <p>
          Smallholder poultry farmers commonly lose a large share of their
          margin to intermediaries, while wholesale buyers struggle to verify
          supply and quality at the source. A lightweight, direct marketplace
          shortens that chain, improves price transparency for farmers, and
          gives buyers a reliable channel to sourced, traceable stock.
        </p>
      </section>
    </div>
  );
};

export default Home;
