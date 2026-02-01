import { Box, Typography, Button, Paper } from '@mui/material';
import { Ban, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BannedPage = () => {
    const { logout, userEmail } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'background.default',
            p: 3
        }}>
            <Paper elevation={0} sx={{
                p: 6,
                maxWidth: 600,
                textAlign: 'center',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <Box sx={{
                    display: 'inline-flex',
                    p: 3,
                    borderRadius: '50%',
                    bgcolor: 'error.lighter',
                    color: 'error.main',
                    mb: 3
                }}>
                    <Ban size={64} />
                </Box>

                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Access Suspended
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Your account (<strong>{userEmail}</strong>) has been banned by an administrator due to policy violations.
                    You can no longer access the platform.
                </Typography>

                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 4, textAlign: 'left' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        What can I do?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        If you believe this is a mistake, please contact the support team at <strong>support@discoursify.com</strong> or ask an administrator to revoke the ban.
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    onClick={handleLogout}
                    startIcon={<WifiOff />}
                >
                    Sign Out
                </Button>
            </Paper>
        </Box>
    );
};

export default BannedPage;
