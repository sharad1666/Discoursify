import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

export interface StatSession {
    id: string;
    date: string;
    fullDate: Date;
    score: number;
    raw: any;
}

export interface SkillData {
    subject: string;
    A: number;
    fullMark: number;
}

export interface UserStats {
    participationScore: number;
    reportsCount: number;
    meetingsJoined: number;
    improvement: string;
    skills: SkillData[];
    history: StatSession[];
    strengths: string[];
    weaknesses: string[];
    recentSessions: StatSession[];
}

export const useUserStats = () => {
    const { userEmail } = useAuth();
    const { sessions: allSessions } = useSession(); // Get sessions from context for attendance
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!userEmail) {
                setLoading(false);
                return;
            }

            try {
                const API_URL = import.meta.env.VITE_API_URL || '/api';
                const response = await axios.get(`${API_URL}/reports/user/${userEmail}`);
                const reports = response.data;

                // 1. Process Reports History
                const history: StatSession[] = reports
                    .map((r: any) => {
                        const content = r.content || '';
                        const scoreMatch = content.match(/\*\*?Score\*\*?:?\s*(\d+(\.\d+)?)\s*\/\s*10/i);
                        const score = scoreMatch ? parseFloat(scoreMatch[1]) * 10 : 0;
                        const dateObj = new Date(r.createdAt);

                        return {
                            id: r.id || r.sessionId,
                            date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                            time: dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                            fullDate: dateObj,
                            score,
                            raw: { ...r, content: content }
                        };
                    })
                    .filter((h: any) => h.score > 0) // Filter invalid/pending reports
                    .sort((a: any, b: any) => a.fullDate.getTime() - b.fullDate.getTime());

                // 2. Calculate Averages & Skills Per Session
                let totalComm = 0, totalConf = 0, totalLogic = 0, totalList = 0, totalCont = 0, totalLead = 0;
                let skillCount = 0;

                const scores = history.map(h => h.score);
                const avgScore = scores.length > 0
                    ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
                    : 0;

                // Skills Analysis Loop
                history.forEach((h) => {
                    const text = h.raw.content.toLowerCase();
                    const base = h.score; // Use the report score as baseline (0-100)

                    // Modifiers (capped relative variants)
                    let sComm = base, sConf = base, sLogic = base, sList = base, sCont = base, sLead = base;

                    // Heuristics applied to specific session score
                    if (text.includes('clear') || text.includes('articulate')) sComm += 5;
                    if (text.includes('mumble') || text.includes('fast')) sComm -= 5;

                    if (text.includes('confident') || text.includes('strong voice')) sConf += 5;
                    if (text.includes('nervous') || text.includes('hesitant')) sConf -= 5;

                    if (text.includes('structured') || text.includes('logical')) sLogic += 5;
                    if (text.includes('scattered')) sLogic -= 5;

                    if (text.includes('listening') || text.includes('acknowledged')) sList += 5;
                    if (text.includes('interrupt')) sList -= 10;

                    if (text.includes('relevant') || text.includes('good example')) sCont += 5;
                    if (text.includes('off-topic')) sCont -= 5;

                    totalComm += sComm;
                    totalConf += sConf;
                    totalLogic += sLogic;
                    totalList += sList;
                    totalCont += sCont;
                    totalLead += sLead;
                    skillCount++;
                });

                const calculateAvgSkill = (total: number) => skillCount > 0 ? Math.min(100, Math.max(10, Math.round(total / skillCount))) : 0;

                const skillsData = [
                    { subject: 'Communication', A: calculateAvgSkill(totalComm), fullMark: 100 },
                    { subject: 'Confidence', A: calculateAvgSkill(totalConf), fullMark: 100 },
                    { subject: 'Logic', A: calculateAvgSkill(totalLogic), fullMark: 100 },
                    { subject: 'Listening', A: calculateAvgSkill(totalList), fullMark: 100 },
                    { subject: 'Content', A: calculateAvgSkill(totalCont), fullMark: 100 },
                    { subject: 'Leadership', A: calculateAvgSkill(totalLead), fullMark: 100 },
                ];

                // 3. Calculate Improvement
                let improvement = 0;
                if (scores.length >= 2) {
                    const first = scores[0];
                    const last = scores[scores.length - 1];
                    improvement = Number((last - first).toFixed(1));
                }

                // 4. Meetings Joined
                const meetingsJoined = allSessions.filter(s =>
                    (s.participants && s.participants.some((p: any) => p.email === userEmail)) ||
                    s.hostEmail === userEmail
                ).length;

                // 5. Recent Sessions Formatting (Add time if multiple on same day)
                const recentHistory = [...history].reverse().slice(0, 5);
                const recentSessions = recentHistory.map((s, i, arr) => {
                    // Check if date is unique in this subset
                    const isUniqueDate = arr.filter(x => x.date === s.date).length === 1;
                    return {
                        ...s,
                        date: isUniqueDate ? s.date : `${s.date} ${s.time}` // Use time if needed
                    };
                }).reverse(); // Put back in chronological order for graph? 
                // Wait, graph reads left-to-right (old-to-new). User wants recent. 
                // Usually "Recent Sessions" list is Newest First. Graph is Oldest First.
                // Let's return recentSessions (List) as Newest First. 
                // But for Graph, we need Oldest First.

                // Let's separate them.
                // history is Oldest -> Newest.
                const graphData = history.slice(-10); // Last 10 points for graph
                const graphFormatted = graphData.map((s, i, arr) => {
                    const isUniqueDate = arr.filter(x => x.date === s.date).length === 1;
                    return {
                        ...s,
                        date: isUniqueDate ? s.date : `${s.date} ${s.time}`
                    };
                });

                // Extract Strengths/Weaknesses
                let allStrengths: string[] = [];
                let allWeaknesses: string[] = [];
                history.forEach(h => {
                    const rawContent = h.raw.content;
                    if (rawContent.match(/\*\*Analysis\*\*.*(clear|articulate)/s)) allStrengths.push('Clear Articulation');
                    if (rawContent.match(/\*\*Analysis\*\*.*(confident|strong)/s)) allStrengths.push('Confidence');
                    if (rawContent.match(/\*\*Analysis\*\*.*(structured|organized)/s)) allStrengths.push('Structured Thinking');

                    const improvementSection = rawContent.split('Improvements')[1] || '';
                    if (improvementSection.includes('pause') || improvementSection.includes('fillers')) allWeaknesses.push('Reduce Fillers');
                    if (improvementSection.includes('eye contact')) allWeaknesses.push('Eye Contact');
                    if (improvementSection.includes('interrupt')) allWeaknesses.push('Patience');
                });

                const uniqueStrengths = [...new Set(allStrengths)].slice(0, 4);
                const uniqueWeaknesses = [...new Set(allWeaknesses)].slice(0, 4);

                setStats({
                    participationScore: avgScore,
                    reportsCount: reports.length,
                    meetingsJoined: meetingsJoined,
                    improvement: improvement.toFixed(1),
                    skills: skillsData,
                    history: graphFormatted, // Use formatted history for graph
                    strengths: uniqueStrengths.length > 0 ? uniqueStrengths : ['Consistent Participation', 'Clear Voice'],
                    weaknesses: uniqueWeaknesses.length > 0 ? uniqueWeaknesses : ['Structure Arguments', 'Active Listening'],
                    recentSessions: [...history].reverse().slice(0, 5) // Recent list (Newest first)
                });

            } catch (err: any) {
                console.error('Error fetching user stats:', err);
                setError(err.message || 'Failed to load stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userEmail, allSessions]);

    return { stats, loading, error };
};
