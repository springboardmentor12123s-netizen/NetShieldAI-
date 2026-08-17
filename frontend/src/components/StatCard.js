import React from "react";

function StatCard({ title, value }) {

  const getStyle = () => {
    switch (title) {
      case "Benign":
      case "Benign Packets":
        return {
          color: "#10B981",
          background: "#DDF9EC",
          icon: "🛡️"
        };

      case "XSS":
        return {
          color: "#8B5CF6",
          background: "#EEE8FF",
          icon: "🧪"
        };

      case "SQL Injection":
        return {
          color: "#F59E0B",
          background: "#FFF4D6",
          icon: "🗄️"
        };

      case "Brute Force":
        return {
          color: "#EC4899",
          background: "#FCE7F3",
          icon: "🔐"
        };

      case "Attack Packets":
        return {
          color: "#EF4444",
          background: "#FFE4E6",
          icon: "🚨"
        };

      case "TCP Packets":
        return {
          color: "#3B82F6",
          background: "#E5F0FF",
          icon: "🔵"
        };

      case "TLS Packets":
        return {
          color: "#8B5CF6",
          background: "#EEE8FF",
          icon: "🟣"
        };

      case "DNS Packets":
        return {
          color: "#F59E0B",
          background: "#FFF4D6",
          icon: "🌐"
        };

      case "UDP Packets":
        return {
          color: "#EC4899",
          background: "#FCE7F3",
          icon: "💗"
        };

      case "Total Live Packets":
        return {
          color: "#06B6D4",
          background: "#DFF9FF",
          icon: "📡"
        };

      default:
        return {
          color: "#3B82F6",
          background: "#E5F0FF",
          icon: "📊"
        };
    }
  };

  const style = getStyle();

  return (
    <div
      style={{
        width: "220px",
        minHeight: "120px",
        background: "#ffffff",
        borderRadius: "18px",
        padding: "20px",
        color: "#17305c",
        boxShadow: "0 8px 25px rgba(60, 80, 140, 0.10)",
        borderBottom: `4px solid ${style.color}`,
        transition: "0.3s ease",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        boxSizing: "border-box"
      }}

      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow =
          "0 12px 30px rgba(60, 80, 140, 0.16)";
      }}

      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 8px 25px rgba(60, 80, 140, 0.10)";
      }}
    >

      {/* Emoji */}
      <div
        style={{
          width: "58px",
          height: "58px",
          borderRadius: "16px",
          background: style.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          flexShrink: 0
        }}
      >
        {style.icon}
      </div>

      {/* Text */}
      <div>

        <h4
          style={{
            margin: 0,
            color: "#60708f",
            fontSize: "15px",
            fontWeight: "500"
          }}
        >
          {title}
        </h4>

        <h2
          style={{
            margin: "8px 0 0 0",
            fontSize: "38px",
            color: style.color,
            fontWeight: "700"
          }}
        >
          {value}
        </h2>

      </div>

    </div>
  );
}

export default StatCard;