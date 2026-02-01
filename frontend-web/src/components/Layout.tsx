import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, IconButton, AppBar, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { LayoutDashboard, Video, Users, FileText, BarChart2, BookOpen, Settings, LogOut, Menu as MenuIcon, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { useState } from 'react';

const drawerWidth = 260;

const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { text: 'Join Session', icon: <Users size={20} />, path: '/join' },
    { text: 'Create Session', icon: <Video size={20} />, path: '/create-session' },
    { text: 'Reports', icon: <FileText size={20} />, path: '/reports' },
    { text: 'Performance', icon: <BarChart2 size={20} />, path: '/performance' },
    { text: 'Knowledge Hub', icon: <BookOpen size={20} />, path: '/content' },
];

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userEmail, userRole, logout } = useAuth();
    const theme = useTheme(); // MUI Theme
    const { mode, toggleTheme } = useThemeContext(); // Custom Context
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = userRole === 'ADMIN';

    const drawerContent = (
        <>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, color: 'white', display: 'flex' }}>
                    <Users size={24} />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>Discoursify</Typography>
                    <Typography variant="caption" color="text.secondary">AI-Powered Platform</Typography>
                </Box>
            </Box>

            <Box sx={{ px: 2, py: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}>
                    NAVIGATION
                </Typography>
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                onClick={() => isMobile && setMobileOpen(false)}
                                selected={location.pathname === item.path}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.5,
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText', // Correct reading of contrast
                                        '&:hover': { bgcolor: 'primary.light' },
                                        '& .MuiListItemIcon-root': { color: 'inherit' }, // Use inherit
                                    },
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? 'inherit' : 'text.secondary' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: location.pathname === item.path ? 600 : 500 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}

                    {isAdmin && (
                        <ListItem disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={Link}
                                to="/admin"
                                onClick={() => isMobile && setMobileOpen(false)}
                                selected={location.pathname === '/admin'}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.5,
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText',
                                        '&:hover': { bgcolor: 'primary.light' },
                                        '& .MuiListItemIcon-root': { color: 'inherit' },
                                    },
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === '/admin' ? 'inherit' : 'text.secondary' }}>
                                    <Settings size={20} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Admin Panel"
                                    primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: location.pathname === '/admin' ? 600 : 500 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    )}
                </List>
            </Box>

            <Box sx={{ mt: 'auto', p: 2 }}>
                {/* Theme Toggle in Drawer Footer */}
                <Box sx={{ mb: 2, px: 1 }}>
                    <ListItemButton onClick={toggleTheme} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', justifyContent: 'center' }}>
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </ListItemIcon>
                        <ListItemText primary={mode === 'dark' ? "Light Mode" : "Dark Mode"} />
                    </ListItemButton>
                </Box>

                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'grey.500' }}>{userEmail?.[0]?.toUpperCase() || 'U'}</Avatar>
                        <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>{userEmail || 'User'}</Typography>
                            <Typography variant="caption" color="text.secondary">{isAdmin ? 'admin' : 'user'}</Typography>
                        </Box>
                    </Box>
                    <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            <LogOut size={18} />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </Box>
            </Box>
        </>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            {/* Mobile AppBar */}
            {isMobile && (
                <AppBar
                    position="fixed"
                    elevation={0}
                    sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        backgroundImage: 'none'
                        // bgcolor automatically handled by theme
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon size={24} />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ p: 0.5, bgcolor: 'primary.main', borderRadius: 1, color: 'white', display: 'flex' }}>
                                <Users size={20} />
                            </Box>
                            <Typography variant="h6" fontWeight="bold">Discoursify</Typography>
                        </Box>
                    </Toolbar>
                </AppBar>
            )}

            {/* Mobile Drawer */}
            {isMobile ? (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            borderRight: 'none',
                            // bgcolor automatically handled by theme
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                /* Desktop Drawer */
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            borderRight: 'none',
                            // bgcolor automatically handled by theme
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3, md: 4 },
                    mt: { xs: 8, md: 0 },
                    overflowX: 'hidden', // Prevent horizontal scroll
                    width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
