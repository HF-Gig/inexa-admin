import {
  Box,
  IconButton,
  useMediaQuery,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useState, useContext } from "react";
import {
  Logout,
  PersonOutlined,
} from "@mui/icons-material";

const Navbar = ({currentUsername}) => {
  // const theme = useTheme();
  // const colorMode = useContext(ColorModeContext);
  // const { toggled, setToggled } = useContext(ToggledContext);
  // const isMdDevices = useMediaQuery("(max-width:768px)");
  // const isXsDevices = useMediaQuery("(max-width:466px)");
  // const colors = tokens(theme.palette.mode);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Clear auth tokens or user data here
    localStorage.removeItem("token"); // Example: remove token
    localStorage.removeItem("name");
    // Redirect to signin page
    window.location.href = "/signin";
    handleMenuClose();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "end",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(40,40,40,0.04)",
        px: 3,
        py: 1.5,
        minHeight: 72,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Typography sx={{ marginRight: 5 }}>{currentUsername}</Typography>
      <Box display="flex" alignItems="center" gap={2}
        sx={{
          cursor: 'pointer',
          border: '1px solid #3322FF',
          borderRadius: '50%',
          padding: '5px',
          color: '#3322FF',
          '&:hover': {
            background: '#3322FF',
            color: '#FFF',
          },
        }}>

        <PersonOutlined onClick={handleMenuOpen} />
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 140,
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(40,40,40,0.10)',
              background: '#FFF',
              '& .MuiList-root': {
                paddingTop: 0,
                paddingBottom: 0,
              }
            },
          }}
        >
          <MenuItem
            onClick={handleLogout}
            sx={{
              color: '#3322FF',
              padding: '12px 24px',
              fontWeight: 500,
              gap: 1.5,
              '& svg': { color: '#3322FF', mr: 1 },
              '&:hover': {
                background: '#F0F4FF',
                color: '#3322FF',
                '& svg': { color: '#3322FF' },
              },
            }}
          >
            <Logout fontSize="small" /> Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Navbar;
