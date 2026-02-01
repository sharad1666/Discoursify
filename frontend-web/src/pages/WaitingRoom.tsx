import { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { Clock, Users } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

const WaitingRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { sessions, refreshSessions } = useSession();
    const [waitingTime, setWaitingTime] = useState(0);

    const session = sessions.find(s => s.id === id);

    useEffect(() => {
        const interval = setInterval(() => {
            setWaitingTime(prev => prev + 1);
            refreshSessions(); // Poll for updates (admission status)
        }, 3000);

        return () => clearInterval(interval);
    }, [refreshSessions]);

    useEffect(() => {
        // Check if admitted to session
        if (session && session.participants.length > 0) {
            navigate(`/session/${id}`);
        }
    }, [session, id, navigate]);

    if (!session) {
        return (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
                <Typography>Session not found</Typography>
            </Box>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8 }}>
            <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <CircularProgress size={60} sx={{ mb: 3 }} />

                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Waiting for Host Approval
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    The host will admit you shortly
                </Typography>

                <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {session.topic}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Clock size={16} />
                            <Typography variant="body2">
                                Waiting: {formatTime(waitingTime)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Users size={16} />
                            <Typography variant="body2">
                                {session.waitingList.length} in waiting room
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Typography variant="caption" color="text.secondary">
                    Please be patient while the host reviews participants
                </Typography>
            </Paper>
        </Box>
    );
};

export default WaitingRoom;
