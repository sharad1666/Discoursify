import { Box, Grid, Paper, Typography, Button, Chip, InputAdornment, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, CardActions, CircularProgress, Select, MenuItem } from '@mui/material';
import { Search, Calendar, Clock, Trash2, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Recordings = () => {
    const navigate = useNavigate();
    const { sessions, loading, refreshSessions } = useSession();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (refreshSessions) {
            refreshSessions();
        }
    }, []);

    const handleDelete = async () => {
        if (deleteId) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/sessions/${deleteId}`);
                setDeleteId(null);
                if (refreshSessions) {
                    refreshSessions();
                } else {
                    window.location.reload();
                }
            } catch (error) {
                console.error("Error deleting session:", error);
            }
        }
    };

    // Filter for completed sessions
    console.log("All Sessions:", sessions);
    // Show all sessions (Active and Completed) so users can access reports if generated
    console.log("All Sessions:", sessions);
    const displaySessions = sessions
        .filter(s => {
            //Status Filter
            const matchesStatus =
                filter === 'all' ? (s.status === 'COMPLETED' || s.status === 'ACTIVE') :
                    filter === 'completed' ? s.status === 'COMPLETED' :
                        filter === 'processing' ? (s.status === 'ACTIVE' || (s.endTime && (new Date().getTime() - new Date(s.endTime).getTime() < 120000))) : true;

            // Search Filter
            const matchesSearch = s.topic.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => {
            const dateA = a.endTime ? new Date(a.endTime).getTime() : new Date(a.startTime || 0).getTime();
            const dateB = b.endTime ? new Date(b.endTime).getTime() : new Date(b.startTime || 0).getTime();
            return dateB - dateA;
        });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Session Reports & Summaries 📊
                    </Typography>
                    <Typography color="text.secondary">
                        Review past sessions and AI-generated performance reports
                    </Typography>
                </Box>
                <Button
                    startIcon={<RefreshCw />}
                    onClick={() => refreshSessions && refreshSessions()}
                    variant="outlined"
                >
                    Refresh List
                </Button>
            </Box>

            {/* Search & Filter */}
            <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search recordings..."
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={20} color="gray" />
                            </InputAdornment>
                        ),
                    }}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    size="small"
                    sx={{ borderRadius: 2, minWidth: 150 }}
                >
                    <MenuItem value="all">All Sessions</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                </Select>
            </Paper>

            <Grid container spacing={3}>
                {displaySessions.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                            <Typography color="text.secondary">No reports found.</Typography>
                        </Paper>
                    </Grid>
                ) : (
                    displaySessions.map((session) => {
                        // Check if session ended recently (less than 2 minutes ago) to show "AI Evaluating"
                        const isProcessing = session.endTime && (new Date().getTime() - new Date(session.endTime).getTime() < 120000);

                        return (
                            <Grid item xs={12} md={6} lg={4} key={session.id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                    <IconButton
                                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)', zIndex: 1 }}
                                        size="small"
                                        color="error"
                                        onClick={() => setDeleteId(session.id)}
                                    >
                                        <Trash2 size={16} />
                                    </IconButton>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ pr: 4 }}>
                                                {session.topic}
                                            </Typography>
                                        </Box>

                                        {isProcessing ? (
                                            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                    icon={<CircularProgress size={12} />}
                                                    label="AI Evaluating..."
                                                    color="warning"
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip label="Recording Pending" size="small" variant="outlined" color="default" />
                                            </Box>
                                        ) : (
                                            <Chip label="Report Ready" color="success" size="small" variant="outlined" sx={{ mb: 2 }} />
                                        )}

                                        <Box sx={{ display: 'flex', gap: 2, mb: 2, color: 'text.secondary' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Calendar size={16} />
                                                <Typography variant="body2">
                                                    {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Clock size={16} />
                                                <Typography variant="body2">
                                                    {session.startTime ? new Date(session.startTime).toLocaleTimeString() : 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Chip
                                                size="small"
                                                label={`${session.participants?.length || 0} Participants`}
                                                variant="outlined"
                                            />
                                            <Chip
                                                size="small"
                                                label={`${session.transcript?.length || 0} Messages`}
                                                variant="outlined"
                                            />
                                        </Box>
                                    </CardContent>
                                    <CardActions sx={{ p: 2, pt: 0 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            endIcon={!isProcessing && <ArrowRight size={16} />}
                                            disabled={isProcessing}
                                            onClick={() => navigate(`/reports/${session.id}`)}
                                        >
                                            {isProcessing ? 'Processing...' : 'View Summary & Report'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })
                )}
            </Grid>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
                <DialogTitle>Delete Recording?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this recording? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Recordings;
