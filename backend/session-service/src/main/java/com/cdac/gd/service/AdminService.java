package com.cdac.gd.service;

import com.cdac.gd.model.Session;
import com.cdac.gd.model.User;
import com.cdac.gd.repository.SessionRepository;
import com.cdac.gd.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.*;
import com.cdac.gd.model.AuditLog;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private com.cdac.gd.repository.TranscriptionRepository transcriptionRepository;

    // Get system statistics (Can read all tables due to shared DB)
    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("active");
        long totalSessions = sessionRepository.count();
        long activeSessions = sessionRepository.countByStatusIn(Arrays.asList("LIVE", "SCHEDULED"));

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("totalSessions", totalSessions);
        stats.put("activeSessions", activeSessions);

        Double avgDuration = sessionRepository.getAverageSessionDuration();
        stats.put("avgSessionDuration", (avgDuration != null ? Math.round(avgDuration) : 0) + " min");

        return stats;
    }

    // Get active sessions
    public List<Session> getActiveSessions() {
        return sessionRepository.findByStatusIn(Arrays.asList("LIVE", "SCHEDULED"));
    }

    // Force end session
    public void forceEndSession(UUID sessionId, String adminEmail, String ipAddress) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            Session session = sessionOpt.get();
            session.setStatus("COMPLETED");
            session.setEndTime(LocalDateTime.now());

            List<com.cdac.gd.model.Transcription> transcriptions = transcriptionRepository.findBySessionId(sessionId);
            List<String> transcriptList = new java.util.ArrayList<>();
            for (com.cdac.gd.model.Transcription t : transcriptions) {
                transcriptList.add(t.getSpeakerId() + ": " + t.getText());
            }
            session.setTranscript(transcriptList);

            sessionRepository.save(session);

            auditLogService.logAction(
                    "SESSION_FORCE_ENDED",
                    adminEmail,
                    "SESSION",
                    sessionId.toString(),
                    String.format("Session '%s' was forcefully ended by admin", session.getTopic()),
                    ipAddress);
        } else {
            throw new RuntimeException("Session not found");
        }
    }

    // Get system logs
    public List<AuditLog> getSystemLogs(String level, int limit) {
        return auditLogService.getRecentLogs();
    }
}
