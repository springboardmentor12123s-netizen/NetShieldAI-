import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/login.css";

function Login() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Admin");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const login = async (e) => {

        e.preventDefault();

        setError("");

        if (!username || !password) {
            setError("Please fill all fields.");
            return;
        }

        setLoading(true);

        try {

            const res = await api.post("/login", {

                username,
                password,
                role

            });

            localStorage.setItem(
                "user",
                JSON.stringify(res.data)
            );

            navigate("/dashboard");

        }

        catch (err) {

            if (err.response) {

                setError(err.response.data.message);

            }

            else {

                setError("Unable to connect to server.");

            }

        }

        setLoading(false);

    };

    return (

        <div className="login-page">

            <div className="glass">

                <h1>🛡 NetShield AI</h1>

                <p>AI Powered Cyber Security Monitoring System</p>

                <form onSubmit={login}>

                    <label>Username</label>

                    <input
                        type="text"
                        placeholder="Enter Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <label>Role</label>

                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="role-select"
                    >
                        <option>Admin</option>
                        <option>Analyst</option>
                        <option>Viewer</option>
                    </select>

                    <button type="submit">

                        {loading ? "Authenticating..." : "LOGIN"}

                    </button>

                    {error &&

                        <div className="error">

                            {error}

                        </div>

                    }

                </form>

            </div>

        </div>

    );

}

export default Login;