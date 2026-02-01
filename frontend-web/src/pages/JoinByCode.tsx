import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';
import { Hash, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';

const JoinByCode = () => {
    const navigate = useNavigate();
    const { joinByCode } = useSession();
    const { userEmail } = useAuth();

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (code.length !== 6 || !userEmail) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        const sessionId = await joinByCode(code, {
            name: userEmail.split('@')[0],
            email: userEmail,
            isHost: false,
        });

        setLoading(false);

        if (sessionId) {
            navigate(`/session/${sessionId}`);
        } else {
            setError('Invalid code or session not found');
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
        setError('');
    };

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', mt: 8 }}>
            <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Box sx={{ mb: 3, display: 'inline-flex', p: 2, bgcolor: 'primary.light', borderRadius: '50%', color: 'primary.main' }}>
                    <Hash size={32} />
                </Box>

                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Join by Code
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Enter the 6-digit code to join a private session
                </Typography>

                <TextField
                    fullWidth
                    placeholder="000000"
                    value={code}
                    onChange={handleCodeChange}
                    error={!!error}
                    helperText={error}
                    inputProps={{
                        maxLength: 6,
                        style: { textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5rem', fontWeight: 'bold' }
                    }}
                    sx={{ mb: 3 }}
                />

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleJoin}
                    disabled={code.length !== 6 || loading}
                    endIcon={<ArrowRight size={20} />}
                    sx={{ py: 1.5, borderRadius: 2, fontSize: '1.1rem', mb: 2 }}
                >
                    {loading ? 'Joining...' : 'Join Session'}
                </Button>

                <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate('/join')}
                >
                    Back to Sessions
                </Button>
            </Paper>

            {/* Public Sessions List */}
            <Box sx={{ mt: 6 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Hash size={24} /> Public Sessions
                </Typography>
                <RenderPublicSessions />
            </Box>
        </Box>
    );
};

const RenderPublicSessions = () => {
    const { sessions } = useSession();
    const navigate = useNavigate();
    // Filter for Public and LIVE/SCHEDULED sessions
    const publicSessions = sessions.filter(s =>
        s.type === 'public' &&
        s.status !== 'COMPLETED'
    );

    if (publicSessions.length === 0) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed', borderColor: 'divider' }}>
                <Typography color="text.secondary">No public sessions available right now.</Typography>
            </Paper>
        );
    }

    return (
        <React.Fragment>
            {publicSessions.map(session => (
                <Paper
                    key={session.id}
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 2,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main' }
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h6" fontWeight="bold">{session.topic}</Typography>
                                {session.status === 'LIVE' && (
                                    <span style={{
                                        backgroundColor: '#fee2e2',
                                        color: '#ef4444',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        ● LIVE
                                    </span>
                                )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <span>Host: {session.hostEmail?.split('@')[0] || 'Unknown'}</span>
                                <span>•</span>
                                <span>{session.participants?.length || 0} participants</span>
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={() => {
                                // Assuming current user is participant. If no user, might default or ask name.
                                // For now, simple join logic or navigate to preview
                                navigate(`/session/${session.id}`);
                            }}
                        >
                            Join
                        </Button>
                    </Box>
                </Paper>
            ))}
        </React.Fragment>
    );
};

export default JoinByCode;
