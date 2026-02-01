import { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Paper, Grid, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody, Chip, LinearProgress, TableContainer, Card, IconButton, Alert, Snackbar, Switch, FormControlLabel, TablePagination } from '@mui/material';
import { Settings as SettingsIcon, Server, Users, CheckCircle, Activity, Database, Zap, UserPlus, RefreshCw, Clock, AlertCircle, Ban, Trash2, Download, Power, Shield, Terminal, Video, BarChart2 } from 'lucide-react';
import * as adminApi from '../services/adminApi';

const AdminPanel = () => {
    const [tabValue, setTabValue] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });

    // Data states
    const [systemStats, setSystemStats] = useState<any>(null);
    const [serviceHealth, setServiceHealth] = useState<any>(null);
    const [systemHealth, setSystemHealth] = useState<any>(null);

    // User Management
    const [users, setUsers] = useState<any[]>([]);
    const [userPage, setUserPage] = useState(0);
    const [userRowsPerPage, setUserRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);

    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: 'password123', role: 'USER' });

    // Load Overview Data
    const loadOverview = async () => {
        try {
            const [stats, health] = await Promise.all([
                adminApi.getSystemStats(),
                adminApi.getSystemHealth()
            ]);
            setSystemStats(stats);
            setSystemHealth(health);
        } catch (error) {
            console.error('Error loading overview:', error);
        }
    };

    const loadServices = async () => {
        try {
            const services = await adminApi.getServiceHealth();
            setServiceHealth(services);
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await adminApi.getAllUsers(userPage, userRowsPerPage);
            setUsers(data?.users || data?.data || (Array.isArray(data) ? data : [])); // Handle different potential response structures
            setTotalUsers(data?.total || 100);
        } catch (error) {
            console.error('Error loading users:', error);
            showSnackbar('Failed to load users', 'error');
        }
    };

    const loadSessions = async () => {
        try {
            const sessions = await adminApi.getActiveSessions();
            setActiveSessions(sessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    const loadAnalytics = async () => {
        try {
            const data = await adminApi.getAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    };

    const loadLogs = async () => {
        try {
            const logData = await adminApi.getSystemLogs();
            setLogs(logData);
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    };

    // Load data based on active tab
    const loadCurrentTabData = async () => {
        setLoading(true);
        try {
            switch (tabValue) {
                case 0: await loadOverview(); break;
                case 1: await loadServices(); break;
                case 2: await loadUsers(); break;
                case 3: await loadSessions(); break;
                case 4: await loadAnalytics(); break;
                case 5: await loadLogs(); break;
                default: break;
            }
        } catch (error) {
            showSnackbar('Error refreshing data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCurrentTabData();

        // Auto-refresh logic
        let interval: any;
        if (autoRefresh) {
            interval = setInterval(loadCurrentTabData, 30000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [tabValue, autoRefresh, userPage, userRowsPerPage]); // Add pagination deps

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleBanUser = async (userId: number, currentStatus: boolean) => {
        try {
            await adminApi.toggleUserBan(userId, !currentStatus);
            showSnackbar(`User ${!currentStatus ? 'banned' : 'unbanned'} successfully`);
            loadUsers();
        } catch (error) {
            showSnackbar('Error updating user status', 'error');
        }
    };

    const handleUpdateRole = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            await adminApi.updateUserRole(userId, newRole);
            showSnackbar(`User role updated to ${newRole} successfully`);
            loadUsers();
        } catch (error) {
            showSnackbar('Error updating user role', 'error');
        }
    };

    const handleAddUser = async () => {
        try {
            await adminApi.createUser(newUser);
            showSnackbar('User created successfully');
            setAddUserOpen(false);
            setNewUser({ name: '', email: '', password: 'password123', role: 'USER' });
            loadUsers();
        } catch (error) {
            showSnackbar('Error creating user', 'error');
        }
    };

    const handleEndSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to force end this session?')) return;

        try {
            await adminApi.forceEndSession(sessionId);
            showSnackbar('Session ended successfully');
            loadSessions();
        } catch (error) {
            showSnackbar('Error ending session', 'error');
        }
    };

    const handleSystemAction = async (action: string) => {
        if (!confirm(`Are you sure you want to perform: ${action}? This will be logged.`)) return;

        showSnackbar(`Initiating ${action}...`, 'info');
        try {
            await adminApi.executeSystemAction(action);
            showSnackbar(`${action} completed successfully`, 'success');
            // Refresh logs to show the new action
            if (tabValue === 5) loadLogs();
        } catch (error) {
            showSnackbar(`Failed to execute ${action}`, 'error');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'healthy': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Shield size={32} className="text-blue-600" /> Admin Console
                    </Typography>
                    <Typography color="text.secondary">
                        System monitoring, user management, and operational controls
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshCw size={18} />}
                        onClick={loadCurrentTabData}
                        disabled={loading}
                        sx={{ borderRadius: 2 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant={autoRefresh ? 'contained' : 'outlined'}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        sx={{ borderRadius: 2 }}
                    >
                        Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<SettingsIcon size={18} />}
                        onClick={() => setSettingsOpen(true)}
                        sx={{ borderRadius: 2 }}
                    >
                        Settings
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

            {/* Tabs */}
            <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        px: 2,
                        '& .MuiTab-root': { minHeight: 60, fontWeight: 600 }
                    }}
                >
                    <Tab icon={<Activity size={18} />} iconPosition="start" label="Overview" />
                    <Tab icon={<Server size={18} />} iconPosition="start" label="Service Health" />
                    <Tab icon={<Users size={18} />} iconPosition="start" label="User Management" />
                    <Tab icon={<Video size={18} />} iconPosition="start" label="Active Sessions" />
                    <Tab icon={<BarChart2 size={18} />} iconPosition="start" label="Analytics" />
                    <Tab icon={<Terminal size={18} />} iconPosition="start" label="System Logs" />
                    <Tab icon={<Power size={18} />} iconPosition="start" label="System Control" />
                </Tabs>
            </Paper>

            {/* Tab 0: Overview */}
            {tabValue === 0 && systemStats && (
                <>
                    {/* Quick Stats */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', p: 3, bgcolor: 'background.paper' }}>
                                <Users size={32} color="#3b82f6" />
                                <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, color: 'text.primary' }}>{systemStats.totalUsers?.toLocaleString() || '0'}</Typography>
                                <Typography variant="body2" color="text.secondary">Total Users</Typography>
                                <Chip label={`${systemStats.activeUsers || 0} active`} size="small" color="success" sx={{ mt: 1 }} />
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', p: 3, bgcolor: 'background.paper' }}>
                                <Activity size={32} color="#10b981" />
                                <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, color: 'text.primary' }}>{systemStats.activeSessions || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">Active Sessions</Typography>
                                <Chip label="Live Now" size="small" color="error" sx={{ mt: 1 }} />
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', p: 3, bgcolor: 'background.paper' }}>
                                <Database size={32} color="#8b5cf6" />
                                <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, color: 'text.primary' }}>{systemStats.totalSessions?.toLocaleString() || '0'}</Typography>
                                <Typography variant="body2" color="text.secondary">Total Sessions</Typography>
                                <Chip label={`Avg: ${systemStats.avgSessionDuration || '0 min'}`} size="small" sx={{ mt: 1 }} />
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', p: 3, bgcolor: 'background.paper' }}>
                                <Zap size={32} color="#f59e0b" />
                                <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, color: 'text.primary' }}>{systemStats.uptime || '0%'}</Typography>
                                <Typography variant="body2" color="text.secondary">System Uptime</Typography>
                                <Chip label="Operational" size="small" color="success" sx={{ mt: 1 }} />
                            </Card>
                        </Grid>
                    </Grid>

                    {/* System Health */}
                    {systemHealth && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                        <Server size={24} color="#666" />
                                        <Typography variant="h6" fontWeight="bold">System Resources</Typography>
                                    </Box>
                                    <Grid container spacing={3}>
                                        {Object.entries(systemHealth).map(([key, value]: [string, any]) => (
                                            <Grid item xs={12} sm={6} key={key}>
                                                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{key}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{value}%</Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={value}
                                                    color={value > 80 ? 'error' : value > 60 ? 'warning' : 'primary'}
                                                    sx={{ height: 8, borderRadius: 4 }}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'background.paper' }}>
                                    <CheckCircle size={48} color="#16a34a" />
                                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 2, color: 'success.main' }}>All Systems Operational</Typography>
                                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>Last check: Just now</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </>
            )}

            {/* Tab 1: Service Health */}
            {tabValue === 1 && serviceHealth && (
                <Grid container spacing={3}>
                    {Object.entries(serviceHealth).map(([service, data]: [string, any]) => (
                        <Grid item xs={12} sm={6} md={3} key={service}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>{service}</Typography>
                                    <Chip
                                        label={data.status}
                                        size="small"
                                        color={getStatusColor(data.status)}
                                        icon={data.status === 'healthy' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Clock size={16} color="#666" />
                                    <Typography variant="body2" color="text.secondary">
                                        Response: {data.responseTime}ms
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    Last check: {new Date(data.lastCheck).toLocaleTimeString()}
                                </Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Tab 2: User Management */}
            {tabValue === 2 && (
                <>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h6" fontWeight="bold">User Management ({totalUsers} users)</Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="outlined" startIcon={<Download size={18} />} onClick={() => adminApi.exportData('users')}>
                                Export CSV
                            </Button>
                            <Button variant="contained" startIcon={<UserPlus size={18} />} sx={{ borderRadius: 2 }} onClick={() => setAddUserOpen(true)}>
                                Add User
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Joined</TableCell>
                                    <TableCell>Sessions</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.joined}</TableCell>
                                        <TableCell>{user.sessionsCount || 0}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.status}
                                                size="small"
                                                color={user.status === 'active' ? 'success' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role || 'USER'}
                                                size="small"
                                                color={user.role === 'ADMIN' ? 'primary' : 'default'}
                                                variant="filled"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                color={user.role === 'ADMIN' ? 'warning' : 'primary'}
                                                onClick={() => handleUpdateRole(user.id, user.role || 'USER')}
                                                title={user.role === 'ADMIN' ? "Remove Admin" : "Make Admin"}
                                            >
                                                <Shield size={18} fill={user.role === 'ADMIN' ? "currentColor" : "none"} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleBanUser(user.id, user.status === 'banned')}
                                            >
                                                <Ban size={18} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={totalUsers}
                            rowsPerPage={userRowsPerPage}
                            page={userPage}
                            onPageChange={(_, p) => setUserPage(p)}
                            onRowsPerPageChange={(e) => {
                                setUserRowsPerPage(parseInt(e.target.value, 10));
                                setUserPage(0);
                            }}
                        />
                    </TableContainer>
                </>
            )}

            {/* Tab 3: Active Sessions */}
            {tabValue === 3 && (
                <>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Active Sessions Monitor ({activeSessions.length})</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell>Session ID</TableCell>
                                    <TableCell>Topic</TableCell>
                                    <TableCell>Host</TableCell>
                                    <TableCell>Participants</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activeSessions.map((session) => (
                                    <TableRow key={session.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{session.id}</TableCell>
                                        <TableCell>{session.topic}</TableCell>
                                        <TableCell>{session.host}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Users size={16} color="#666" />
                                                {Array.isArray(session.participants) ? session.participants.length : session.participants || 0}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{session.duration}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={session.status}
                                                size="small"
                                                color={session.status === 'Live' ? 'error' : 'warning'}
                                                variant="outlined"
                                                icon={<Activity size={14} />}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleEndSession(session.id)}
                                            >
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Tab 4: Analytics */}
            {tabValue === 4 && analytics && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Session Trends (Last 7 Days)</Typography>
                            <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                                {analytics.sessionTrends?.map((day: any, index: number) => (
                                    <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ mb: 1 }}>{day.count}</Typography>
                                        <Box
                                            sx={{
                                                width: '100%',
                                                height: `${(day.count / 70) * 100}%`,
                                                bgcolor: 'primary.main',
                                                borderRadius: 1,
                                                minHeight: 20
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Top Topics</Typography>
                            {analytics.topTopics?.map((topic: any, index: number) => (
                                <Box key={index} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">{topic.topic}</Typography>
                                        <Typography variant="body2" color="text.secondary">{topic.count}</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(topic.count / 250) * 100}
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            ))}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>User Growth</Typography>
                            <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                {analytics.userGrowth?.map((day: any, index: number) => (
                                    <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                width: '100%',
                                                height: `${((day.count - 1100) / 200) * 100}%`,
                                                bgcolor: 'success.main',
                                                borderRadius: 1,
                                                minHeight: 10
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>{analytics.userGrowth?.[analytics.userGrowth.length - 1]?.count.toLocaleString()}</Typography>
                            <Typography variant="body2" color="text.secondary">Total Users</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Tab 5: System Logs */}
            {tabValue === 5 && (
                <>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h6" fontWeight="bold">System Logs</Typography>
                        <Button variant="outlined" startIcon={<Download size={18} />} sx={{ borderRadius: 2 }}>
                            Export Logs
                        </Button>
                    </Box>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: '#1e1e1e', color: '#d4d4d4', p: 2, borderRadius: 2, maxHeight: 500, overflow: 'auto' }}>
                            {logs.map((log, index) => (
                                <Box key={index} sx={{
                                    mb: 1,
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    gap: { xs: 0.5, md: 2 },
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    pb: 1,
                                    '&:last-child': { borderBottom: 'none' }
                                }}>
                                    <Typography component="span" sx={{ color: '#808080', minWidth: { xs: '100%', md: 170 }, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                        [{new Date(log.timestamp).toLocaleString()}]
                                    </Typography>
                                    <Typography component="span" sx={{
                                        color: log.action?.includes('FAIL') || log.action?.includes('ERROR') ? '#f87171' : '#4ade80',
                                        minWidth: { xs: '100%', md: 120 },
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem'
                                    }}>
                                        {log.action}
                                    </Typography>
                                    <Typography component="span" sx={{ flex: 1, wordBreak: 'break-word', color: '#e5e5e5' }}>
                                        {log.details}
                                    </Typography>
                                    <Typography component="span" sx={{ color: '#808080', fontSize: '0.75rem', ml: { xs: 0, md: 'auto' } }}>
                                        by {log.adminEmail?.split('@')[0] || 'System'}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </>
            )}

            {/* Tab 6: System Control */}
            {tabValue === 6 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Zap size={20} className="text-yellow-500" /> Maintenance Actions
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <Box>
                                        <Typography fontWeight={600}>Clear System Cache</Typography>
                                        <Typography variant="caption" color="text.secondary">Frees up memory and temporary files</Typography>
                                    </Box>
                                    <Button variant="outlined" color="warning" onClick={() => handleSystemAction('Cache Clear')}>Clear</Button>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <Box>
                                        <Typography fontWeight={600}>Restart WebSocket Service</Typography>
                                        <Typography variant="caption" color="text.secondary">Reconnects all active sessions</Typography>
                                    </Box>
                                    <Button variant="outlined" color="error" onClick={() => handleSystemAction('WS Restart')}>Restart</Button>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <Box>
                                        <Typography fontWeight={600}>Rotate API Keys</Typography>
                                        <Typography variant="caption" color="text.secondary">Regenerates internal service keys</Typography>
                                    </Box>
                                    <Button variant="outlined" color="info" onClick={() => handleSystemAction('Key Rotation')}>Rotate</Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SettingsIcon size={20} className="text-gray-500" /> Configuration
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControlLabel
                                    control={<Switch defaultChecked />}
                                    label="Enable Maintenance Mode"
                                />
                                <FormControlLabel
                                    control={<Switch defaultChecked />}
                                    label="Allow New User Registrations"
                                />
                                <FormControlLabel
                                    control={<Switch />}
                                    label="Debug Logging"
                                />
                                <FormControlLabel
                                    control={<Switch defaultChecked />}
                                    label="Email Notifications"
                                />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Settings Dialog */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>System Settings</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="Max Concurrent Sessions" defaultValue="100" margin="normal" type="number" />
                    <TextField fullWidth label="Session Timeout (minutes)" defaultValue="120" margin="normal" type="number" />
                    <TextField fullWidth label="Max Participants per Session" defaultValue="50" margin="normal" type="number" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => setSettingsOpen(false)}>Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* Add User Dialog */}
            <Dialog open={addUserOpen} onClose={() => setAddUserOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New User</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddUserOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddUser}>Create User</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminPanel;
