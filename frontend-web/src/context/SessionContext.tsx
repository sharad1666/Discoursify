import React, { createContext, useContext, useState, type ReactNode } from 'react';
import axios from 'axios';
// @ts-ignore
import SockJS from 'sockjs-client';
// @ts-ignore
import Stomp from 'stompjs';

interface Participant {
    id: string;
    name: string;
    email: string;
    isHost: boolean;
    joinedAt: Date;
    speakingTime: number;
}

interface Session {
    id: string;
    topic: string;
    type: 'public' | 'private';
    code: string;
    hostId: string;
    hostEmail: string;
    timeLimit: number;
    startTime: Date | null;
    isLocked: boolean;
    hasWaitingRoom: boolean;
    participants: Participant[];
    waitingList: Participant[];
    transcript: string[];
    description?: string;
    status: string;
    endTime?: Date;
    maxParticipants?: number;
    hostRole?: 'PARTICIPANT' | 'OBSERVER';
}

interface SessionContextType {
    sessions: Session[];
    currentSession: Session | null;
    createSession: (session: Omit<Session, 'id' | 'code' | 'participants' | 'waitingList' | 'transcript' | 'startTime' | 'isLocked' | 'status'>, host?: Omit<Participant, 'id' | 'joinedAt' | 'speakingTime'>) => Promise<string>;
    joinSession: (sessionId: string, participant: Omit<Participant, 'id' | 'joinedAt' | 'speakingTime'>) => Promise<boolean>;
    joinByCode: (code: string, participant: Omit<Participant, 'id' | 'joinedAt' | 'speakingTime'>) => Promise<string | null>;
    lockSession: (sessionId: string) => void;
    startSession: (sessionId: string) => Promise<void>;
    endSession: (sessionId: string, transcript?: string[]) => Promise<void>;
    saveReport: (sessionId: string, report: any) => Promise<void>;
    admitFromWaiting: (sessionId: string, participantId: string) => Promise<void>;
    addToTranscript: (sessionId: string, text: string) => void;
    setCurrentSession: (session: Session | null) => void;
    loading: boolean;
    refreshSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSession, setCurrentSession] = useState<Session | null>(null);

    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || '/api';

    const refreshSessions = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/sessions`);
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all sessions on mount
    React.useEffect(() => {
        refreshSessions();
    }, []);

    const createSession = async (sessionData: Omit<Session, 'id' | 'code' | 'participants' | 'waitingList' | 'transcript' | 'startTime' | 'isLocked' | 'status'>, host?: Omit<Participant, 'id' | 'joinedAt' | 'speakingTime'>) => {
        const sessionPayload = {
            ...sessionData,
            code: generateCode(),
            participants: [],
            waitingList: [],
            transcript: [],
            startTime: null,
            isLocked: false,
            status: 'SCHEDULED'
        };

        try {
            const response = await axios.post(`${API_URL}/sessions`, sessionPayload);
            const createdSession = response.data;
            setSessions(prev => [...prev, createdSession]);

            if (host) {
                await joinSession(createdSession.id, host);
            }

            return createdSession.id;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    };

    const joinSession = async (sessionId: string, participantData: Omit<Participant, 'id' | 'joinedAt' | 'speakingTime'>) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session || session.isLocked) return false;

        // Check for existing participant
        const existingParticipant = session.participants.find(p => p.email === participantData.email);
        if (existingParticipant) {
            // If already joined, just set as current session and return true
            if (participantData.isHost || session.participants.length > 0) {
                // Ensure we have the full session object with correct structure if needed, 
                // but here we just need to set it as current.
                // Actually, let's just update currentSession to point to this session.
                setCurrentSession(session);
            }
            return true;
        }

        const participant: Participant = {
            ...participantData,
            id: `participant-${Date.now()}`,
            joinedAt: new Date(),
            speakingTime: 0,
        };

        try {
            await axios.post(`${API_URL}/sessions/${sessionId}/join`, participant);

            // Optimistic update
            setSessions(prev => prev.map(s => {
                if (s.id === sessionId) {
                    if (s.hasWaitingRoom && !participant.isHost) {
                        return { ...s, waitingList: [...s.waitingList, participant] };
                    } else {
                        const updatedSession = {
                            ...s,
                            participants: [...s.participants, participant],
                            startTime: s.startTime || new Date()
                        };
                        if (participant.isHost || s.participants.length === 0) {
                            setCurrentSession(updatedSession);
                        }
                        return updatedSession;
                    }
                }
                return s;
            }));
            return true;
        } catch (error) {
            console.error('Error joining session:', error);
            return false;
        }
    };

    const joinByCode = async (code: string, participantData: Omit<Participant, 'id' | 'joinedAt' | 'speakingTime'>) => {
        try {
            // First lookup session by code via API (robust check)
            const response = await axios.get(`${API_URL}/sessions/code/${code}`);
            const session = response.data;

            if (!session || session.status === 'COMPLETED') return null;

            const success = await joinSession(session.id, participantData);
            return success ? session.id : null;
        } catch (error) {
            console.error("Error finding session by code:", error);
            return null;
        }
    };

    const lockSession = (sessionId: string) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, isLocked: true } : s
        ));
        if (currentSession?.id === sessionId) {
            setCurrentSession(prev => prev ? { ...prev, isLocked: true } : null);
        }
    };

    const endSession = async (sessionId: string, transcript?: string[]) => {
        try {
            await axios.post(`${API_URL}/sessions/${sessionId}/end`, { transcript });
            // Update status to COMPLETED instead of removing
            setSessions(prev => prev.map(s =>
                s.id === sessionId ? { ...s, status: 'COMPLETED', endTime: new Date(), transcript: transcript || s.transcript } : s
            ));
            if (currentSession?.id === sessionId) {
                setCurrentSession(null);
            }
            // Refresh to get latest data (including potential reports)
            setTimeout(refreshSessions, 1000);
        } catch (error) {
            console.error('Error ending session:', error);
        }
    };

    const saveReport = async (sessionId: string, report: any) => {
        try {
            await axios.post(`${API_URL}/reports`, {
                sessionId,
                ...report
            });
        } catch (error) {
            console.error('Error saving report:', error);
        }
    };

    const admitFromWaiting = async (sessionId: string, participantId: string) => {
        try {
            const response = await axios.post(`${API_URL}/sessions/${sessionId}/admit/${participantId}`);
            const updatedSession = response.data;
            setSessions(prev => prev.map(s =>
                s.id === sessionId ? updatedSession : s
            ));

            // Also update current session if it matches
            if (currentSession?.id === sessionId) {
                setCurrentSession(updatedSession);
            }
        } catch (error) {
            console.error('Error admitting participant:', error);
        }
    };

    const addToTranscript = (sessionId: string, text: string) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, transcript: [...s.transcript, text] } : s
        ));
    };

    return (
        <SessionContext.Provider value={{
            sessions,
            currentSession,
            createSession,
            joinSession,
            joinByCode,
            lockSession,
            startSession: async (sessionId: string) => {
                try {
                    await axios.post(`${API_URL}/sessions/${sessionId}/start`);
                    setSessions(prev => prev.map(s =>
                        s.id === sessionId ? { ...s, startTime: new Date(), status: 'LIVE' } : s
                    ));
                    if (currentSession?.id === sessionId) {
                        setCurrentSession(prev => prev ? { ...prev, startTime: new Date(), status: 'LIVE' } : null);
                    }
                } catch (error) {
                    console.error('Error starting session:', error);
                }
            },
            endSession,
            saveReport,
            admitFromWaiting,
            addToTranscript,
            setCurrentSession,
            loading,
            refreshSessions,
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within SessionProvider');
    }
    return context;
};
