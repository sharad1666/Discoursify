import { Box, Grid, Paper, Typography, LinearProgress, Chip, Avatar, Button } from '@mui/material';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Award, TrendingUp, Target, Calendar, ArrowUpRight, Star, Activity, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserStats } from '../hooks/useUserStats';

const Performance = () => {
    const { userPhoto, userName } = useAuth();
    const { stats, loading } = useUserStats();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <LinearProgress sx={{ width: '50%' }} />
            </Box>
        );
    }

    // Default empty stats if null
    const safeStats = stats || {
        participationScore: 0,
        reportsCount: 0,
        meetingsJoined: 0,
        improvement: '0',
        skills: [],
        history: [],
        strengths: [],
        weaknesses: [],
        recentSessions: []
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                    src={userPhoto || undefined}
                    sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}
                >
                    {userName?.charAt(0)}
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                        Performance Overview
                    </Typography>
                    <Typography color="text.secondary">
                        Track your growth and master your communication skills
                    </Typography>
                </Box>
            </Box>

            {/* Key Metrics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.main' }}>
                                <Award size={24} />
                            </Box>
                            <Chip label="Overall" size="small" color="primary" />
                        </Box>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: '#1e3a8a' }}>
                            {safeStats.participationScore}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Average Score / 100
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 2, color: 'success.main' }}>
                                <TrendingUp size={24} />
                            </Box>
                            <Chip
                                label={Number(safeStats.improvement) >= 0 ? "Improving" : "Needs Focus"}
                                size="small"
                                color={Number(safeStats.improvement) >= 0 ? "success" : "warning"}
                            />
                        </Box>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: '#064e3b' }}>
                            {Number(safeStats.improvement) > 0 ? '+' : ''}{safeStats.improvement}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Growth since first session
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ p: 1, bgcolor: '#ede9fe', borderRadius: 2, color: '#7c3aed' }}>
                                <Activity size={24} />
                            </Box>
                        </Box>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: '#4c1d95' }}>
                            {safeStats.reportsCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Total Sessions Analyzed
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ p: 1, bgcolor: '#ffedd5', borderRadius: 2, color: '#c2410c' }}>
                                <Brain size={24} />
                            </Box>
                        </Box>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: '#7c2d12' }}>
                            Top 10%
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Estimated Percentile
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={4}>
                {/* Charts Section */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight="bold">Performance Trend</Typography>
                            <Chip label="Last 10 Sessions" size="small" variant="outlined" />
                        </Box>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={safeStats.history}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Star size={20} className="text-yellow-500" /> Key Strengths
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {safeStats.strengths.map((strength: string, index: number) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16a34a' }} />
                                            <Typography variant="body2" fontWeight={500} color="#166534">
                                                {strength}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Target size={20} className="text-red-500" /> Areas for Focus
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {safeStats.weaknesses.map((weakness: string, index: number) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#fef2f2', borderRadius: 2 }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#dc2626' }} />
                                            <Typography variant="body2" fontWeight={500} color="#991b1b">
                                                {weakness}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4, height: 400 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Skills Radar</Typography>
                        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={safeStats.skills}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="My Skills"
                                        dataKey="A"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        fill="#8b5cf6"
                                        fillOpacity={0.5}
                                    />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight="bold">Recent Sessions</Typography>
                            <Button size="small" endIcon={<ArrowUpRight size={16} />}>View All</Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {safeStats.history.slice().reverse().slice(0, 3).map((session: any, index: number) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 3, bgcolor: 'action.hover', transition: 'all 0.2s', '&:hover': { bgcolor: 'action.selected' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                            <Calendar size={18} />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                Session #{session.id.substring(0, 4)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {session.date}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Chip
                                        label={`${session.score}%`}
                                        size="small"
                                        color={session.score >= 80 ? 'success' : session.score >= 60 ? 'warning' : 'error'}
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </Box>
                            ))}
                            {(!safeStats.history || safeStats.history.length === 0) && (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                                    No sessions yet. Start practicing!
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Performance;
