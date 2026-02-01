import { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Chip, Button, List, ListItem, CircularProgress, Alert, Snackbar, useTheme } from '@mui/material';
import { PlayCircle, Download, Share2, MessageSquare, Brain, RefreshCw, AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';

const RecordingDetails = () => {
    const theme = useTheme();
    const { id } = useParams();
    const { sessions } = useSession();
    const [session, setSession] = useState<any>(null);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const { userEmail } = useAuth();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const fetchReport = async (currentSession: any) => {
        // Fetch Report Logic with Fallback Matching
        let foundReport = null;

        if (userEmail) {
            try {
                // Try direct fetch by email
                const reportRes = await axios.get(`${import.meta.env.VITE_API_URL}/reports/session/${id}/user/${userEmail}`);
                if (reportRes.data) foundReport = reportRes.data;
            } catch (e) {
                // Ignore 404
            }
        }

        if (!foundReport) {
            try {
                const allReportsRes = await axios.get(`${import.meta.env.VITE_API_URL}/reports/session/${id}`);
                const allReports = allReportsRes.data;

                // 1. Precise Email Match
                if (userEmail) {
                    foundReport = allReports.find((r: any) => r.userEmail === userEmail);
                }

                // 2. Name Match
                if (!foundReport && userEmail && currentSession?.participants) {
                    const participant = currentSession.participants.find((p: any) => p.email === userEmail);
                    if (participant?.name) {
                        foundReport = allReports.find((r: any) => r.userEmail === participant.name);
                    }
                }

                // 3. Email Prefix Match
                if (!foundReport && userEmail) {
                    const prefix = userEmail.split('@')[0];
                    foundReport = allReports.find((r: any) => r.userEmail && r.userEmail.includes(prefix));
                }

                // 4. Fallback to ANY report if it looks like a summary (or just the first one for demo)
                if (!foundReport && allReports.length > 0) {
                    // Prefer one labeled 'SESSION_SUMMARY' if exists
                    foundReport = allReports.find((r: any) => r.userEmail === 'SESSION_SUMMARY') || allReports[0];
                }

            } catch (e) {
                console.error("Error fetching all reports:", e);
            }
        }
        return foundReport;
    };

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);

        try {
            // Fetch Session Details
            let currentSession = sessions.find(s => s.id === id);
            if (!currentSession) {
                const sessionRes = await axios.get(`${import.meta.env.VITE_API_URL}/sessions/${id}`);
                currentSession = sessionRes.data;
            }
            setSession(currentSession);

            const foundReport = await fetchReport(currentSession);
            setReport(foundReport);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, sessions, userEmail]);

    const handleRegenerate = async () => {
        setRegenerating(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/sessions/${id}/regenerate-report`);
            setSnackbar({ open: true, message: 'Report regeneration started! Refreshing...', severity: 'success' });

            // Wait a bit then refresh
            setTimeout(() => {
                fetchData();
                setRegenerating(false);
            }, 3000);
        } catch (error) {
            console.error("Regeneration failed", error);
            setSnackbar({ open: true, message: 'Regeneration failed. Server might be busy.', severity: 'error' });
            setRegenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('ai-report-container');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 3, // Higher scale for better quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Create PDF with exact dimensions of the content (Digital PDF)
            // Orientation: p (portrait), unit: px, format: [width, height]
            const pdf = new jsPDF({
                orientation: imgWidth > imgHeight ? 'l' : 'p',
                unit: 'px',
                format: [imgWidth, imgHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Discoursify_Report_${session?.topic?.substring(0, 30) || 'Session'}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert("Could not generate PDF. Please try again.");
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!session) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6">Report not found</Typography>
            </Box>
        );
    }

    // Helper to parse the AI markdown report
    const parseReport = (content: string) => {
        if (!content) return null;

        const scoreMatch = content.match(/(?:Score|Overall Score|Rating)\s*:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*\/?\s*10?/i);
        const score = scoreMatch ? scoreMatch[1] : 'N/A';

        const analysisMatch = content.match(/(?:Analysis|Feedback)\s*:?\s*\*?\*?\s*([\s\S]*?)(?=\d+\.|Key Themes|Conclusion|Improvements|Key Metrics|$)/i);
        const analysis = analysisMatch ? analysisMatch[1].trim() : content.substring(0, 200) + '...';

        const themesMatch = content.match(/(?:Key Themes|Major Themes)\s*:?\s*\*?\*?\s*([\s\S]*?)(?=\d+\.|Conclusion|Improvements|Key Metrics|$)/i);
        const themes = themesMatch ? themesMatch[1].trim().split(/\n-|\n\d+\.|,/).map(t => t.trim()).filter(t => t.length > 0) : [];

        const conclusionMatch = content.match(/(?:Conclusion|Major Takeaway)\s*:?\s*\*?\*?\s*([\s\S]*?)(?=\d+\.|Improvements|Key Metrics|$)/i);
        const conclusion = conclusionMatch ? conclusionMatch[1].trim() : null;

        const improvementsSectionMatch = content.match(/(?:Improvements|Suggestions)\s*:?\s*\*?\*?\s*([\s\S]*?)(?=\d+\.|Key Metrics|$)/i);
        const improvementsSection = improvementsSectionMatch ? improvementsSectionMatch[1] : '';

        const improvements = improvementsSection.split(/\n-|\n\d+\./).filter(item => item.includes('Said') || item.includes('said')).map(item => {
            const saidMatch = item.match(/(?:Said|Original)\s*:?\s*"([^"]*)"/i);
            const shouldMatch = item.match(/(?:Should have said|Better)\s*:?\s*"([^"]*)"/i);
            const reasonMatch = item.match(/(?:Reason|Why)\s*:?\s*([^]*)/i);

            return {
                said: saidMatch ? saidMatch[1] : 'Unknown',
                should: shouldMatch ? shouldMatch[1] : 'Unknown',
                reason: reasonMatch ? reasonMatch[1].trim() : 'No reason provided'
            };
        }).filter(i => i.said !== 'Unknown');

        return { score, analysis, improvements, themes, conclusion };
    };

    const parsedReport = report ? parseReport(report.content) : null;
    const isFallbackReport = !parsedReport || parsedReport.score === 'N/A' || report.content.includes("Unable to generate content");

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(45deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {session.topic}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        Recorded on {session.startTime ? new Date(session.startTime).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'} • {session.timeLimit} mins
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<Share2 size={18} />} onClick={handleShare}>Share</Button>
                    <Button variant="contained" startIcon={<Download size={18} />} onClick={handleDownloadPDF} sx={{ bgcolor: '#2563eb' }}>Export PDF</Button>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Left Column: Video & Transcript */}
                <Grid item xs={12} lg={7}>
                    {/* Video Player Placeholder */}
                    <Paper elevation={3} sx={{ aspectRatio: '16/9', bgcolor: '#000', borderRadius: 4, mb: 4, overflow: 'hidden', position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <PlayCircle size={64} fill="white" style={{ opacity: 0.9, cursor: 'pointer' }} />
                            <Typography sx={{ mt: 2, fontWeight: 500 }}>Play Recording</Typography>
                        </Box>
                    </Paper>

                    {/* Transcript */}
                    <Paper elevation={2} sx={{ p: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <MessageSquare size={20} className="text-blue-600" />
                                <Typography variant="h6" fontWeight="bold">Full Transcript</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ maxHeight: 500, overflowY: 'auto', p: 3 }}>
                            {session.transcript && session.transcript.length > 0 ? (
                                session.transcript.map((text: string, i: number) => (
                                    <Box key={i} sx={{ mb: 2, display: 'flex', gap: 2 }}>
                                        <Box sx={{ minWidth: 40, height: 40, borderRadius: '50%', bgcolor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontWeight: 'bold', fontSize: 14 }}>
                                            {text.split(']')[0].replace('[', '').slice(0, 2).toUpperCase()}
                                        </Box>
                                        <Box sx={{
                                            flex: 1,
                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                            p: 2,
                                            borderRadius: 3,
                                            borderTopLeftRadius: 0
                                        }}>
                                            <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                                                {text}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                                    <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                                    <Typography>No transcript available for this session.</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column: AI Report */}
                <Grid item xs={12} lg={5}>
                    <Paper id="ai-report-container" elevation={3} sx={{ p: 0, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: 'background.paper', overflow: 'hidden' }}>
                        {/* Report Header */}
                        <Box sx={{ p: 3, background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {/* Discoursify Branding */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 32, height: 32, bgcolor: '#2563eb', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Brain size={20} color="white" />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1 }}>Discoursify</Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 1 }}>AI ASSESSMENT</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                {parsedReport && (
                                    <Chip
                                        label={`Score: ${parsedReport.score}/10`}
                                        sx={{
                                            bgcolor: Number(parsedReport.score) > 7 ? '#22c55e' : '#eab308',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            height: 32
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Personalized feedback for <b>{userEmail?.split('@')[0]}</b> based on participation metrics and speech analysis.
                            </Typography>
                        </Box>

                        <Box sx={{ p: 3 }}>
                            {parsedReport ? (
                                <>
                                    {/* Analysis */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>Executive Summary</Typography>
                                        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7, textAlign: 'justify' }}>
                                            {parsedReport.analysis}
                                        </Typography>
                                    </Box>

                                    {/* Key Themes */}
                                    {parsedReport.themes && parsedReport.themes.length > 0 && (
                                        <Box sx={{ mb: 4 }}>
                                            <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>Key Themes Discussed</Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {parsedReport.themes.map((theme: string, i: number) => (
                                                    <Chip key={i} label={theme} size="small" sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(29, 78, 216, 0.2)' : '#eff6ff', color: theme.palette.mode === 'dark' ? '#93c5fd' : '#1d4ed8', fontWeight: 600, border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(29, 78, 216, 0.3)' : '#dbeafe' }} />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Improvements Table Layout for Cleanliness */}
                                    {parsedReport.improvements.length > 0 && (
                                        <Box sx={{ mb: 4 }}>
                                            <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>Communication Refinements</Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {parsedReport.improvements.map((item: any, index: number) => (
                                                    <Paper key={index} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fff' }}>
                                                        <Grid container spacing={2} alignItems="center">
                                                            <Grid item xs={12} md={5}>
                                                                <Typography variant="caption" color="error" fontWeight="bold">INSTEAD OF SAYING:</Typography>
                                                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 0.5, borderLeft: '3px solid', borderColor: 'error.main', pl: 1 }}>
                                                                    "{item.said}"
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={12} md={1} sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
                                                                <div style={{ color: '#ccc' }}>➜</div>
                                                            </Grid>
                                                            <Grid item xs={12} md={6}>
                                                                <Typography variant="caption" color="success" fontWeight="bold">TRY SAYING:</Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5, borderLeft: '3px solid', borderColor: 'success.main', pl: 1 }}>
                                                                    "{item.should}"
                                                                </Typography>
                                                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                                                    <b>Why?</b> {item.reason}
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Conclusion */}
                                    {parsedReport.conclusion && (
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>Final Verdict</Typography>
                                            <Paper elevation={0} sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(34,197,94,0.1)' : '#f0fdf4', p: 2, borderRadius: 2, border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(34,197,94,0.2)' : '#bbf7d0' }}>
                                                <Typography variant="body2" color={theme.palette.mode === 'dark' ? '#86efac' : '#15803d'} fontWeight="500">
                                                    {parsedReport.conclusion}
                                                </Typography>
                                            </Paper>
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 8 }}>
                                    <AlertTriangle size={48} className="text-yellow-500 mx-auto" style={{ marginBottom: 16 }} />
                                    <Typography variant="h6" gutterBottom>Report Unavailable</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        We couldn't generate a detailed analysis for this session. <br /> This might be due to AI service limits or insufficient transcript data.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={regenerating ? <CircularProgress size={20} color="inherit" /> : <RefreshCw size={20} />}
                                        onClick={handleRegenerate}
                                        disabled={regenerating}
                                        sx={{ borderRadius: 20, px: 4 }}
                                    >
                                        {regenerating ? 'Regenerating...' : 'Regenerate Report'}
                                    </Button>
                                </Box>
                            )}

                            {/* Regeneration for fallback/basic reports too */}
                            {isFallbackReport && parsedReport && (
                                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                        Is this report incomplete or generic?
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        startIcon={regenerating ? <CircularProgress size={16} color="inherit" /> : <RefreshCw size={16} />}
                                        onClick={handleRegenerate}
                                        disabled={regenerating}
                                    >
                                        {regenerating ? 'Upgrading...' : 'Upgrade / Regenerate Report'}
                                    </Button>
                                </Box>
                            )}

                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default RecordingDetails;
