import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string;
    };
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}

// Common typography settings
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 600,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
  },
};

// Light theme
const lightPalette = {
  mode: 'light' as const,
  primary: {
    main: '#FF4B2B',
    light: '#FF6B4B',
    dark: '#CC3B22',
  },
  secondary: {
    main: '#2B2B2B',
    light: '#4B4B4B',
    dark: '#1B1B1B',
  },
  background: {
    default: '#F5F5F5',
    paper: '#FFFFFF',
  },
};

// Dark theme
const darkPalette: ThemeOptions['palette'] = {
  mode: 'dark',
  primary: {
    main: '#FF6B4B',
    light: '#FF8C6B',
    dark: '#CC3B22',
  },
  secondary: {
    main: '#F5F5F5',
    light: '#FFFFFF',
    dark: '#E0E0E0',
  },
  background: {
    default: '#121212',
    paper: '#1E1E1E',
  },
};

const commonTheme: ThemeOptions = {
  typography, // Using the typography constant defined above
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
};

// Create theme instances
const lightTheme = createTheme({
  ...commonTheme,
  palette: lightPalette,
});

const darkTheme = createTheme({
  ...commonTheme,
  palette: darkPalette,
  components: {
    ...commonTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

// Function to get theme based on mode
const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'light' ? lightTheme : darkTheme;
};

export { lightTheme, darkTheme, getTheme };
export default getTheme('light');