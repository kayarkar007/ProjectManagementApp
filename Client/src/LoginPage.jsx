import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Helper for email validation
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }
    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Log In
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="LoginEmail">
              Email
            </label>
            <input
              id="LoginEmail"
              name="email"
              type="email"
              autoComplete="username"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label
              className="inline-block text-gray-300 mb-1"
              htmlFor="LoginPassword"
            >
              Password
            </label>
            <input
              id="LoginPassword"
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              required
              minLength={8}
              placeholder="Enter Password"
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className={`w-full py-2 mt-6 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-gray-400 text-sm">
            Forgot your password?{" "}
            <a
              href="#"
              className="text-blue-400 hover:underline"
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault();
                alert("Password reset is not implemented in this demo.");
              }}
            >
              Reset here
            </a>
          </span>
        </div>
        <div className="SignUpLink mt-4 text-center text-gray-400 text-sm">
          Don't have an account?{" "}
          <span>
            <Link to="/signup" className="text-blue-400 hover:underline">
              Sign Up
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
