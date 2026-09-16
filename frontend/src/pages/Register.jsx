import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "farmer",
    phone: "",
    location: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card form" onSubmit={handleSubmit}>
        <h1>Create your account</h1>

        <div className="role-toggle">
          <button
            type="button"
            className={form.role === "farmer" ? "role-btn active" : "role-btn"}
            onClick={() => setForm({ ...form, role: "farmer" })}
          >
            I'm a farmer
          </button>
          <button
            type="button"
            className={form.role === "buyer" ? "role-btn active" : "role-btn"}
            onClick={() => setForm({ ...form, role: "buyer" })}
          >
            I'm a buyer
          </button>
        </div>

        <label>Full name</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          minLength={6}
          required
        />

        <label>Phone number</label>
        <input name="phone" value={form.phone} onChange={handleChange} />

        <label>Location (town / region)</label>
        <input name="location" value={form.location} onChange={handleChange} required />

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="form-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
