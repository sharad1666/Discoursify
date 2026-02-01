import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, FormControl, RadioGroup, Radio, FormControlLabel, Switch, MenuItem, Select, Chip, CircularProgress, Alert, Snackbar } from '@mui/material';
import { Plus, Clock, Lock, Users, Copy, ArrowRight, Sparkles, Calendar as CalendarIcon, RefreshCw, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { generateGDTopics } from '../services/ai';

const CreateSession = () => {
    const navigate = useNavigate();
    const { createSession, startSession } = useSession();
    const { userEmail } = useAuth();

    const [topic, setTopic] = useState('');
    const [sessionType, setSessionType] = useState<'public' | 'private'>('public');
    const [timeLimit, setTimeLimit] = useState(60);
    const [maxParticipants, setMaxParticipants] = useState(10);
    const [hostRole, setHostRole] = useState<'PARTICIPANT' | 'OBSERVER'>('PARTICIPANT');
    const [hasWaitingRoom, setHasWaitingRoom] = useState(false);
    const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [createdCode, setCreatedCode] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const [topicError, setTopicError] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    const handleGenerateTopic = async () => {
        setIsGeneratingTopic(true);
        setTopicError('');
        try {
            const topics = await generateGDTopics();
            if (topics && topics.length > 0) {
                setSuggestedTopics(topics.map((t: any) => t.topic));
                setNotificationMessage('✨ AI generated topics successfully!');
                setShowNotification(true);
            } else {
                setTopicError('Unable to generate topics. Please try again.');
            }
        } catch (error) {
            setTopicError('Failed to generate topics. Please try again.');
        } finally {
            setIsGeneratingTopic(false);
        }
    };

    const handleCreateSession = async () => {
        if (!topic.trim() || !userEmail) return;

        if (topic.trim().length < 5) {
            setTopicError('Topic must be at least 5 characters long.');
            return;
        }

        if (scheduleType === 'later') {
            if (!scheduledDate || !scheduledTime) {
                setTopicError('Please select both date and time for the scheduled session.');
                return;
            }
            const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
            if (selectedDateTime < new Date()) {
                setTopicError('Scheduled time cannot be in the past.');
                return;
            }
        }

        try {
            const hostInfo = scheduleType === 'now' ? {
                name: userEmail.split('@')[0],
                email: userEmail,
                isHost: true,
            } : undefined;

            const sessionId = await createSession({
                topic: topic.trim(),
                type: sessionType,
                hostId: userEmail,
                hostEmail: userEmail,
                timeLimit,
                maxParticipants,
                hostRole,
                hasWaitingRoom,
            }, hostInfo);

            if (scheduleType === 'now') {
                // Start the session immediately
                await startSession(sessionId);

                setCreatedCode(sessionId);
                setShowSuccess(true);

                setTimeout(() => {
                    navigate(`/session/${sessionId}`);
                }, 2000);
            } else {
                // Save scheduled session
                const scheduledSessions = JSON.parse(localStorage.getItem('scheduledSessions') || '[]');
                scheduledSessions.push({
                    sessionId,
                    scheduledDate,
                    scheduledTime,
                    topic: topic.trim(),
                });
                localStorage.setItem('scheduledSessions', JSON.stringify(scheduledSessions));

                setCreatedCode(sessionId);
                setShowSuccess(true);

                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to create session:', error);
            alert(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
            setTopicError('Failed to create session. Please try again.');
        }
    };

    if (showSuccess) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8 }}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Box sx={{ mb: 3, display: 'inline-flex', p: 2, bgcolor: 'success.light', borderRadius: '50%', color: 'success.main' }}>
                        <Plus size={32} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {scheduleType === 'now' ? 'Session Created Successfully!' : 'Session Scheduled Successfully!'} 🎉
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        {scheduleType === 'now'
                            ? (sessionType === 'private' ? 'Share this code with participants:' : 'Redirecting to your session...')
                            : `Scheduled for ${scheduledDate} at ${scheduledTime}`
                        }
                    </Typography>

                    {sessionType === 'private' && (
                        <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h3" fontWeight="bold" letterSpacing={4}>
                                {createdCode.slice(-6)}
                            </Typography>
                            <Button
                                startIcon={<Copy size={18} />}
                                onClick={() => navigator.clipboard.writeText(createdCode.slice(-6))}
                                sx={{ mt: 2 }}
                            >
                                Copy Code
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Create New Session 🚀
                </Typography>
                <Typography color="text.secondary">
                    Set up your group discussion session with AI-powered features
                </Typography>
                <Button
                    variant="text"
                    startIcon={<Video size={16} />}
                    onClick={() => navigate('/reports')}
                    sx={{ mt: 1 }}
                >
                    View Past Recordings
                </Button>
            </Box>

            <Snackbar
                open={showNotification}
                autoHideDuration={3000}
                onClose={() => setShowNotification(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setShowNotification(false)} severity="success" sx={{ width: '100%' }}>
                    {notificationMessage}
                </Alert>
            </Snackbar>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        {/* Topic with AI Generation */}
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Discussion Topic *
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={isGeneratingTopic ? <CircularProgress size={16} /> : <Sparkles size={16} />}
                                    onClick={handleGenerateTopic}
                                    disabled={isGeneratingTopic}
                                    sx={{
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        borderColor: 'primary.main',
                                        '&:hover': {
                                            bgcolor: 'primary.light',
                                            borderColor: 'primary.dark'
                                        }
                                    }}
                                >
                                    {isGeneratingTopic ? 'Generating...' : 'Generate with AI'}
                                </Button>
                            </Box>
                            <TextField
                                fullWidth
                                placeholder="e.g., Impact of AI on Employment"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                multiline
                                rows={2}
                            />

                            {topicError && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {topicError}
                                </Alert>
                            )}

                            {suggestedTopics.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                            ✨ AI Generated Topics (click to use):
                                        </Typography>
                                        <Button
                                            size="small"
                                            startIcon={<RefreshCw size={14} />}
                                            onClick={handleGenerateTopic}
                                            disabled={isGeneratingTopic}
                                            sx={{ fontSize: '0.75rem' }}
                                        >
                                            Refresh
                                        </Button>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {suggestedTopics.map((suggestedTopic, i) => (
                                            <Chip
                                                key={i}
                                                label={suggestedTopic}
                                                onClick={() => {
                                                    setTopic(suggestedTopic);
                                                    setNotificationMessage(`Topic set: ${suggestedTopic}`);
                                                    setShowNotification(true);
                                                }}
                                                sx={{
                                                    cursor: 'pointer',
                                                    maxWidth: '100%',
                                                    bgcolor: 'primary.light',
                                                    color: 'primary.dark',
                                                    fontWeight: 500,
                                                    '&:hover': {
                                                        bgcolor: 'primary.main',
                                                        color: 'white'
                                                    }
                                                }}
                                                icon={<Sparkles size={14} />}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* Schedule Type */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                When to Start
                            </Typography>
                            <RadioGroup value={scheduleType} onChange={(e) => setScheduleType(e.target.value as 'now' | 'later')}>
                                <Paper elevation={0} sx={{ p: 2, mb: 2, border: '2px solid', borderColor: scheduleType === 'now' ? 'primary.main' : 'divider', borderRadius: 2, cursor: 'pointer' }} onClick={() => setScheduleType('now')}>
                                    <FormControlLabel
                                        value="now"
                                        control={<Radio />}
                                        label={
                                            <Box>
                                                <Typography fontWeight="bold">Start Now</Typography>
                                                <Typography variant="caption" color="text.secondary">Begin the session immediately</Typography>
                                            </Box>
                                        }
                                    />
                                </Paper>
                                <Paper elevation={0} sx={{ p: 2, border: '2px solid', borderColor: scheduleType === 'later' ? 'primary.main' : 'divider', borderRadius: 2, cursor: 'pointer' }} onClick={() => setScheduleType('later')}>
                                    <FormControlLabel
                                        value="later"
                                        control={<Radio />}
                                        label={
                                            <Box>
                                                <Typography fontWeight="bold">Schedule for Later</Typography>
                                                <Typography variant="caption" color="text.secondary">Set a specific date and time</Typography>
                                            </Box>
                                        }
                                    />
                                </Paper>
                            </RadioGroup>

                            {scheduleType === 'later' && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                label="Date"
                                                value={scheduledDate}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                type="time"
                                                label="Time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </Box>

                        {/* Session Type */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Session Type
                            </Typography>
                            <RadioGroup value={sessionType} onChange={(e) => setSessionType(e.target.value as 'public' | 'private')}>
                                <Paper elevation={0} sx={{ p: 2, mb: 2, border: '2px solid', borderColor: sessionType === 'public' ? 'primary.main' : 'divider', borderRadius: 2, cursor: 'pointer' }} onClick={() => setSessionType('public')}>
                                    <FormControlLabel
                                        value="public"
                                        control={<Radio />}
                                        label={
                                            <Box>
                                                <Typography fontWeight="bold">Public Session</Typography>
                                                <Typography variant="caption" color="text.secondary">Anyone can discover and join this session</Typography>
                                            </Box>
                                        }
                                    />
                                </Paper>
                                <Paper elevation={0} sx={{ p: 2, border: '2px solid', borderColor: sessionType === 'private' ? 'primary.main' : 'divider', borderRadius: 2, cursor: 'pointer' }} onClick={() => setSessionType('private')}>
                                    <FormControlLabel
                                        value="private"
                                        control={<Radio />}
                                        label={
                                            <Box>
                                                <Typography fontWeight="bold">Private Session (Invite Only)</Typography>
                                                <Typography variant="caption" color="text.secondary">Only people with the join code can access</Typography>
                                            </Box>
                                        }
                                    />
                                </Paper>
                            </RadioGroup>
                        </Box>

                        {/* Time Limit - Starting from 5 minutes */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Time Limit
                            </Typography>
                            <FormControl fullWidth>
                                <Select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}>
                                    <MenuItem value={5}>5 minutes (Quick Discussion)</MenuItem>
                                    <MenuItem value={10}>10 minutes</MenuItem>
                                    <MenuItem value={15}>15 minutes</MenuItem>
                                    <MenuItem value={20}>20 minutes</MenuItem>
                                    <MenuItem value={30}>30 minutes</MenuItem>
                                    <MenuItem value={45}>45 minutes</MenuItem>
                                    <MenuItem value={60}>1 hour</MenuItem>
                                    <MenuItem value={90}>1.5 hours</MenuItem>
                                    <MenuItem value={120}>2 hours</MenuItem>
                                    <MenuItem value={180}>3 hours</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Waiting Room */}
                        <Box sx={{ mb: 4 }}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography fontWeight="bold" color="text.primary">Enable Waiting Room</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Participants wait for host approval before joining
                                        </Typography>
                                    </Box>
                                    <Switch
                                        checked={hasWaitingRoom}
                                        onChange={(e) => setHasWaitingRoom(e.target.checked)}
                                    />
                                </Box>
                            </Paper>
                        </Box>

                        {/* Max Participants and Host Role */}
                        <Box sx={{ mb: 4 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Max Participants
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        value={maxParticipants}
                                        onChange={(e) => setMaxParticipants(Number(e.target.value))}
                                        inputProps={{ min: 2, max: 100 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Your Role
                                    </Typography>
                                    <FormControl fullWidth>
                                        <Select value={hostRole} onChange={(e) => setHostRole(e.target.value as 'PARTICIPANT' | 'OBSERVER')}>
                                            <MenuItem value="PARTICIPANT">Participant (Evaluated)</MenuItem>
                                            <MenuItem value="OBSERVER">Observer (Not Evaluated)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Create Button */}
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleCreateSession}
                            disabled={!topic.trim() || isGeneratingTopic || (scheduleType === 'later' && (!scheduledDate || !scheduledTime))}
                            endIcon={isGeneratingTopic ? <CircularProgress size={20} color="inherit" /> : <ArrowRight size={20} />}
                            sx={{ py: 1.5, borderRadius: 2, fontSize: '1.1rem' }}
                        >
                            {isGeneratingTopic ? 'Creating...' : (scheduleType === 'now' ? 'Create & Start Session' : 'Schedule Session')}
                        </Button>
                    </Paper>
                </Grid>

                {/* Enhanced Preview Panel */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 20 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Session Preview
                        </Typography>

                        <Box sx={{ mt: 3 }}>
                            {scheduleType === 'later' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                                    <CalendarIcon size={16} color="#0288d1" />
                                    <Box>
                                        <Typography variant="caption" fontWeight="bold" color="info.dark">
                                            Scheduled Session
                                        </Typography>
                                        {scheduledDate && scheduledTime && (
                                            <Typography variant="caption" display="block" color="info.dark">
                                                {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Lock size={16} color="#666" />
                                <Typography variant="body2">
                                    <strong>Type:</strong> {sessionType === 'public' ? 'Public' : 'Private'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Clock size={16} color="#666" />
                                <Typography variant="body2">
                                    <strong>Duration:</strong> {timeLimit >= 60 ? `${timeLimit / 60} hour${timeLimit > 60 ? 's' : ''}` : `${timeLimit} minutes`}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Users size={16} color="#666" />
                                <Typography variant="body2">
                                    <strong>Waiting Room:</strong> {hasWaitingRoom ? 'Enabled' : 'Disabled'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Users size={16} color="#666" />
                                <Typography variant="body2">
                                    <strong>Max Participants:</strong> {maxParticipants}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Users size={16} color="#666" />
                                <Typography variant="body2">
                                    <strong>Host Role:</strong> {hostRole === 'PARTICIPANT' ? 'Participant' : 'Observer'}
                                </Typography>
                            </Box>
                        </Box>

                        {sessionType === 'private' && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                                <Typography variant="caption" fontWeight="bold">
                                    💡 A 6-digit join code will be generated after creation
                                </Typography>
                            </Box>
                        )}

                        {topic && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                                <Typography variant="caption" fontWeight="bold" color="success.dark">
                                    📝 Topic Set
                                </Typography>
                                <Typography variant="caption" display="block" color="success.dark" sx={{ mt: 0.5 }}>
                                    {topic.substring(0, 60)}{topic.length > 60 ? '...' : ''}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CreateSession;
