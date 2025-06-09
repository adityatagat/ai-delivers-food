import React, { useEffect, useState } from 'react';
import { IconButton, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeContextType = {
  toggleColorMode: () => void;
};

export const ColorModeContext = React.createContext<ThemeContextType>({
  toggleColorMode: () => {},
});

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedMode = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]);

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#FF4B2B' : '#FF6B4B',
          },
          secondary: {
            main: mode === 'light' ? '#2B2B2B' : '#F5F5F5',
          },
          background: {
            default: mode === 'light' ? '#F5F5F5' : '#121212',
            paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
          },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

const ThemeToggle: React.FC = () => {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);

  return (
    <Tooltip title={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton onClick={colorMode.toggleColorMode} color="inherit">
        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;



