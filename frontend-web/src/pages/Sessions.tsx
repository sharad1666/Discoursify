import { useState } from 'react';
import { Box, Grid, Paper, Typography, Button, Chip, TextField, Divider, InputAdornment } from '@mui/material';
import { Plus, Users, Clock, Lock, Unlock, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';

const Sessions = () => {
    const navigate = useNavigate();
    const { sessions, joinSession, joinByCode } = useSession();
    const { userEmail } = useAuth();

    // Quick Join State
    const [joinInput, setJoinInput] = useState('');
    const [joinError, setJoinError] = useState('');
    const [joining, setJoining] = useState(false);

    // Show all active sessions (not completed)
    const availableSessions = sessions.filter(s => s.status !== 'COMPLETED');

    const handleJoinSession = async (sessionId: string) => {
        if (!userEmail) return;

        await joinSession(sessionId, {
            name: userEmail.split('@')[0],
            email: userEmail,
            isHost: false,
        });

        navigate(`/session/${sessionId}`);
    };

    const handleQuickJoin = async () => {
        if (!joinInput || !userEmail) return;
        setJoining(true);
        setJoinError('');

        let codeToJoin = joinInput.trim();

        // Check if input is a URL
        if (codeToJoin.includes('http') || codeToJoin.includes('localhost') || codeToJoin.includes('gd-platform')) {
            try {
                const url = new URL(codeToJoin.startsWith('http') ? codeToJoin : `https://${codeToJoin}`);

                // Case 1: URL path ends with ID/Code (e.g. /session/123456)
                const pathParts = url.pathname.split('/');
                let possibleId = pathParts[pathParts.length - 1];
                if (!possibleId) possibleId = pathParts[pathParts.length - 2]; // Handle trailing slash

                // Case 2: URL has query param (e.g. ?code=123456 or ?id=uuid)
                const queryCode = url.searchParams.get('code') || url.searchParams.get('id');
                if (queryCode) possibleId = queryCode;

                if (possibleId) {
                    // Check format
                    if (possibleId.length === 6 && !isNaN(Number(possibleId))) {
                        codeToJoin = possibleId; // Proceed to joinByCode
                    } else if (possibleId.length > 10) {
                        // Assume UUID, join directly via generic joinSession
                        // First verify session exists (or just try joining)
                        await handleJoinSession(possibleId);
                        setJoining(false);
                        return;
                    }
                }
            } catch (e) {
                console.error("Link parsing error", e);
                setJoinError('Invalid link format');
                setJoining(false);
                return;
            }
        }

        // Try joining by Code (6 digits)
        const sessionId = await joinByCode(codeToJoin, {
            name: userEmail.split('@')[0],
            email: userEmail,
            isHost: false,
        });

        setJoining(false);

        if (sessionId) {
            navigate(`/session/${sessionId}`);
        } else {
            setJoinError('Session not found. Please check the code or link.');
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Join a Session 🎯
                    </Typography>
                    <Typography color="text.secondary">
                        Enter a code, paste a link, or join a public session below.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => navigate('/create-session')}
                    sx={{ borderRadius: 2 }}
                >
                    Create Session
                </Button>
            </Box>

            {/* Quick Join Section */}
            <Paper elevation={0} sx={{ p: 4, mb: 6, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'primary.lighter' }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Have a Code or Link?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Enter the 6-digit code or paste the full meeting link to join immediately.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                placeholder="Enter Code (e.g. 123456) or Paste Link"
                                value={joinInput}
                                onChange={(e) => {
                                    setJoinInput(e.target.value);
                                    setJoinError('');
                                }}
                                error={!!joinError}
                                helperText={joinError}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LinkIcon size={20} color="#9ca3af" />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2, bgcolor: 'background.paper' }
                                }}
                            />
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleQuickJoin}
                                disabled={!joinInput || joining}
                                sx={{ borderRadius: 2, px: 4, minWidth: 120 }}
                            >
                                {joining ? 'Joining...' : 'Join'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Divider sx={{ mb: 4 }} />

            {/* Public and Active Sessions */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5" fontWeight="bold">
                    Public & Active Sessions
                </Typography>
                <Chip label={`${availableSessions.length} available`} size="small" color="primary" sx={{ borderRadius: 1.5 }} />
            </Box>

            {availableSessions.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Users size={48} color="#ccc" />
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                        No Active Sessions Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Be the first to create a session!
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={() => navigate('/create-session')}
                        sx={{ borderRadius: 2 }}
                    >
                        Create New Session
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {availableSessions.map((session) => {
                        const timeElapsed = session.startTime
                            ? Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000)
                            : 0;
                        const timeRemaining = (session.timeLimit || 60) - timeElapsed;

                        return (
                            <Grid item xs={12} md={6} lg={4} key={session.id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 4,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(0,0,0,0.08)', borderColor: 'primary.main', bgcolor: 'background.paper' }
                                    }}
                                >
                                    {session.type === 'public' && (
                                        <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, bgcolor: 'success.light', borderBottomLeftRadius: 16 }}>
                                            <Unlock size={14} color="white" />
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Chip
                                            label={session.type === 'public' ? 'Public' : 'Private'}
                                            size="small"
                                            color={session.type === 'public' ? 'success' : 'warning'}
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                        <Chip
                                            label={`${session.participants.length} joined`}
                                            size="small"
                                            icon={<Users size={14} />}
                                            variant="outlined"
                                        />
                                    </Box>

                                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, minHeight: 60, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'text.primary' }}>
                                        {session.topic}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary', bgcolor: 'background.default', p: 1, borderRadius: 1.5 }}>
                                        <Clock size={16} />
                                        <Typography variant="body2" fontWeight="medium">
                                            {session.startTime
                                                ? (timeRemaining > 0 ? `${timeRemaining}m remaining` : 'Ending soon')
                                                : `${session.timeLimit || 60} min session`
                                            }
                                        </Typography>
                                    </Box>

                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#9ca3af' }} />
                                        Host: {session.hostEmail.split('@')[0]}
                                    </Typography>

                                    {session.hasWaitingRoom && (
                                        <Chip
                                            icon={<Lock size={14} />}
                                            label="Waiting Room"
                                            size="small"
                                            variant="outlined"
                                            sx={{ mt: 1, borderColor: 'divider', color: 'text.secondary' }}
                                        />
                                    )}

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={() => handleJoinSession(session.id)}
                                        sx={{ borderRadius: 2, mt: 'auto' }}
                                    >
                                        Join Session
                                    </Button>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
};

export default Sessions;
