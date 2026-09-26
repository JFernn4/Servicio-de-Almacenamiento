import React from 'react';

function FieldInput({ icon, type, value, onChange, placeholder, showToggle, onToggle, showValue }) {
    return (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 14 }}>{icon}</div>
            <input
                type={showToggle && showValue ? "text" : type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#0F172A",
                    backgroundColor: "#fff",
                    outline: "none",
                    boxSizing: "border-box"
                }}
            />
            {showToggle && (
                <button type="button" onClick={onToggle} style={{ position: "absolute", right: 14, background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                    {showValue ? "Ocultar" : "Mostrar"}
                </button>
            )}
        </div>
    );
}
export default FieldInput;
