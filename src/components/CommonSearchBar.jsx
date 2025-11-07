import { InputAdornment, TextField, IconButton, useTheme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const CommonSearchBar = ({ value, onChange, placeholder = "Search...", sx = {} }) => {
  const theme = useTheme();
  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      sx={{
        background: "#f5f7fa",
        borderRadius: 2,
        minHeight: 44,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          fontSize: 16,
          paddingLeft: 1,
          background: "#f5f7fa",
          "& fieldset": {
            borderColor: "#e0e6ed",
          },
          "&:hover fieldset": {
            borderColor: theme.palette.primary.light,
          },
          "&.Mui-focused fieldset": {
            borderColor: theme.palette.primary.main,
            boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.08)",
          },
        },
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: theme.palette.grey[600] }} />
          </InputAdornment>
        ),
        endAdornment: value && (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => onChange("")}
              sx={{
                color: theme.palette.primary.main,
                p: 0.5,
                ml: 0.5,
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default CommonSearchBar; 