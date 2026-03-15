import React from "react";
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from "@mui/material";

const CommonSelect = ({
    name,
    label,
    value,
    onChange,
    options = [],
    error,
    required = false,
    helperText,
    multiple = false,
    disabled = false,
    ...props
}) => {
    return (
        <FormControl fullWidth variant="standard" error={!!error} disabled={disabled} sx={{ mb: 2 }}>
            {label && <InputLabel shrink htmlFor={name}>{label} {required && <span style={{ color: 'red' }}> *</span>}</InputLabel>}
            <Select
                name={name}
                label={label}
                value={value}
                onChange={onChange}
                multiple={multiple}
                variant="standard"
                InputLabelProps={{
                    shrink: true,  
                }}
                {...props}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
};

export default CommonSelect; 