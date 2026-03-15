import { createTheme } from "@mui/material";
import { useMemo, useState, createContext } from "react";

// Custom Color Palette
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
      primary: {
        main: "#3322FF", // Primary blue
        400: "#282828", // Sidebar background
      },
      secondary: {
        main: "#6644FF", // Accent blue
      },
      background: {
        default: "#282828", // Sidebar and dark background
        paper: "#1a1a1a",
      },
      text: {
        primary: "#000",
        secondary: "#000",
      },
      gray: {
        100: "#D4D4D4",
      },
      greenAccent: {
        400: "#CCDD00",
        500: "#CCDD00",
        600: "#CCDD00",
      },
      accent: {
        yellow: "#CCDD00",
      },
      divider: "#D4D4D4",
    }
    : {
      primary: {
        main: "#3322FF", // Primary blue
        400: "#282828", // Sidebar background
      },
      secondary: {
        main: "#6644FF", // Accent blue
      },
      background: {
        default: "#FFFFFF",
        paper: "#FFFFFF",
      },
      text: {
        primary: "#282828",
        secondary: "#6644FF",
      },
      gray: {
        100: "#D4D4D4",
      },
      greenAccent: {
        400: "#CCDD00",
        500: "#CCDD00",
        600: "#CCDD00",
      },
      accent: {
        yellow: "#CCDD00",
      },
      divider: "#D4D4D4",
    }),
});

// MUI Theme Settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);

  return {
    palette: {
      mode,
      primary: {
        main: colors.primary.main,
      },
      secondary: {
        main: colors.secondary.main,
      },
      background: {
        default: colors.background.default,
        paper: colors.background.paper,
      },
      text: {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
      },
      accent: {
        yellow: colors.accent.yellow,
      },
      divider: colors.divider,
    },
    typography: {
      fontFamily: [
        "Montserrat", // Body font
        "Poppins",    // Heading font
        "sans-serif",
      ].join(","),
      h1: {
        fontFamily: "Poppins, sans-serif",
        fontWeight: 500,
        fontSize: 40,
      },
      h2: {
        fontFamily: "Poppins, sans-serif",
        fontWeight: 500,
        fontSize: 32,
      },
      h3: {
        fontFamily: "Poppins, sans-serif",
        fontWeight: 500,
        fontSize: 24,
      },
      h4: {
        fontFamily: "Poppins, sans-serif",
        fontWeight: 500,
        fontSize: 20,
      },
      h5: {
        fontFamily: "Poppins, sans-serif",
        fontWeight: 500,
        fontSize: 16,
      },
      h6: {
        fontFamily: "Poppins, sans-serif",
        fontWeight: 500,
        fontSize: 14,
      },
      body1: {
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 400,
        fontSize: 14,
      },
      body2: {
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 400,
        fontSize: 12,
      },
    },
    components: {
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              color: '#ccc',
              backgroundColor: 'transparent',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            // For menus/popovers, set background and text color
            backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
            color: theme.palette.mode === 'light' ? '#222' : theme.palette.text.primary,
          }),
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            color: "#fff",
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: "#222", // dark background
            color: "#fff",           // white text
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          },
          listbox: {
            backgroundColor: "#222",
            color: "#fff",
            padding: 0,
          },
          option: {
            color: "#fff",
            backgroundColor: "transparent",
            "&[aria-selected='true']": {
              backgroundColor: "#3322FF", // your primary color
              color: "#fff",
            },
            "&.Mui-focused": {
              backgroundColor: "#282828", // sidebar bg or a slightly lighter shade
              color: "#fff",
            },
          },
          popupIndicator: {
            color: "#222",
          },
          clearIndicator: {
            backgroundColor: "#3322FF", // Example: gold, change as needed
            borderRadius: "50%",        // Makes it circular
            padding: "4px",             // Optional: space around the icon
            transition: "background 0.2s",
            "&:hover": {
              backgroundColor: "#FFA500", // Example: orange on hover
            },
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            color: "inherit", // Let icon inherit color from parent
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: "#222",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: "18px",
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              color: '#888', // Text color for disabled input
              backgroundColor: '#f5f5f5', // Background color for disabled input
              WebkitTextFillColor: '#888', // For webkit browsers
            },
          },
          input: {
            '&.Mui-disabled': {
              color: '#888',
              WebkitTextFillColor: '#888',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            maxWidth: 850, // or your preferred width
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
          },
          label: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            maxWidth: 850, // slightly less than root to account for the delete icon
          },
        },
      },
    },
  };
};

// Context For Color Mode
export const ColorModeContext = createContext({
  toggleColorMode: () => { },
});

export const useMode = () => {
  const [mode, setMode] = useState("dark");

  const colorMode = useMemo(() => ({
    toggleColorMode: () =>
      setMode((prev) => (prev === "light" ? "dark" : "light")),
  }), []);

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return [theme, colorMode];
};
