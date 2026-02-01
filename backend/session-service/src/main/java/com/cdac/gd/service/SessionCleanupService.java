package com.cdac.gd.service;

import com.cdac.gd.model.Session;
import com.cdac.gd.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SessionCleanupService {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private com.cdac.gd.repository.TranscriptionRepository transcriptionRepository;

    @Scheduled(fixedRate = 60000) // Run every minute
    @Transactional
    public void cleanupSessions() {
        List<Session> liveSessions = sessionRepository.findByStatus("LIVE");
        LocalDateTime now = LocalDateTime.now();

        for (Session session : liveSessions) {
            // Check if session has expired (endTime passed)
            if (session.getEndTime() != null && session.getEndTime().isBefore(now)) {

                // If no participants joined, delete the session
                if (session.getParticipants() == null || session.getParticipants().isEmpty()) {
                    UUID sessionId = session.getId();
                    sessionRepository.delete(session);
                    System.out.println("Deleted empty expired session: " + sessionId);

                    // Broadcast deletion
                    Map<String, Object> update = new HashMap<>();
                    update.put("id", sessionId);
                    update.put("status", "DELETED");
                    messagingTemplate.convertAndSend("/topic/sessions", update);
                } else {
                    // If participants joined, mark as COMPLETED and generate reports
                    session.setStatus("COMPLETED");

                    // Populate transcript from DB
                    List<com.cdac.gd.model.Transcription> transcriptions = transcriptionRepository
                            .findBySessionId(session.getId());
                    List<String> transcriptList = new java.util.ArrayList<>();
                    for (com.cdac.gd.model.Transcription t : transcriptions) {
                        transcriptList.add(t.getSpeakerId() + ": " + t.getText());
                    }
                    session.setTranscript(transcriptList);

                    sessionRepository.save(session);

                    // Broadcast completion
                    messagingTemplate.convertAndSend("/topic/sessions", session);

                    // TODO: Trigger AI Service via Kafka
                    System.out.println("Session Cleaned/Ended: " + session.getId());
                }
            }
        }
    }
}
