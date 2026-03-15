/* eslint-disable react/prop-types */
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";

const Header = ({ title, subtitle, action }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box mb="30px">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb="5px">
        <Typography
          variant="h2"
          fontWeight="bold"
          color={colors.black}
        >
          {title}
        </Typography>
        {action && <Box ml={2}>{action}</Box>}
      </Box>
      {subtitle && (
        <Typography variant="h5" color={colors.black}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default Header;
