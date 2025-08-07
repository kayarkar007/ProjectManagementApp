import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Helper for email validation
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const SignUpPage = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
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
    if (
      !form.username ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (form.username.length < 3) {
      setError("Username must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    try {
      await signup({
        username: form.username,
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Create Account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1" htmlFor="firstName">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.firstName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1" htmlFor="lastName">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.lastName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.username}
              onChange={handleChange}
              disabled={loading}
              required
              minLength={3}
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              required
              minLength={8}
            />
          </div>
          <div>
            <label
              className="block text-gray-300 mb-1"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              minLength={8}
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
