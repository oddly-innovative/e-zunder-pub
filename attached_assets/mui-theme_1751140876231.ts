# Material UI Theme Configuration - apps/frontend/src/theme/muiTheme.ts

```typescript
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';

// Brand colors matching Chakra UI theme
const brandColors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  secondary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#9C27B0',
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },
  accent: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

// Base theme configuration
const baseTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primary[500],
      light: brandColors.primary[300],
      dark: brandColors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.secondary[500],
      light: brandColors.secondary[300],
      dark: brandColors.secondary[700],
      contrastText: '#ffffff',
    },
    error: {
      main: '#F44336',
      light: '#EF5350',
      dark: '#C62828',
      contrastText: '#ffffff',
    },
    warning: {
      main: brandColors.accent[500],
      light: brandColors.accent[300],
      dark: brandColors.accent[700],
      contrastText: '#ffffff',
    },
    info: {
      main: '#2196F3',
      light: '#42A5F5',
      dark: '#1565C0',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4CAF50',
      light: '#66BB6A',
      dark: '#2E7D32',
      contrastText: '#ffffff',
    },
    grey: brandColors.gray,
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: brandColors.gray[800],
      secondary: brandColors.gray[600],
      disabled: brandColors.gray[400],
    },
    divider: brandColors.gray[200],
    action: {
      active: brandColors.gray[600],
      hover: brandColors.gray[100],
      selected: brandColors.gray[200],
      disabled: brandColors.gray[300],
      disabledBackground: brandColors.gray[100],
    },
  },
  
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
      color: brandColors.gray[600],
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  
  shape: {
    borderRadius: 8,
  },
  
  spacing: 8,
  
  breakpoints: {
    values: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 992,
      xl: 1280,
    },
  },
  
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    ...Array(19).fill('0px 25px 50px rgba(0, 0, 0, 0.25)'),
  ],
  
  zIndex: {
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};

// Component customizations
const componentOverrides: ThemeOptions = {
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Prevent conflicts with Chakra UI
          fontFamily: 'inherit',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: brandColors.gray[100],
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: brandColors.gray[400],
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: brandColors.gray[500],
            },
          },
        },
      },
    },
    
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.75rem',
        },
      },
    },
    
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease-in-out',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.gray[400],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.primary[500],
              borderWidth: '2px',
            },
            '&.Mui-error .MuiOutlinedInput-notchedOutline': {
              borderColor: '#F44336',
            },
          },
          '& .MuiInputLabel-root': {
            color: brandColors.gray[600],
            '&.Mui-focused': {
              color: brandColors.primary[500],
            },
            '&.Mui-error': {
              color: '#F44336',
            },
          },
        },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${brandColors.gray[200]}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
          boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: brandColors.gray[800],
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
          borderBottom: `1px solid ${brandColors.gray[200]}`,
        },
      },
    },
    
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: `1px solid ${brandColors.gray[200]}`,
        },
      },
    },
    
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: '48px',
          '&.Mui-selected': {
            color: brandColors.primary[600],
            fontWeight: 600,
          },
        },
      },
    },
    
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: brandColors.primary[500],
          height: '3px',
          borderRadius: '2px',
        },
      },
    },
    
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '8px',
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
          border: `1px solid ${brandColors.gray[200]}`,
          marginTop: '4px',
        },
      },
    },
    
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          padding: '8px 16px',
          '&:hover': {
            backgroundColor: brandColors.gray[50],
          },
          '&.Mui-selected': {
            backgroundColor: brandColors.primary[50],
            color: brandColors.primary[700],
            '&:hover': {
              backgroundColor: brandColors.primary[100],
            },
          },
        },
      },
    },
    
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brandColors.gray[800],
          color: '#ffffff',
          borderRadius: '6px',
          fontSize: '0.75rem',
          padding: '8px 12px',
        },
        arrow: {
          color: brandColors.gray[800],
        },
      },
    },
    
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: '#F0F9F4',
          color: '#1B4B3A',
          border: '1px solid #A7F3D0',
        },
        standardError: {
          backgroundColor: '#FEF2F2',
          color: '#7F1D1D',
          border: '1px solid #FECACA',
        },
        standardWarning: {
          backgroundColor: '#FFFBEB',
          color: '#78350F',
          border: '1px solid #FDE68A',
        },
        standardInfo: {
          backgroundColor: '#EFF6FF',
          color: '#1E3A8A',
          border: '1px solid #BFDBFE',
        },
      },
    },
    
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          backgroundColor: brandColors.gray[200],
        },
        bar: {
          borderRadius: '4px',
        },
      },
    },
    
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: '52px',
          height: '32px',
          padding: '8px',
        },
        switchBase: {
          margin: '2px',
          padding: '2px',
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            '& + .MuiSwitch-track': {
              backgroundColor: brandColors.primary[500],
              opacity: 1,
            },
          },
        },
        thumb: {
          width: '20px',
          height: '20px',
          backgroundColor: '#ffffff',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
        },
        track: {
          borderRadius: '16px',
          backgroundColor: brandColors.gray[300],
          opacity: 1,
        },
      },
    },
  },
};

// Dark theme overrides
const darkThemeOverrides: ThemeOptions = {
  palette: {
    mode: 'dark',
    background: {
      default: '#0F0F0F',
      paper: '#1A1A1A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      disabled: '#666666',
    },
    divider: '#333333',
    action: {
      active: '#FFFFFF',
      hover: '#2A2A2A',
      selected: '#333333',
      disabled: '#666666',
      disabledBackground: '#2A2A2A',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
          color: '#FFFFFF',
          borderBottom: '1px solid #333333',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1A1A1A',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#333333',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#666666',
            },
          },
        },
      },
    },
  },
};

// Create the base theme
const lightTheme = createTheme(deepmerge(baseTheme, componentOverrides));
const darkTheme = createTheme(deepmerge(deepmerge(baseTheme, componentOverrides), darkThemeOverrides));

// Export the default light theme
export const ezunderMuiTheme = lightTheme;

// Export both themes for dynamic switching if needed
export const ezunderMuiThemes = {
  light: lightTheme,
  dark: darkTheme,
};

// Custom theme hook for dynamic theme switching
export const createEzunderTheme = (mode: 'light' | 'dark') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
```