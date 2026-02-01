import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default', p: 3 }}>
                    <Paper sx={{ p: 4, maxWidth: 600, width: '100%', textAlign: 'center', borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: '50%', color: 'error.main' }}>
                                <AlertTriangle size={40} />
                            </Box>
                        </Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Something went wrong
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            {this.state.error?.message || "An unexpected error occurred in the application."}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<RefreshCw />}
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
