import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaShieldAlt } from "react-icons/fa";

import "../styles/Register.css";
function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        email: "",
        password: ""
    });

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleRegister = async (e) => {

        e.preventDefault();

        try {

            await axios.post(
                "http://127.0.0.1:8000/auth/register",
                formData
            );

            alert("Registration Successful!");

            navigate("/");

        } catch (error) {

            alert(
                error.response?.data?.detail ||
                "Registration Failed"
            );

        }

    };

    return (

        <div className="register-container">

            <div className="register-card">

                <FaShieldAlt className="register-logo" />

                <h1>NetShield AI</h1>

                <form onSubmit={handleRegister}>

                    <input
                        type="text"
                        name="full_name"
                        placeholder="Full Name"
                        onChange={handleChange}
                        required
                    /><br></br>

                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        onChange={handleChange}
                        required
                    /><br></br>

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        onChange={handleChange}
                        required
                    /><br></br>

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        onChange={handleChange}
                        required
                    /><br></br>

                    <button type="submit">
                        Register
                    </button>

                </form>

                
  
              

            </div>

        </div>

    );
}

export default Register;