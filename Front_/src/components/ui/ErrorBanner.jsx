import React from 'react';

function ErrorBanner({ msg }) {
    return (
        <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
            {msg}
        </div>
    );
}
export default ErrorBanner;
