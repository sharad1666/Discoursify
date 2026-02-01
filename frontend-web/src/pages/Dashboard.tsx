import { Box, Grid, Paper, Typography, Chip, CircularProgress } from '@mui/material';
import { Users, Calendar, Video, ArrowRight, Award, Target, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserStats } from '../hooks/useUserStats';

const StatCard = ({ title, value, subtext, icon, color }: any) => {
    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography color="text.secondary" variant="body2" fontWeight={600}>{title}</Typography>
                <Box sx={{ color: color }}>{icon}</Box>
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: 'text.primary' }}>{value}</Typography>
            {subtext && <Chip label={subtext} size="small" sx={{ bgcolor: `${color}25`, color: color, fontWeight: 600, borderRadius: 1 }} />}
        </Paper>
    )
};

const ActionCard = ({ title, desc, icon, color, onClick }: any) => (
    <Paper
        elevation={0}
        onClick={onClick}
        sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.05)', borderColor: color }
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${color}25`, color: color }}>
                {icon}
            </Box>
            <ArrowRight size={20} color="gray" />
        </Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">{title}</Typography>
        <Typography variant="body2" color="text.secondary">{desc}</Typography>
    </Paper>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { userEmail, userName } = useAuth();

    try {
        const { stats, loading, error } = useUserStats();

        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="error" variant="h6">Failed to load dashboard data</Typography>
                    <Typography color="text.secondary">{error}</Typography>
                </Box>
            );
        }

        // Default stats if no data yet
        const safeStats = stats || {
            participationScore: 0,
            reportsCount: 0,
            meetingsJoined: 0,
            improvement: '0',
            skills: [],
            recentSessions: []
        };

        return (
            <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Welcome back, {userName || 'User'}! 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Ready to improve your group discussion skills today?
                    </Typography>
                </Box>

                {/* Stats Overview */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Meetings Joined"
                            value={safeStats.meetingsJoined}
                            subtext="Total"
                            icon={<Video size={24} />}
                            color="#3b82f6"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Avg Score"
                            value={`${safeStats.participationScore}%`}
                            subtext="Overall"
                            icon={<Target size={24} />}
                            color="#10b981"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Clarity Score"
                            value={`${safeStats.skills?.find(s => s.subject === 'Communication')?.A || 0}%`}
                            subtext="Communication"
                            icon={<Award size={24} />}
                            color="#8b5cf6"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Listening Score"
                            value={`${safeStats.skills?.find(s => s.subject === 'Listening')?.A || 0}%`}
                            subtext="Engagement"
                            icon={<Users size={24} />}
                            color="#f59e0b"
                        />
                    </Grid>
                </Grid>

                {/* Main Content Grid */}
                <Grid container spacing={4}>
                    {/* Left Column */}
                    <Grid item xs={12} md={8}>
                        {/* Progress Chart */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Progress Over Time</Typography>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: 350, border: '1px solid', borderColor: 'divider' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={safeStats.history && safeStats.history.length > 0 ? safeStats.history : []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Box>

                        {/* Recent Sessions List */}
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Recent Performance</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {safeStats.recentSessions && safeStats.recentSessions.length > 0 ? (
                                    safeStats.recentSessions.map((session, index) => (
                                        <Paper key={index} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 2, color: 'primary.main' }}>
                                                    <Calendar size={20} />
                                                </Box>
                                                <Box>
                                                    <Typography fontWeight="600" variant="subtitle1">{session.raw?.topic || `Session ${index + 1}`}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                                        <Typography variant="caption" color="text.secondary">{session.date}</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                                                    <Typography variant="h6" fontWeight="bold" color="primary">{session.score}</Typography>
                                                    <Typography variant="caption" color="text.secondary">Score</Typography>
                                                </Box>
                                                <Chip
                                                    label={session.score > 70 ? 'Excellent' : 'Good'}
                                                    color={session.score > 70 ? 'success' : 'warning'}
                                                    size="small"
                                                    sx={{ borderRadius: 1 }}
                                                />
                                            </Box>
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography color="text.secondary" align="center">No recent sessions found.</Typography>
                                )}
                            </Box>
                        </Box>
                    </Grid>

                    {/* Right Column: Quick Actions */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Quick Actions</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <ActionCard
                                    title="Join Public Session"
                                    desc="Jump into an ongoing discussion"
                                    icon={<Users size={24} />}
                                    color="#2563eb"
                                    onClick={() => navigate('/join')}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <ActionCard
                                    title="Schedule Session"
                                    desc="Plan your next discussion"
                                    icon={<Calendar size={24} />}
                                    color="#059669"
                                    onClick={() => navigate('/create-session')}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <ActionCard
                                    title="View Recordings"
                                    desc="Review past sessions with AI"
                                    icon={<Video size={24} />}
                                    color="#7c3aed"
                                    onClick={() => navigate('/reports')}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <ActionCard
                                    title="Knowledge Hub"
                                    desc="Read latest articles and tips"
                                    icon={<BookOpen size={24} />}
                                    color="#d97706"
                                    onClick={() => navigate('/content')}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        );

    } catch (err: any) {
        console.error('Critical Dashboard Error:', err);
        return (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fee2e2', m: 2, borderRadius: 2 }}>
                <Typography color="error" variant="h6">Something went wrong!</Typography>
                <Typography color="error" variant="body2">{err.toString()}</Typography>
                <Typography variant="caption">Check console for details.</Typography>
            </Box>
        );
    }
};

export default Dashboard;
