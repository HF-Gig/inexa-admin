import { Input, InputLabel } from "@mui/material";
import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const CommonTextEditor = ({
    value,
    onChange,
    mode = "edit", // 'edit' | 'add' | 'view'
    placeholder = "",
    minHeight = 100,
    label,
    error,
    helperText,
    required = false,
    ...props
}) => {
    return (
        <div style={{ width: '100%' }}>
            {label && (
                <InputLabel shrink>{label}{required && <span style={{ color: 'red' }}> *</span>}</InputLabel>
            )}
            {mode === "view" ? (
                <div
                    style={{
                        minHeight,
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        padding: 10,
                        background: "#fafafa",
                        color: "#222",
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: 14,
                    }}
                >
                    <div data-cteditor dangerouslySetInnerHTML={{ __html: value || "<i>No content</i>" }} />
                </div>
            ) : (
                <ReactQuill
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    style={{ minHeight }}
                    {...props}
                />
            )}
            {error && (
                <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 4 }}>{error || helperText}</div>
            )}
        </div>
    );
};

export default CommonTextEditor; 