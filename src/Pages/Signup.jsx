import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialForm = {
  name: "",
  surname: "",
  date_of_birth: "",
  home_address: "",
  invited_by: "",
  phone_number: "",
  email: "",
  gender: "",
  password: "",
  confirm_password: "",
};

const Signup = ({ onSignup }) => {
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

    // ✅ Basic validation
    for (const key in initialForm) {
      if (!form[key]) {
        setError("All fields are required.");
        return;
      }
    }

    // ✅ Password match
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    // ✅ Gender validation
    if (!["male", "female"].includes(form.gender)) {
      setError("Please select a valid gender.");
      return;
    }

    // ✅ Date of birth cannot be in the future
    const today = new Date();
    const dob = new Date(form.date_of_birth);
    if (dob > today) {
      setError("Date of Birth cannot be in the future.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Signup failed.");
      } else {
        setSuccess("User created successfully!");
        if (onSignup) onSignup(form);
        setForm(initialForm);
        navigate("/");
      }
    } catch (err) {
      setError("Network error.");
    }
    setLoading(false);
  };

  return (
    <div className="signup-container">
      <div className="signup-header">
        <div className="signup-title">
          <span className="title-cursive">The Active</span>
          <br />
          <span className="title-bold">CHURCH</span>
        </div>
        <div className="signup-subtitle">FILL IN YOUR DETAILS</div>
      </div>

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-col">
          <label htmlFor="name">Name :</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
          />

          <label>Date Of Birth :</label>
          <input
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange}
          />

          <label>Home Address :</label>
          <input
            name="home_address"
            value={form.home_address}
            onChange={handleChange}
            autoComplete="address-line1"
          />

          <label>Invited By :</label>
          <input
            name="invited_by"
            value={form.invited_by}
            onChange={handleChange}
          />

          <label>New Password :</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        <div className="form-col">
          <label>Surname :</label>
          <input
            name="surname"
            value={form.surname}
            onChange={handleChange}
            autoComplete="family-name"
          />

          <label>Email Address :</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />

          <label>Phone Number :</label>
          <input
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            autoComplete="tel"
          />

          <label>Gender :</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <label>Confirm New Password :</label>
          <input
            name="confirm_password"
            type="password"
            value={form.confirm_password}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        <div className="form-actions">
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </div>
      </form>
      <p>
        Already have an account?{" "}
        <span className="link" onClick={() => navigate("/login")}>
          Log In
        </span>
      </p>

      {/* Responsive CSS */}
      <style jsx>{`
        .signup-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 10px;
          font-family: sans-serif;
        }
        .signup-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .signup-title {
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
        .signup-subtitle {
          font-size: 28px;
          font-weight: 700;
          margin: 20px 0;
        }
        .signup-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          width: 100%;
        }
        .form-col {
          display: flex;
          flex-direction: column;
        }
        label {
          margin: 6px 0 2px;
          font-size: 16px;
        }
        input,
        select {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #bbb;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .form-actions {
          grid-column: span 2;
          text-align: center;
          margin-top: 20px;
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
        .link {
          color: blue;
          cursor: pointer;
          text-decoration: underline;
        }

        /* ✅ Responsive Breakpoints */
        @media (max-width: 900px) {
          .signup-form {
            grid-template-columns: 1fr;
          }
          button {
            max-width: 100%;
          }
          .signup-subtitle {
            font-size: 22px;
          }
        }
        @media (max-width: 600px) {
          label {
            font-size: 14px;
          }
          input,
          select {
            font-size: 14px;
            padding: 8px;
          }
          button {
            font-size: 16px;
            padding: 10px 0;
          }
          .signup-subtitle {
            font-size: 20px;
          }
        }
        @media (max-width: 400px) {
          input,
          select {
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

export default Signup;
