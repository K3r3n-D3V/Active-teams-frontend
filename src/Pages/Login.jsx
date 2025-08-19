import React, { useState } from 'react';

const initialForm = {
    email: '',
    password: '',
};

const Login = ({ onLogin }) => {
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Basic validation
        if (!form.email || !form.password) {
            setError('Email and password are required.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.detail || 'Login failed.');
            } else {
                setSuccess('Login successful!');
                if (onLogin) onLogin(data);
                setForm(initialForm);
            }
        } catch (err) {
            setError('Network error.');
        }
        setLoading(false);
    };

    return (
        <div style={{
            maxWidth: 400,
            margin: '0 auto',
            padding: '3px 0',
            fontFamily: 'sans-serif'
        }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'cursive', fontWeight: 400 }}>The Active</span><br />
                    <span style={{ fontWeight: 700 }}>CHURCH</span>
                </div>
                <div style={{ fontSize: 40, fontWeight: 700, margin: '30px 0 10px' }}>
                    LOGIN
                </div>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label>Email Address :</label>
                <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    style={inputStyle}
                    autoComplete="email"
                />
                <label>Password :</label>
                <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    style={inputStyle}
                    autoComplete="current-password"
                />
                <div style={{ width: '100%', textAlign: 'center', marginTop: 20 }}>
                    {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
                    {success && <div style={{ color: 'green', marginBottom: 10 }}>{success}</div>}
                    <button
                        type="submit"
                        style={{
                            background: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 20,
                            padding: '12px 60px',
                            fontSize: 18,
                            cursor: 'pointer',
                            marginTop: 10,
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '8px 16px',
    borderRadius: 12,
    border: '1px solid #bbb',
    margin: '6px 0 18px',
    fontSize: 16,
    outline: 'none',
};

// Add a border and box-shadow to the form container
export default Login;



