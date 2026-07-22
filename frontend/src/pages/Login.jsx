import { useState } from "react";
import API from "../services/api";
import "../styles/Login.css";
import { FaShieldAlt } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await API.post("/auth/login", {
    username: email,
    password: password
});

            

            localStorage.setItem(
    "token",
    response.data.token
);
alert("Login Successful");
navigate("/dashboard");


        } catch (error) {
            console.log(error);
            alert("Login Failed");
        }
    };


    return (
        <div className="login-container">

            <div className="login-card">

                <FaShieldAlt className="logo"/>

                <h1>NetShield AI</h1>

                <form onSubmit={handleLogin}>

                    <input
                        type="text"
                        placeholder="Username"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                    />

                    <button type="submit">
                        Login
                    </button>
                    <p className="register-link">
    Don't have an account?{" "}
    <Link to="/register">Register</Link>
</p>

                </form>

            </div>

        </div>
    );
}

export default Login;