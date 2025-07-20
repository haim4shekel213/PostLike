import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF6C37', // Postman orange
      dark: '#E85A2B',
      light: '#FF8A5C',
    },
    secondary: {
      main: '#2E3440',
      dark: '#1E222A',
      light: '#434C5E',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2E3440',
      secondary: '#5E81AC',
    },
    grey: {
      50: '#F8F9FA',
      100: '#E9ECEF',
      200: '#DEE2E6',
      300: '#CED4DA',
      400: '#ADB5BD',
      500: '#6C757D',
    },
    success: {
      main: '#28A745',
    },
    error: {
      main: '#DC3545',
    },
    warning: {
      main: '#FFC107',
    },
    info: {
      main: '#17A2B8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },
  },
});