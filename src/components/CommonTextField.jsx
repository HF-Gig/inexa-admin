import React from "react";
import TextField from "@mui/material/TextField";

/**
 * CommonTextField - A reusable input with error message display
 *
 * Props:
 * - label: string (input label)
 * - type: string (input type, e.g. 'text', 'number', 'email', etc.)
 * - error: string (error message to display below the input)
 * - ...rest: any other TextField props
 */const CommonTextField = ({
  label,
  labelNote,
  required = false,
  ...props
}) => (
  <TextField
    {...props}
    label={
      <span>
        {label}
        {required && <span style={{ color: 'red' }}> *</span>}
        {labelNote && (
          <span style={{
            color: '#888',
            fontWeight: 400,
            marginLeft: 6,
            fontSize: '0.95em'
          }}>
            {labelNote}
          </span>
        )}
      </span>
    }
    error={!!props.error}
    helperText={props.helperText || ''}
    fullWidth
    variant="standard"
    InputLabelProps={{
      shrink: true,  // This makes the label always visible
    }}
  />
);

export default CommonTextField;