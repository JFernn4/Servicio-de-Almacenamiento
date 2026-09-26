import React from 'react';

function SubmitButton({ loading, label, loadingLabel }) {
    return (
        <button
            type="submit"
            disabled={loading}
            style={{
                background: loading ? "#9e2a4a" : "#7D1535",
                color: "#fff",
                padding: "14px",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s"
            }}
        >
            {loading ? loadingLabel : label}
        </button>
    );
}
export default SubmitButton;
