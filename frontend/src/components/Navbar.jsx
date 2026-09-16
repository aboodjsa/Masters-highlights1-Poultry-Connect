import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          Poultry<span>Connect</span>
        </Link>

        <nav className="nav-links">
          <Link to="/listings">Marketplace</Link>

          {!user && (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="nav-cta">
                Get started
              </Link>
            </>
          )}

          {user && user.role === "farmer" && (
            <Link to="/farmer/dashboard">My farm</Link>
          )}

          {user && user.role === "buyer" && (
            <Link to="/buyer/dashboard">My orders</Link>
          )}

          {user && (
            <button className="nav-logout" onClick={handleLogout}>
              Log out ({user.name.split(" ")[0]})
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
