import React from 'react';

function AuthLogo() {
    return (
        <div style={{ marginBottom: 40, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, background: "#7D1535", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #ffffff", boxShadow: "0 4px 12px rgba(125, 21, 53, 0.25)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#3B0A1F" }}>VinCloud</span>
        </div>
    );
}
export default AuthLogo;
