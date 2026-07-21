import React from "react";
import { useNavigate } from "react-router-dom";

function NotFound() {

    const navigate = useNavigate();

    return (

        <div
            style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                background: "#f4f7fc"
            }}
        >

            <h1
                style={{
                    fontSize: "80px",
                    color: "#4F46E5",
                    marginBottom: "10px"
                }}
            >
                404
            </h1>

            <h2>Page Not Found</h2>

            <p>
                The page you are looking for doesn't exist.
            </p>

            <button
                onClick={() => navigate("/dashboard")}
                style={{
                    marginTop: "20px",
                    padding: "12px 25px",
                    border: "none",
                    background: "#4F46E5",
                    color: "white",
                    borderRadius: "8px",
                    cursor: "pointer"
                }}
            >
                Go to Dashboard
            </button>

        </div>

    );

}

export default NotFound;