import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialForm = {
  email: "",
  password: "",
};

const Login = ({ onLogin }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Login failed.");
      } else {
        setSuccess("Login successful!");
        if (onLogin) onLogin(data);
        setForm(initialForm);
        navigate("/dashboard"); // or wherever you want after login
      }
    } catch (err) {
      setError("Network error.");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-title">
          <span className="title-cursive">The Active</span>
          <br />
          <span className="title-bold">CHURCH</span>
        </div>
        <div className="login-subtitle">LOGIN</div>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-col">
          <label>Email Address :</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>

        <div className="form-col">
          <label>Password :</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>

        <div className="form-actions">
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Logging In..." : "Login"}
          </button>
        </div>
      </form>

      {/* Extra options */}
      <div className="login-links">
        <p>
          <span className="link" onClick={() => navigate("/forgot-password")}>
            Forgot Password?
          </span>
        </p>
        <p>
          <span className="link" onClick={() => navigate("/reset-password")}>
            Reset Password
          </span>
        </p>
        <p>
          Don’t have an account?{" "}
          <span className="link" onClick={() => navigate("/signup")}>
            Sign Up
          </span>
        </p>
      </div>

      {/* ✅ Responsive CSS */}
      <style jsx>{`
        .login-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 10px;
          font-family: sans-serif;
        }
        .login-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .login-title {
          font-size: 32px;
          font-weight: 700;
        }
        .title-cursive {
          font-family: cursive;
          font-weight: 400;
        }
        .title-bold {
          font-weight: 700;
        }
        .login-subtitle {
          font-size: 28px;
          font-weight: 700;
          margin: 20px 0;
        }
        .login-form {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          width: 100%;
        }
        .form-col {
          display: flex;
          flex-direction: column;
        }
        label {
          margin: 0 auto 2px;
          font-size: 16px;
        }
        input {
          width: 70%; 
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #bbb;
          margin: 0 auto 15px; 
          font-size: 16px;
          display: block; 
        }

        .form-actions {
          text-align: center;
          margin-top: 10px;
        }
        .error {
          color: red;
          margin-bottom: 10px;
        }
        .success {
          color: green;
          margin-bottom: 10px;
        }
        button {
          background: #000;
          color: #fff;
          border: none;
          border-radius: 20px;
          padding: 12px 50px;
          font-size: 18px;
          cursor: pointer;
          width: 100%;
          max-width: 170px;
        }
        .login-links {
          text-align: center;
          margin-top: 15px;
        }
        .link {
          color: blue;
          cursor: pointer;
          text-decoration: underline;
        }

        /* ✅ Responsive Breakpoints */
        @media (max-width: 600px) {
          .login-subtitle {
            font-size: 22px;
          }
          label {
            font-size: 14px;
          }
          input {
            font-size: 14px;
            padding: 8px;
          }
          button {
            font-size: 16px;
            padding: 10px 0;
          }
        }
        @media (max-width: 400px) {
          input {
            font-size: 13px;
            padding: 7px;
          }
          button {
            font-size: 14px;
            padding: 8px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
