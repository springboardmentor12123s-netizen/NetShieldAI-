import React from "react";

function StatCard({ title, value }) {
  return (
    <div
      style={{
        width: "220px",
        minHeight: "120px",
        background: "linear-gradient(145deg, #1e293b, #0f172a)",
        borderRadius: "16px",
        padding: "20px",
        color: "white",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        borderLeft: "5px solid #38bdf8",
        transition: "0.3s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-5px)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.transform = "translateY(0px)")
      }
    >
      <h4
        style={{
          margin: 0,
          color: "#94a3b8",
          fontSize: "16px",
          fontWeight: "500",
        }}
      >
        {title}
      </h4>

      <h2
        style={{
          marginTop: "15px",
          marginBottom: 0,
          fontSize: "42px",
          color: "#38bdf8",
          fontWeight: "bold",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

export default StatCard;