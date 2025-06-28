# Combined Theme Configuration - apps/frontend/src/theme/chakraTheme.ts

```typescript
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

// Define eZunder brand colors
const brandColors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Primary brand color
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
    500: '#9C27B0', // Secondary brand color
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
    500: '#FF9800', // Accent color
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

// Typography configuration
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Fira Code", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
};

const fontSizes = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  md: '1rem',      // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
  '7xl': '4.5rem',   // 72px
  '8xl': '6rem',     // 96px
  '9xl': '8rem',     // 128px
};

// Theme configuration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
  disableTransitionOnChange: false,
};

// Global styles
const styles = {
  global: (props: any) => ({
    body: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: mode('gray.800', 'gray.100')(props),
      bg: mode('white', 'gray.900')(props),
      lineHeight: 'base',
    },
    '*::placeholder': {
      color: mode('gray.400', 'gray.600')(props),
    },
    '*, *::before, &::after': {
      borderColor: mode('gray.200', 'gray.700')(props),
      wordWrap: 'break-word',
    },
    // Ensure Material UI and Chakra UI components don't conflict
    '.MuiCssBaseline-root': {
      fontFamily: 'inherit !important',
    },
    '.MuiTypography-root': {
      fontFamily: 'inherit !important',
    },
  }),
};

// Component theme overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'md',
      _focus: {
        boxShadow: '0 0 0 3px rgba(33, 150, 243, 0.3)',
      },
    },
    variants: {
      solid: (props: any) => ({
        bg: mode(`${props.colorScheme}.500`, `${props.colorScheme}.200`)(props),
        color: mode('white', 'gray.800')(props),
        _hover: {
          bg: mode(`${props.colorScheme}.600`, `${props.colorScheme}.300`)(props),
          _disabled: {
            bg: mode(`${props.colorScheme}.500`, `${props.colorScheme}.200`)(props),
          },
        },
        _active: {
          bg: mode(`${props.colorScheme}.700`, `${props.colorScheme}.400`)(props),
        },
      }),
      outline: (props: any) => ({
        border: '2px solid',
        borderColor: mode(`${props.colorScheme}.500`, `${props.colorScheme}.200`)(props),
        color: mode(`${props.colorScheme}.500`, `${props.colorScheme}.200`)(props),
        _hover: {
          bg: mode(`${props.colorScheme}.50`, `${props.colorScheme}.900`)(props),
        },
        _active: {
          bg: mode(`${props.colorScheme}.100`, `${props.colorScheme}.800`)(props),
        },
      }),
      ghost: (props: any) => ({
        color: mode(`${props.colorScheme}.500`, `${props.colorScheme}.200`)(props),
        _hover: {
          bg: mode(`${props.colorScheme}.50`, `${props.colorScheme}.900`)(props),
        },
        _active: {
          bg: mode(`${props.colorScheme}.100`, `${props.colorScheme}.800`)(props),
        },
      }),
    },
    sizes: {
      sm: {
        h: '32px',
        minW: '32px',
        fontSize: 'sm',
        px: 3,
      },
      md: {
        h: '40px',
        minW: '40px',
        fontSize: 'md',
        px: 4,
      },
      lg: {
        h: '48px',
        minW: '48px',
        fontSize: 'lg',
        px: 6,
      },
    },
    defaultProps: {
      colorScheme: 'primary',
    },
  },
  
  Input: {
    variants: {
      outline: (props: any) => ({
        field: {
          bg: mode('white', 'gray.800')(props),
          borderColor: mode('gray.300', 'gray.600')(props),
          _hover: {
            borderColor: mode('gray.400', 'gray.500')(props),
          },
          _focus: {
            borderColor: mode('primary.500', 'primary.300')(props),
            boxShadow: `0 0 0 1px ${mode('primary.500', 'primary.300')(props)}`,
          },
          _invalid: {
            borderColor: mode('red.500', 'red.300')(props),
            boxShadow: `0 0 0 1px ${mode('red.500', 'red.300')(props)}`,
          },
        },
      }),
    },
    defaultProps: {
      variant: 'outline',
    },
  },
  
  Card: {
    baseStyle: (props: any) => ({
      container: {
        bg: mode('white', 'gray.800')(props),
        boxShadow: mode('0 1px 3px rgba(0, 0, 0, 0.1)', '0 1px 3px rgba(0, 0, 0, 0.3)')(props),
        borderRadius: 'lg',
        overflow: 'hidden',
      },
    }),
  },
  
  Modal: {
    baseStyle: (props: any) => ({
      dialog: {
        bg: mode('white', 'gray.800')(props),
        borderRadius: 'lg',
      },
      overlay: {
        bg: 'blackAlpha.600',
      },
    }),
  },
  
  Drawer: {
    baseStyle: (props: any) => ({
      dialog: {
        bg: mode('white', 'gray.800')(props),
      },
      overlay: {
        bg: 'blackAlpha.600',
      },
    }),
  },
  
  Menu: {
    baseStyle: (props: any) => ({
      list: {
        bg: mode('white', 'gray.800')(props),
        border: 'none',
        boxShadow: mode(
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
        )(props),
        borderRadius: 'md',
        py: 2,
      },
      item: {
        bg: 'transparent',
        _hover: {
          bg: mode('gray.50', 'gray.700')(props),
        },
        _focus: {
          bg: mode('gray.50', 'gray.700')(props),
        },
      },
    }),
  },
  
  Tooltip: {
    baseStyle: (props: any) => ({
      bg: mode('gray.800', 'gray.200')(props),
      color: mode('white', 'gray.800')(props),
      borderRadius: 'md',
      fontSize: 'sm',
      px: 3,
      py: 2,
    }),
  },
  
  Alert: {
    variants: {
      solid: (props: any) => ({
        container: {
          bg: mode(`${props.colorScheme}.500`, `${props.colorScheme}.200`)(props),
          color: mode('white', 'gray.800')(props),
          borderRadius: 'md',
        },
      }),
      subtle: (props: any) => ({
        container: {
          bg: mode(`${props.colorScheme}.50`, `${props.colorScheme}.900`)(props),
          borderRadius: 'md',
        },
      }),
      'left-accent': (props: any) => ({
        container: {
          bg: mode(`${props.colorScheme}.50`, `${props.colorScheme}.900`)(props),
          borderLeft: '4px solid',
          borderLeftColor: mode(`${props.colorScheme}.500`, `${props.colorScheme}.200`)(props),
          borderRadius: 'md',
        },
      }),
    },
  },
};

// Breakpoints for responsive design
const breakpoints = {
  base: '0em',    // 0px
  sm: '30em',     // 480px
  md: '48em',     // 768px
  lg: '62em',     // 992px
  xl: '80em',     // 1280px
  '2xl': '96em',  // 1536px
};

// Spacing scale
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Create the theme
export const ezunderChakraTheme = extendTheme({
  config,
  colors: {
    ...brandColors,
    brand: brandColors.primary,
  },
  fonts,
  fontSizes,
  styles,
  components,
  breakpoints,
  space,
  semanticTokens: {
    colors: {
      'chakra-body-text': {
        _light: 'gray.800',
        _dark: 'gray.100',
      },
      'chakra-body-bg': {
        _light: 'white',
        _dark: 'gray.900',
      },
      'chakra-border-color': {
        _light: 'gray.200',
        _dark: 'gray.700',
      },
      'chakra-inverse-text': {
        _light: 'white',
        _dark: 'gray.800',
      },
      'chakra-placeholder-color': {
        _light: 'gray.400',
        _dark: 'gray.600',
      },
    },
  },
});
```