import React, { useState } from 'react';

const initialForm = {
    name: '',
    surname: '',
    date_of_birth: '',
    home_address: '',
    invited_by: '',
    phone_number: '',
    email: '',
    gender: '',
    password: '',
    confirm_password: '',
};

const Signup = ({ onSignup }) => {
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
        for (const key in initialForm) {
            if (!form[key]) {
                setError('All fields are required.');
                return;
            }
        }
        if (form.password !== form.confirm_password) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.detail || 'Signup failed.');
            } else {
                setSuccess('User created successfully!');
                if (onSignup) onSignup(form);
                setForm(initialForm);
            }
        } catch (err) {
            setError('Network error.');
        }
        setLoading(false);
    };

    return (
        <div
            style={{
                maxWidth: 1000,
                margin: '0 auto',
                padding: '3px 0',
                fontFamily: 'sans-serif',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'cursive', fontWeight: 400 }}>The Active</span>
                    <br />
                    <span style={{ fontWeight: 700 }}>CHURCH</span>
                </div>
                <div style={{ fontSize: 40, fontWeight: 700, margin: '30px 0 10px' }}>
                    FILL IN YOUR<br />DETAILS
                </div>
            </div>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 30,
                    justifyContent: 'center',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        flex: '1 1 300px',
                        minWidth: 260,
                        maxWidth: 500,
                        boxSizing: 'border-box',
                        padding: '0 10px',
                    }}
                >
                    <label>Name :</label>
                    <input name="name" value={form.name} onChange={handleChange} style={inputStyle} autoComplete="name" />
                    <label>Date Of Birth :</label>
                    <input name="date_of_birth" value={form.date_of_birth} onChange={handleChange} style={inputStyle} placeholder="DD Month YYYY" />
                    <label>Home Address :</label>
                    <input name="home_address" value={form.home_address} onChange={handleChange} style={inputStyle} autoComplete="address-line1" />
                    <label>Invited By :</label>
                    <input name="invited_by" value={form.invited_by} onChange={handleChange} style={inputStyle} />
                    <label>New Password :</label>
                    <input name="password" type="password" value={form.password} onChange={handleChange} style={inputStyle} autoComplete="new-password" />
                </div>
                <div
                    style={{
                        flex: '1 1 300px',
                        minWidth: 260,
                        maxWidth: 500,
                        boxSizing: 'border-box',
                        padding: '0 10px',
                    }}
                >
                    <label>Surname :</label>
                    <input name="surname" value={form.surname} onChange={handleChange} style={inputStyle} autoComplete="family-name" />
                    <label>Email Address :</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} style={inputStyle} autoComplete="email" />
                    <label>Phone Number :</label>
                    <input name="phone_number" value={form.phone_number} onChange={handleChange} style={inputStyle} autoComplete="tel" />
                    <label>Gender :</label>
                    <input name="gender" value={form.gender} onChange={handleChange} style={inputStyle} />
                    <label>Confirm New Password :</label>
                    <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} style={inputStyle} autoComplete="new-password" />
                </div>
                <div style={{ width: '100%', textAlign: 'center', marginTop: 30 }}>
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
                            width: '100%',
                            maxWidth: 350,
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </div>
            </form>
            <style>
                {`
                @media (max-width: 900px) {
                    form {
                        flex-direction: column !important;
                        gap: 0 !important;
                    }
                    form > div {
                        max-width: 100% !important;
                        min-width: 0 !important;
                        padding: 0 !important;
                    }
                    button {
                        max-width: 100% !important;
                        padding: 12px 0 !important;
                        font-size: 16px !important;
                    }
                    .active-church-title {
                        font-size: 24px !important;
                    }
                }
                @media (max-width: 600px) {
                    div[style*="maxWidth: 1000px"] {
                        padding: 0 5px !important;
                    }
                    form {
                        flex-direction: column !important;
                        gap: 0 !important;
                    }
                    form > div {
                        max-width: 100% !important;
                        min-width: 0 !important;
                        padding: 0 !important;
                    }
                    label {
                        font-size: 15px !important;
                    }
                    input {
                        font-size: 15px !important;
                        padding: 8px 10px !important;
                    }
                    button {
                        font-size: 15px !important;
                        padding: 10px 0 !important;
                    }
                }
                `}
            </style>
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

export default Signup