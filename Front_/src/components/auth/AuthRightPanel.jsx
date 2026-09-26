import React from 'react';

function AuthRightPanel({ title, subtitle }) {
    return (
        <div className="animated-gradient-bg" style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 8%", textAlign: "center", overflow: "hidden" }}>
            {/* Bubbles */}
            <div className="bubbles-container">
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
            </div>
            
            <h1 style={{ position: "relative", zIndex: 10, fontSize: 42, fontWeight: 800, color: "#FFFFFF", whiteSpace: "pre-line", marginBottom: 16 }}>{title}</h1>
            <p style={{ position: "relative", zIndex: 10, fontSize: 18, color: "#E2E8F0", maxWidth: 450, lineHeight: 1.6 }}>{subtitle}</p>
        </div>
    );
}
export default AuthRightPanel;
