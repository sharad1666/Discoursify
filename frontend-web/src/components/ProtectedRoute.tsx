import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box, Typography, Button } from '@mui/material';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, loading, userRole } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles) {
        console.log('ProtectedRoute Check:', { userRole, allowedRoles, match: allowedRoles.includes(userRole || '') });
        if (!userRole || !allowedRoles.includes(userRole)) {
            console.warn('Access denied. Redirecting to dashboard.');
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" color="error" gutterBottom>Access Denied</Typography>
                    <Typography>Current Role: {userRole || 'None'}</Typography>
                    <Typography>Required Roles: {allowedRoles.join(', ')}</Typography>
                    <Button variant="contained" onClick={() => window.location.href = '/dashboard'} sx={{ mt: 2 }}>
                        Go to Dashboard
                    </Button>
                </Box>
            );
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
