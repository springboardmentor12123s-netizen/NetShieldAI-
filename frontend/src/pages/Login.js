import React, { useState } from "react";
import api from "../services/api";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const login = async () => {
        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/auth/login", {
                email,
                password
            });

            console.log("Login Success:", response.data);

            localStorage.setItem(
                "token",
                response.data.access_token
            );

            navigate("/dashboard");

        } catch (err) {
            console.error("Login Error:", err);

            if (err.response) {
                console.log("Status:", err.response.status);
                console.log("Data:", err.response.data);
            }

            alert("Login Failed. Please check your email and password.");

        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            login();
        }
    };

    return (
        <div className="login-container">

            {/* Decorative background elements */}
            <div className="login-decoration decoration-one"></div>
            <div className="login-decoration decoration-two"></div>
            <div className="login-decoration decoration-three"></div>


            <div className="login-box">

                {/* Logo */}
                <div className="login-logo">
                    🛡️
                </div>


                {/* Heading */}
                <h1>NetShield AI</h1>

                <p className="login-subtitle">
                    AI-Powered Network Security
                </p>


                {/* Security badge */}
                <div className="security-badge">
                    <span className="status-dot"></span>
                    Secure Security Monitoring
                </div>


                {/* Email */}
                <div className="input-group">

                    <label>Email Address</label>

                    <div className="input-wrapper">

                        <span className="input-icon">
                            ✉️
                        </span>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />

                    </div>

                </div>


                {/* Password */}
                <div className="input-group">

                    <label>Password</label>

                    <div className="input-wrapper">

                        <span className="input-icon">
                            🔒
                        </span>

                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                        />

                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                                setShowPassword(!showPassword)
                            }
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>

                    </div>

                </div>


                {/* Login button */}
                <button
                    className="login-button"
                    onClick={login}
                    disabled={loading}
                >

                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign In
                            <span className="login-arrow">
                                →
                            </span>
                        </>
                    )}

                </button>


                {/* Bottom security message */}
                <div className="login-footer">

                    <span>🔐</span>

                    <span>
                        Your connection is protected
                    </span>

                </div>

            </div>

        </div>
    );
}

export default Login;