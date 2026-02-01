import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, Button, IconButton, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, LinearProgress, Divider, CircularProgress, Menu, MenuItem } from '@mui/material';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Users, Copy, MessageSquare, Lock, Clock, UserCheck, Download, Hash, Languages, Globe } from 'lucide-react';

import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { generateDetailedReport } from '../services/ai';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const LiveGD = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { sessions, currentSession, lockSession, startSession, endSession, saveReport, admitFromWaiting, addToTranscript, setCurrentSession, loading, joinSession } = useSession();
    const { userEmail } = useAuth();

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [showWaitingList, setShowWaitingList] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [peers, setPeers] = useState<{ [key: string]: { stream: MediaStream, name: string } }>({});

    // Language Support
    const [anchorElLang, setAnchorElLang] = useState<null | HTMLElement>(null);
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');

    const [isConclusionPhase, setIsConclusionPhase] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [aiFeedback, setAiFeedback] = useState<{ message: string, score: number, type: string } | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recognitionRef = useRef<any>(null);
    const stompClientRef = useRef<any>(null);
    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});

    // Fix: Refs to track latest state across callbacks
    const shouldRecordRef = useRef(false);
    const sessionRef = useRef<any>(null);

    const [liveSession, setLiveSession] = useState<any>(null); // Local state for real-time updates

    const globalSession = sessions.find(s => s.id === id) || currentSession;

    useEffect(() => {
        if (globalSession) {
            setLiveSession(globalSession);
        }
    }, [globalSession]);

    // Use liveSession for rendering, fallback to global if null safely
    const session = liveSession || globalSession;

    // Fix: Keep session ref updated for callbacks
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    const isHost = session?.hostEmail === userEmail;

    const joinAttempted = useRef(false);

    useEffect(() => {
        const autoJoin = async () => {
            if (session && userEmail && id && !joinAttempted.current) {
                // If Host, we are already joined via createSession
                if (session.hostEmail === userEmail) {
                    console.log("User is host, skipping auto-join");
                    joinAttempted.current = true;
                    return;
                }

                const isParticipant = session.participants.some(p => p.email === userEmail);
                if (!isParticipant) {
                    console.log("Auto-joining session...");
                    joinAttempted.current = true;
                    await joinSession(id, {
                        name: userEmail.split('@')[0],
                        email: userEmail,
                        isHost: false
                    });
                }
            }
        };
        autoJoin();
    }, [session, userEmail, id, joinSession]);

    // Helper functions defined before effects to avoid dependency issues
    const sendSignal = (type: string, data: string, receiver?: string) => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.send("/app/signal", {}, JSON.stringify({
                type,
                sender: userEmail,
                receiver,
                data,
                sessionId: id
            }));
        }
    };

    const createPeerConnection = (peerId: string, stream: MediaStream, isInitiator: boolean) => {
        if (peersRef.current[peerId]) return peersRef.current[peerId];

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
            ]
        });

        peersRef.current[peerId] = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal('candidate', JSON.stringify(event.candidate), peerId);
            }
        };

        pc.ontrack = (event) => {
            setPeers(prev => ({
                ...prev,
                [peerId]: { stream: event.streams[0], name: peerId.split('@')[0] }
            }));
        };

        if (isInitiator) {
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                sendSignal('offer', JSON.stringify(offer), peerId);
            });
        }

        return pc;
    };

    const handleSignalMessage = async (signal: any, stream: MediaStream) => {
        const sender = signal.sender;
        const receiver = signal.receiver;

        // General broadcast 'join' or targeted message
        if (signal.type === 'join') {
            // Join is a broadcast, everyone should respond to the new joiner
            createPeerConnection(sender, stream, true);
        } else if (receiver === userEmail) {
            // Processing targeted signals
            if (signal.type === 'offer') {
                const pc = createPeerConnection(sender, stream, false);
                await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.data)));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal('answer', JSON.stringify(answer), sender);
            } else if (signal.type === 'answer') {
                const pc = peersRef.current[sender];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.data)));
                }
            } else if (signal.type === 'candidate') {
                const pc = peersRef.current[sender];
                if (pc) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(signal.data)));
                    } catch (e) {
                        console.warn("Error adding ICE candidate (likely remote desc not set yet):", e);
                    }
                }
            }
        }

        // 'leave' can be broadcast or targeted, usually broadcast
        if (signal.type === 'leave') {
            if (peersRef.current[sender]) {
                peersRef.current[sender].close();
                delete peersRef.current[sender];
                setPeers(prev => {
                    const newPeers = { ...prev };
                    delete newPeers[sender];
                    return newPeers;
                });
            }
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition not supported in this browser');
            return;
        }

        if (isRecording) {
            shouldRecordRef.current = false;
            recognitionRef.current.stop();
        } else {
            shouldRecordRef.current = true;
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Manual start error:", e);
            }
        }
        setIsRecording(!isRecording);
    };

    const toggleAudio = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) setIsMuted(!audioTrack.enabled);
            else setIsMuted(!isMuted);
        } else {
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) setIsVideoOff(!videoTrack.enabled);
            else setIsVideoOff(!isVideoOff);
        } else {
            setIsVideoOff(!isVideoOff);
        }
    };

    const handleCopyInvite = () => {
        if (!session) return;
        const url = session.type === 'public'
            ? `${window.location.origin}/session/${id}`
            : `Join code: ${session.code}`;
        navigator.clipboard.writeText(url);
        setShowInvite(true);
    };

    const handleLockSession = async () => {
        if (session && isHost) {
            await lockSession(session.id);
            // Explicitly start the session when locked, if not already started
            if (!session.startTime || session.status !== 'LIVE') {
                console.log("Locking and Starting Session...");
                await startSession(session.id);
            }
        }
    };

    const handleEndSession = async () => {
        if (!session) return;

        // Save transcript
        const sessionData = {
            id: session.id,
            topic: session.topic,
            transcript: session.transcript?.join('\n') || '',
            timestamp: new Date().toISOString(),
        };

        const existingTranscripts = JSON.parse(localStorage.getItem('sessionTranscripts') || '[]');
        existingTranscripts.push(sessionData);
        localStorage.setItem('sessionTranscripts', JSON.stringify(existingTranscripts));

        // Stop camera and recognition
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
        }

        // Notify others
        sendSignal('leave', '', '');

        // End session for all (This triggers backend AI report generation)
        await endSession(session.id, session.transcript);
        navigate('/reports');
    };

    const handleLeaveSession = async () => {
        // Stop camera and recognition locally
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
        }

        // Notify others
        sendSignal('leave', '', '');

        // Just navigate away
        navigate('/reports');
    };

    const handleAdmitParticipant = (participantId: string) => {
        if (session && isHost) {
            admitFromWaiting(session.id, participantId);
        }
    };

    const downloadTranscript = () => {
        if (!session || !session.transcript) return;

        // Format transcript like a book/script
        const formattedTranscript = session.transcript.map(line => {
            // Existing line is likely "Name: Message" or just "Message"
            // We can just keep it as is, or add a timestamp if we had it.
            // Since we only store strings, we'll double space for readability
            return line + "\n";
        }).join('\n');

        const header = `GROUP DISCUSSION TRANSCRIPT\nTopic: ${session.topic}\nDate: ${new Date().toLocaleDateString()}\n----------------------------------------\n\n`;

        const element = document.createElement("a");
        const file = new Blob([header + formattedTranscript], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `Transcript - ${session.topic.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.txt`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };

    const handleLanguageChange = (langCode: string) => {
        setSelectedLanguage(langCode);
        setAnchorElLang(null);

        // Restart recognition with new language
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current.lang = langCode;
            console.log("Language changed to:", langCode);
            // Note: onend will auto-restart if 'isRecording' is true (which logic isn't fully robust here but let's assume auto-restart loop handles it)
        }
    };

    // Auto-lock logic (Keep Only Lock)
    useEffect(() => {
        if (!session || !isHost) return;

        const activeParticipants = session.participants.filter(p => !p.isHost || session.hostRole !== 'OBSERVER');
        if (session.maxParticipants && activeParticipants.length >= session.maxParticipants && !session.isLocked) {
            // Optional: You might want to ask before locking, or auto-lock is fine but don't auto-start
            // lockSession(session.id); 
        }
        // REMOVED AUTO-START
    }, [session, isHost]);

    // Effect to start/stop recording based on Session Status ('LIVE')
    useEffect(() => {
        if (session?.status === 'LIVE' && !isRecording && recognitionRef.current) {
            console.log("Session is LIVE. Starting recording...");
            shouldRecordRef.current = true;
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) { console.error("Rec start error", e); }
        } else if (session?.status !== 'LIVE' && isRecording && recognitionRef.current) {
            console.log("Session not LIVE. Stopping recording...");
            shouldRecordRef.current = false;
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    }, [session?.status]);


    // Helper to parse Spring Boot dates (ISO string or Array)
    const parseSpringDate = (dateVal: any): Date | null => {
        if (!dateVal) return null;
        if (Array.isArray(dateVal)) {
            // [year, month, day, hour, minute, second, nano]
            // Note: Month is 1-indexed in Java, 0-indexed in JS? No, java.time is 1-indexed. JS is 0-indexed.
            // Wait, JSON usually sends numbers. New Date(y, m-1, d, h, m, s)
            const [y, m, d, h, min, s] = dateVal;
            return new Date(y, m - 1, d, h, min, s);
        }
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? null : d;
    };

    // Effect for Session Validation and Timer
    useEffect(() => {
        if (!loading && !session) {
            const timer = setTimeout(() => navigate('/join'), 3000);
            return () => clearTimeout(timer);
        }

        if (session) {
            setCurrentSession(session);
        }

        // Timer countdown
        if (session) {
            const interval = setInterval(() => {
                const limit = session.timeLimit || 60; // Default to 60 mins

                let elapsed = 0;
                if (session.startTime) {
                    const startDate = parseSpringDate(session.startTime);
                    if (startDate) {
                        elapsed = Math.floor((Date.now() - startDate.getTime()) / 60000);
                    } else {
                        // console.warn("Invalid Start Time format:", session.startTime);
                    }
                }

                const remaining = limit - elapsed;

                if (remaining <= 0) {
                    if (!isConclusionPhase) {
                        setIsConclusionPhase(true);
                        setTimeRemaining(2); // 2 minutes for conclusion
                    } else {
                        setTimeRemaining(remaining > 0 ? remaining : 0);

                        // Auto-End Safeguard: Only end if reasonable overtime (e.g. between -2 and -120 mins)
                        // This prevents 1970-epoch bugs (huge negative numbers) from killing the session.
                        if (isHost && session.startTime && remaining <= -2 && remaining > -1000) {
                            console.warn("Auto-End Condition Met: Session exceeded time limit by 2 mins.");
                            console.log("Debug Auto-End:", { remaining, startTime: session.startTime, now: Date.now() });
                            handleEndSession();
                        }
                    }
                } else {
                    setTimeRemaining(remaining);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [session, id, navigate, loading, isHost]);

    // Effect for Camera and WebSocket Initialization
    useEffect(() => {
        if (!id || !userEmail) return;

        let mounted = true;

        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                if (!mounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                // Initialize Speech Recognition
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                    recognitionRef.current = new SpeechRecognition();
                    recognitionRef.current.continuous = true;
                    recognitionRef.current.interimResults = false;
                    recognitionRef.current.lang = selectedLanguage || 'en-US'; // Use state
                    console.log("Speech Recognition Initialized with Language:", recognitionRef.current.lang);

                    // Use Ref to avoid stale closures in callbacks
                    // const isRecordingRef = { current: true }; // OBSOLETE

                    recognitionRef.current.onresult = (event: any) => {
                        const resultsLength = event.results.length;
                        const result = event.results[resultsLength - 1];

                        // Fix: Only process finalized sentences
                        if (!result.isFinal) return;

                        const transcript = result[0].transcript;

                        if (!transcript || transcript.trim().length === 0) return;

                        console.log("Speech recognized (Final):", transcript);

                        // Get the best display name using Ref
                        const currentSessionData = sessionRef.current;
                        const currentParticipant = currentSessionData?.participants?.find((p: any) => p.email === userEmail);
                        const displayName = currentParticipant?.name || userEmail?.split('@')[0] || "Unknown";

                        const text = `${displayName}: ${transcript}`;

                        // Optimistic Local Echo
                        addToTranscript(id!, text);

                        if (stompClientRef.current && stompClientRef.current.connected) {
                            console.log("Sending transcript to backend:", text);
                            stompClientRef.current.send("/app/chat", {}, JSON.stringify({
                                sessionId: id,
                                sender: userEmail,
                                text: text
                            }));
                        } else {
                            console.warn("WebSocket not connected, cannot send transcript");
                        }
                    };

                    recognitionRef.current.onerror = (event: any) => {
                        console.error("Speech recognition error:", event.error);
                        if (event.error === 'not-allowed') {
                            setAiFeedback({ message: "Microphone access denied for transcript.", type: "error", score: 0 });
                        }
                    };

                    recognitionRef.current.onend = () => {
                        // Fix: Only restart if we actually WANT to be recording
                        if (mounted && shouldRecordRef.current) {
                            console.log("Speech recognition ended unexpectedly, attempting restart...");
                            setTimeout(() => {
                                if (mounted && recognitionRef.current && shouldRecordRef.current) {
                                    try {
                                        recognitionRef.current.start();
                                    } catch (e) {
                                        // Warning: checking 'started' is hard, try/catch is best
                                    }
                                }
                            }, 1000);
                        } else {
                            console.log("Speech recognition ended (Intentional or Unmounted).");
                        }
                    };

                    try {
                        // Initial start only if session is LIVE or logic demands
                        if (sessionRef.current?.status === 'LIVE') {
                            shouldRecordRef.current = true;
                            recognitionRef.current.start();
                            setIsRecording(true);
                        }
                    } catch (e) { console.error("Initial start failed", e); }

                } else {
                    console.warn("Speech Recognition API not supported.");
                }

                // Connect WebSocket
                const socket = new SockJS('/ws');
                const stompClient = Stomp.over(socket);
                stompClient.debug = () => { };

                stompClient.connect({}, () => {
                    if (!mounted) return;
                    stompClientRef.current = stompClient;

                    stompClient.subscribe(`/topic/session/${id}`, (message) => {
                        const payload = JSON.parse(message.body);

                        // Check for session end signal
                        if (payload.status === 'COMPLETED') {
                            alert('The host has ended the session.');
                            navigate('/reports');
                            return;
                        }

                        // Check for Session Object Update (Contains ID and Participants)
                        if (payload.id === id && payload.participants) {
                            console.log("Session Update Received:", payload);
                            setLiveSession(payload);
                            setCurrentSession(payload);

                            // Specific check for START logic
                            if (payload.status === 'LIVE' && (!session?.status || session.status !== 'LIVE')) {
                                console.log("Session unexpectedly became LIVE via WS");
                            }
                        }

                        // Check for Session Status Update (Legacy/Specific check)
                        if (payload.status === 'LIVE') {
                            // Handled above generally, but keeping if specific logic needed
                        }

                        if (payload.type === 'AI_FEEDBACK' && payload.targetUser === userEmail) {
                            const content = JSON.parse(payload.content);
                            setAiFeedback({
                                message: content.feedback,
                                score: content.score,
                                type: content.strength
                            });
                            setTimeout(() => setAiFeedback(null), 10000);
                            return;
                        }

                        if (payload.type && payload.sender !== userEmail) {
                            handleSignalMessage(payload, stream);
                        }


                        if (payload.text && payload.sender && payload.sender !== userEmail) {
                            addToTranscript(id!, payload.text);
                        }
                    });

                    stompClient.send("/app/signal", {}, JSON.stringify({
                        type: 'join',
                        sender: userEmail,
                        sessionId: id
                    }));
                });

            } catch (err) {
                console.error("Error accessing camera:", err);
                if (mounted) setCameraError("Could not access camera/microphone. Please check permissions.");
            }
        };

        init();

        return () => {
            mounted = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect(() => { });
            }
            Object.values(peersRef.current).forEach(pc => pc.close());
        };
    }, [id, userEmail]); // Re-run if ID checks (should limit re-runs, removed selectedLanguage to avoid full reconnect)
    // Note: selectedLanguage change is handled by handleLanguageChange directly manipulating the Ref.

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading session...</Typography>
            </Box>
        );
    }

    if (!session) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <Typography variant="h5" color="error" gutterBottom>Session Not Found</Typography>
                <Typography color="text.secondary">Redirecting to join page...</Typography>
            </Box>
        );
    }

    if (cameraError) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <Typography variant="h5" color="error" gutterBottom>Camera Error</Typography>
                <Typography color="text.secondary">{cameraError}</Typography>
                <Button variant="contained" onClick={() => navigate('/join')} sx={{ mt: 2 }}>Go Back</Button>
            </Box>
        );
    }

    const progress = session.startTime
        ? ((Date.now() - new Date(session.startTime).getTime()) / ((session.timeLimit || 60) * 60000)) * 100
        : 0;

    return (
        <Box sx={{ height: 'calc(100vh - 64px)' }}>
            {/* Header */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight="bold">{session.topic}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 0.5 }}>
                        <Chip
                            icon={<Clock size={14} />}
                            label={
                                !session.startTime
                                    ? "Waiting to start..."
                                    : (isConclusionPhase ? "Conclusion Phase (2m)" : `${timeRemaining} min remaining`)
                            }
                            size="small"
                            color={!session.startTime ? 'default' : (isConclusionPhase ? 'error' : (timeRemaining < 5 ? 'warning' : 'primary'))}
                        />
                        <Chip
                            icon={<Hash size={14} />}
                            label={`Code: ${session.code}`}
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                navigator.clipboard.writeText(session.code);
                                setShowInvite(true);
                            }}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        />
                        <Chip
                            icon={<Users size={14} />}
                            // Fix: Show total participants including host if active
                            label={`${(session.participants?.length || 0)}/${session.maxParticipants || '∞'}`}
                            size="small"
                        />
                        {
                            session.status === 'LIVE' ? (
                                <Chip label="LIVE" size="small" color="success" />
                            ) : (
                                <Chip label="NOT STARTED" size="small" color="warning" />
                            )
                        }

                        {
                            isRecording && session.status === 'LIVE' && (
                                <Chip
                                    icon={<div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white', animation: 'pulse 1.5s infinite' }} />}
                                    label="Recording"
                                    size="small"
                                    color="error"
                                    sx={{ '@keyframes pulse': { '0%': { opacity: 1 }, '50%': { opacity: 0.5 }, '100%': { opacity: 1 } } }}
                                />
                            )
                        }
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {isHost && session.waitingList?.length > 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<UserCheck size={18} />}
                            onClick={() => setShowWaitingList(true)}
                            sx={{ borderRadius: 2 }}
                        >
                            Waiting ({session.waitingList?.length || 0})
                        </Button>
                    )}
                    {isHost && !session.isLocked && (
                        <Button
                            variant="outlined"
                            startIcon={<Lock size={18} />}
                            onClick={handleLockSession}
                            sx={{ borderRadius: 2 }}
                        >
                            Lock Meeting
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<Copy size={18} />}
                        onClick={handleCopyInvite}
                        sx={{ borderRadius: 2 }}
                    >
                        {session.type === 'public' ? 'Copy Link' : 'Copy Code'}
                    </Button>

                    <Button
                        variant="soft"
                        startIcon={<Languages size={18} />}
                        onClick={(e) => setAnchorElLang(e.currentTarget)}
                        sx={{ borderRadius: 2, minWidth: 40 }}
                        title="Change Language"
                    >
                        {selectedLanguage.split('-')[0].toUpperCase()}
                    </Button>
                    <Menu
                        anchorEl={anchorElLang}
                        open={Boolean(anchorElLang)}
                        onClose={() => setAnchorElLang(null)}
                    >
                        <MenuItem onClick={() => handleLanguageChange('en-US')}>English (Global)</MenuItem>
                        <MenuItem onClick={() => handleLanguageChange('en-IN')}>English (India/Hinglish)</MenuItem>
                        <MenuItem onClick={() => handleLanguageChange('hi-IN')}>Hindi (India)</MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Progress Bar */}
            <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                sx={{ mb: 2, height: 6, borderRadius: 3 }}
            />

            <Grid container spacing={2} sx={{ height: 'calc(100% - 120px)' }}>
                {/* Video Grid */}
                <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: Object.keys(peers).length > 0 ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr',
                        gap: 2,
                        height: '100%',
                        overflowY: 'auto'
                    }}>
                        {/* Hide local video if Observer */}
                        {(!isHost || session.hostRole !== 'OBSERVER') && (
                            <Paper
                                elevation={0}
                                sx={{
                                    bgcolor: '#000',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    aspectRatio: '16/9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)',
                                        display: isVideoOff ? 'none' : 'block'
                                    }}
                                />

                                {isVideoOff && (
                                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                                        <VideoOff size={64} />
                                        <Typography sx={{ mt: 2 }}>Camera Off</Typography>
                                    </Box>
                                )}

                                <Box sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 2, py: 0.5, borderRadius: 2 }}>
                                    <Typography variant="caption" fontWeight="bold">You ({isHost ? 'Host' : 'Participant'})</Typography>
                                </Box>
                            </Paper>
                        )}

                        {/* Remote Peers */}
                        {Object.entries(peers).map(([id, peer]) => (
                            <Paper
                                key={id}
                                elevation={0}
                                sx={{
                                    bgcolor: '#000',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    aspectRatio: '16/9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <video
                                    autoPlay
                                    playsInline
                                    ref={el => {
                                        if (el) el.srcObject = peer.stream;
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <Box sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 2, py: 0.5, borderRadius: 2 }}>
                                    <Typography variant="caption" fontWeight="bold">{peer.name}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    {/* Controls - Hide if Observer */}
                    {
                        (!isHost || session.hostRole !== 'OBSERVER') && (
                            <Box sx={{
                                position: 'fixed',
                                bottom: 30,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: 2,
                                bgcolor: 'rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(10px)',
                                p: 1.5,
                                borderRadius: 3,
                                zIndex: 1000
                            }}>
                                <IconButton
                                    onClick={toggleAudio}
                                    sx={{ bgcolor: isMuted ? 'error.main' : 'rgba(255,255,255,0.2)', color: 'white' }}
                                >
                                    {isMuted ? <MicOff /> : <Mic />}
                                </IconButton>
                                <IconButton
                                    onClick={toggleVideo} // Updated handler
                                    sx={{ bgcolor: isVideoOff ? 'error.main' : 'rgba(255,255,255,0.2)', color: 'white' }}
                                >
                                    {isVideoOff ? <VideoOff /> : <VideoIcon />}
                                </IconButton>
                                <IconButton
                                    onClick={toggleRecording}
                                    sx={{ bgcolor: isRecording ? 'success.main' : 'rgba(255,255,255,0.2)', color: 'white' }}
                                >
                                    <MessageSquare />
                                </IconButton>
                                <IconButton
                                    onClick={() => setShowEndDialog(true)}
                                    sx={{ bgcolor: 'error.main', color: 'white' }}
                                >
                                    <Users /> {/* Changed icon to represent Leaving vs Ending Phone */}
                                </IconButton>
                            </Box>
                        )
                    }
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        {/* Transcript Header */}
                        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MessageSquare size={20} />
                                <Typography fontWeight="bold">Live Transcript</Typography>
                            </Box>
                            <IconButton size="small" onClick={downloadTranscript}>
                                <Download size={18} />
                            </IconButton>
                        </Box>

                        {/* Transcript Body */}
                        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                            {session.transcript?.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <MessageSquare size={48} color="#ccc" />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                        {isRecording ? 'Listening for speech...' : 'Recording paused'}
                                    </Typography>
                                    {isRecording && <LinearProgress sx={{ mt: 2, width: '50%', mx: 'auto', borderRadius: 2 }} />}
                                </Box>
                            ) : (
                                session.transcript?.map((t: string, i: number) => (
                                    <Box key={i} sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="primary" fontWeight="bold">
                                            {t.split(':')[0]}
                                        </Typography>
                                        <Typography variant="body2" sx={{ bgcolor: 'action.hover', color: 'text.primary', p: 1.5, borderRadius: 2, mt: 0.5, border: '1px solid', borderColor: 'divider' }}>
                                            {t.split(':').slice(1).join(':')}
                                        </Typography>
                                    </Box>
                                ))
                            )}
                        </Box>

                        <Divider />

                        {/* Participants */}
                        <Box sx={{ p: 2 }}>
                            <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                PARTICIPANTS ({session.participants?.length || 0})
                            </Typography>
                            <List dense>
                                {session.participants?.map((p: any) => (
                                    <ListItem key={p.id} sx={{ px: 0 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: p.isHost ? 'primary.main' : 'grey.400' }}>
                                                {p.name[0].toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={p.name}
                                            secondary={p.isHost ? 'Host' : 'Participant'}
                                            primaryTypographyProps={{ variant: 'body2' }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Snackbar */}
            <Snackbar open={showInvite} autoHideDuration={3000} onClose={() => setShowInvite(false)}>
                <Alert severity="success">
                    {session.type === 'public' ? 'Link copied!' : 'Code copied!'}
                </Alert>
            </Snackbar>

            {/* AI Feedback Snackbar */}
            <Snackbar
                open={!!aiFeedback}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={() => setAiFeedback(null)}
            >
                <Alert severity="info" icon={<MessageSquare />} sx={{ width: '100%', bgcolor: 'primary.dark', color: 'white' }}>
                    <Typography variant="subtitle2" fontWeight="bold">AI Coach Tip (Score: {aiFeedback?.score}/10)</Typography>
                    <Typography variant="body2">{aiFeedback?.message}</Typography>
                </Alert>
            </Snackbar>

            {/* Leave/End Session Dialog */}
            <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
                <DialogTitle>{isHost ? "End or Leave Session?" : "Leave Session?"}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {isHost
                            ? "Do you want to end the session and generate reports for everyone, or just leave temporarily?"
                            : "Are you sure you want to leave this session? The session will continue for others."}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEndDialog(false)}>Cancel</Button>
                    {isHost && (
                        <Button variant="outlined" color="error" onClick={handleEndSession}>
                            End & Generate Reports
                        </Button>
                    )}
                    <Button variant="contained" color={isHost ? "primary" : "error"} onClick={handleLeaveSession}>
                        Leave Session
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Waiting List Dialog */}
            <Dialog open={showWaitingList} onClose={() => setShowWaitingList(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Waiting Room ({session.waitingList?.length || 0})</DialogTitle>
                <DialogContent>
                    <List>
                        {session.waitingList?.map((p: any) => (
                            <ListItem
                                key={p.id}
                                secondaryAction={
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => handleAdmitParticipant(p.id)}
                                    >
                                        Admit
                                    </Button>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>{p.name[0].toUpperCase()}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={p.name} secondary={p.email} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowWaitingList(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LiveGD;
