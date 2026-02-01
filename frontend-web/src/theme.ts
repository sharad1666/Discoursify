import { createTheme, type ThemeOptions } from '@mui/material/styles';

const typography = {
    fontFamily: "'Outfit', 'Inter', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
};

const components = {
    MuiButton: {
        styleOverrides: {
            root: { borderRadius: 8 },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: { backgroundImage: 'none' },
        },
    },
};

export const getTheme = (mode: 'light' | 'dark') => createTheme({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // Light Mode
                primary: {
                    main: '#2563eb', // Blue 600
                    light: '#60a5fa', // Blue 400
                    dark: '#1d4ed8', // Blue 700
                },
                background: {
                    default: '#f8fafc', // Slate 50
                    paper: '#ffffff', // White
                },
                text: {
                    primary: '#0f172a', // Slate 900
                    secondary: '#64748b', // Slate 500
                },
                divider: '#e2e8f0', // Slate 200
            }
            : {
                // Dark Mode
                primary: {
                    main: '#60a5fa', // Blue 400
                    light: '#93c5fd', // Blue 300
                    dark: '#2563eb', // Blue 600
                },
                background: {
                    default: '#0f172a', // Slate 900
                    paper: '#1e293b', // Slate 800
                },
                text: {
                    primary: '#f8fafc', // Slate 50
                    secondary: '#94a3b8', // Slate 400
                },
                divider: '#334155', // Slate 700
            }),
    },
    typography,
    components: {
        ...components,
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
                    borderRight: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
                    color: mode === 'light' ? '#0f172a' : '#f8fafc',
                }
            }
        }
    }
} as ThemeOptions);
