import React, { useState } from "react";
import api from "../services/api";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const login = async () => {

    try {

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

        alert("Login Failed");

    }

};

    return (

        <div className="login-container">

            <div className="login-box">

                <h1>NetShield AI</h1>

                <p>AI Network Monitoring System</p>

                <input
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={login}>
                    Login
                </button>

            </div>

        </div>

    );

}

export default Login;