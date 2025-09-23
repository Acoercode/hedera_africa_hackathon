import { createTheme } from "@mui/material";

export const theme = createTheme({
  typography: {
    fontFamily: '"Styrene A Web", "Helvetica Neue", Sans-Serif',
  },
  palette: {
    mode: "light",
    background: {
      default: "#F5F5FC", // App background off white
      paper: "#FFFFFF", // Top bar, paper/sections background
    },
    primary: {
      main: "#3F37C9", // Primary accent blue/purple
      light: "#6B63D9",
      dark: "#2A2480",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#37C9A4", // Green (success, connected, etc)
      light: "#5DD4B8",
      dark: "#2A9D7A",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#C93739", // Red (error, offline, etc)
      light: "#D65A5C",
      dark: "#A02D2F",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FDAA2B", // Orange (alert, pending, etc)
      light: "#FDBB55",
      dark: "#E6951A",
      contrastText: "#FFFFFF",
    },
    text: {
      primary: "#0E1F49", // All text on light background
      secondary: "#868899", // Grey
    },
    grey: {
      50: "#F5F5FC",
      100: "#E8E8F0",
      200: "#D1D1E0",
      300: "#BABACF",
      400: "#A3A3BE",
      500: "#868899",
      600: "#6B6B7A",
      700: "#50505B",
      800: "#35353C",
      900: "#1A1A1D",
    },
    success: {
      main: "#37C9A4",
      light: "#5DD4B8",
      dark: "#2A9D7A",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#3F37C9",
      light: "#6B63D9",
      dark: "#2A2480",
      contrastText: "#FFFFFF",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#0E1F49",
          boxShadow: "0 2px 4px rgba(14, 31, 73, 0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#0E1F49",
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#0E1F49",
          borderTop: "1px solid #E8E8F0",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#0E1F49",
          boxShadow: "0 2px 8px rgba(14, 31, 73, 0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
        contained: {
          backgroundColor: "#3F37C9",
          color: "#FFFFFF",
          "&:hover": {
            backgroundColor: "#2A2480",
          },
        },
        outlined: {
          borderColor: "#3F37C9",
          color: "#3F37C9",
          "&:hover": {
            backgroundColor: "#F5F5FC",
            borderColor: "#2A2480",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        colorSuccess: {
          backgroundColor: "#37C9A4",
          color: "#FFFFFF",
        },
        colorError: {
          backgroundColor: "#C93739",
          color: "#FFFFFF",
        },
        colorWarning: {
          backgroundColor: "#FDAA2B",
          color: "#FFFFFF",
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": {
            color: "#37C9A4",
            "& + .MuiSwitch-track": {
              backgroundColor: "#37C9A4",
            },
          },
        },
      },
    },
  },
});
