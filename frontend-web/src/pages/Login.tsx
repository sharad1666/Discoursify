import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, InputAdornment, Divider, Alert, Tab, Tabs, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Mail, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login, loginWithEmail, signupWithEmail, resetPassword } = useAuth();
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot Password State
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleGoogleLogin = async () => {
        try {
            await login();
            navigate('/dashboard');
        } catch (err) {
            console.error('Login Failed:', err);
            setError('Failed to sign in with Google');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Admin Bypass
        if (!isSignup && email === 'admin@gd.com' && password === 'admin') {
            navigate('/admin');
            return;
        }

        try {
            if (isSignup) {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                await signupWithEmail(email, password);
            } else {
                await loginWithEmail(email, password);
            }
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Auth Error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!resetEmail) {
            setResetStatus({ type: 'error', message: 'Please enter your email address' });
            return;
        }

        try {
            await resetPassword(resetEmail);
            setResetStatus({ type: 'success', message: 'Password reset link sent to your email!' });
            setTimeout(() => {
                setForgotPasswordOpen(false);
                setResetStatus(null);
                setResetEmail('');
            }, 3000);
        } catch (error: any) {
            setResetStatus({ type: 'error', message: error.message || 'Failed to send reset email' });
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            background: (theme) => theme.palette.mode === 'dark'
                ? 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)'
                : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            p: 2
        }}>
            <Container maxWidth="sm">
                <Paper elevation={24} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <Box sx={{ mb: 3, display: 'inline-flex', p: 2, bgcolor: 'primary.light', borderRadius: '50%', color: 'primary.main' }}>
                        {isSignup ? <UserPlus size={32} /> : <Lock size={32} />}
                    </Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {isSignup ? 'Create Account' : 'Welcome Back'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 4 }}>
                        {isSignup ? 'Join Discoursify today' : 'Sign in to access your account'}
                    </Typography>

                    <Tabs
                        value={isSignup ? 1 : 0}
                        onChange={(_, val) => setIsSignup(val === 1)}
                        centered
                        sx={{ mb: 4 }}
                    >
                        <Tab label="Login" icon={<LogIn size={18} />} iconPosition="start" />
                        <Tab label="Sign Up" icon={<UserPlus size={18} />} iconPosition="start" />
                    </Tabs>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={handleGoogleLogin}
                        startIcon={<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 20, height: 20 }} />}
                        sx={{ py: 1.5, borderRadius: 2, fontSize: '1.1rem', textTransform: 'none', mb: 4 }}
                    >
                        {isSignup ? 'Sign up with Google' : 'Sign in with Google'}
                    </Button>

                    <Divider sx={{ mb: 4 }}>OR</Divider>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            variant="outlined"
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Mail size={20} color="gray" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock size={20} color="gray" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        {isSignup && (
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                type="password"
                                variant="outlined"
                                margin="normal"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock size={20} color="gray" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />
                        )}

                        {!isSignup && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button
                                    size="small"
                                    onClick={() => setForgotPasswordOpen(true)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Forgot Password?
                                </Button>
                            </Box>
                        )}

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            type="submit"
                            disabled={loading}
                            endIcon={<ArrowRight size={20} />}
                            sx={{ mt: 3, py: 1.5, borderRadius: 2, fontSize: '1.1rem', textTransform: 'none' }}
                        >
                            {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login')}
                        </Button>
                    </form>

                    <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <Button
                                onClick={() => setIsSignup(!isSignup)}
                                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                            >
                                {isSignup ? 'Login' : 'Sign Up'}
                            </Button>
                        </Typography>
                    </Box>
                </Paper>
            </Container>

            {/* Forgot Password Dialog */}
            <Dialog open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Typography>
                    {resetStatus && (
                        <Alert severity={resetStatus.type} sx={{ mb: 2 }}>
                            {resetStatus.message}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setForgotPasswordOpen(false)}>Cancel</Button>
                    <Button onClick={handleForgotPassword} variant="contained">Send Reset Link</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Login;
