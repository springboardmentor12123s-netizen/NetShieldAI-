import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginMessage, setLoginMessage] = useState('');

    const [regUser, setRegUser] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPass, setRegPass] = useState('');
    const [regRole, setRegRole] = useState('Analyst');
    const [regMessage, setRegMessage] = useState('');

    const API_URL = "http://127.0.0.1:8000";

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginMessage('');
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginUser, password: loginPass })
            });
            const result = await response.json();
            if (response.ok) {
                onLoginSuccess(result.access_token, result.username, result.role);
            } else {
                setLoginMessage(result.detail || "Invalid login credentials.");
            }
        } catch (err) {
            setLoginMessage("Server connection error.");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegMessage('');
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: regUser, email: regEmail, password: regPass, role: regRole })
            });
            const result = await response.json();
            if (response.ok) {
                setRegMessage("Registration complete! You can log in now.");
                setRegUser('');
                setRegEmail('');
                setRegPass('');
            } else {
                setRegMessage("Error: " + (result.detail || "Registration failed."));
            }
        } catch (err) {
            setRegMessage("Server communication error.");
        }
    };

    const [activeForm, setActiveForm] = useState('login'); // 'login' or 'register'

    return (
        <div className="container" style={{ maxWidth: '400px', margin: '40px auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', borderBottom: '1px solid #cccccc', paddingBottom: '10px' }}>
                <button 
                    type="button" 
                    onClick={() => setActiveForm('login')} 
                    style={{ 
                        background: 'none', 
                        color: activeForm === 'login' ? '#2c3e50' : '#777777', 
                        fontWeight: 'bold', 
                        border: 'none', 
                        borderBottom: activeForm === 'login' ? '3px solid #2c3e50' : 'none',
                        padding: '5px 10px',
                        cursor: 'pointer'
                    }}
                >
                    Sign In
                </button>
                <button 
                    type="button" 
                    onClick={() => setActiveForm('register')} 
                    style={{ 
                        background: 'none', 
                        color: activeForm === 'register' ? '#2c3e50' : '#777777', 
                        fontWeight: 'bold', 
                        border: 'none', 
                        borderBottom: activeForm === 'register' ? '3px solid #2c3e50' : 'none',
                        padding: '5px 10px',
                        cursor: 'pointer'
                    }}
                >
                    Register
                </button>
            </div>

            {activeForm === 'login' ? (
                <div>
                    <h2>System Login</h2>
                    <form onSubmit={handleLogin} autoComplete="off">
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} autoComplete="off" required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} autoComplete="off" required />
                        </div>
                        <button type="submit" style={{ width: '100%' }}>Log In</button>
                    </form>
                    {loginMessage && <p style={{ color: 'red', marginTop: '10px' }}>{loginMessage}</p>}
                </div>
            ) : (
                <div>
                    <h2>Register Account</h2>
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" value={regUser} onChange={(e) => setRegUser(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Select System Role</label>
                            <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                                <option value="Analyst">Analyst</option>
                                <option value="Admin">Admin</option>
                                <option value="Auditor">Auditor</option>
                            </select>
                        </div>
                        <button type="submit" style={{ width: '100%' }}>Create Account</button>
                    </form>
                    {regMessage && <p style={{ color: regMessage.startsWith('Error') ? 'red' : 'green', marginTop: '10px' }}>{regMessage}</p>}
                </div>
            )}
        </div>
    );
}
