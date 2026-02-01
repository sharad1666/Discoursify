package com.cdac.gd.controller;

import com.cdac.gd.model.Session;
import com.cdac.gd.model.Transcription;
import com.cdac.gd.repository.TranscriptionRepository;
import com.cdac.gd.service.KafkaProducerService;
import com.cdac.gd.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @Autowired
    private TranscriptionRepository transcriptionRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<Session> createSession(@RequestBody Session session) {
        return ResponseEntity.ok(sessionService.createSession(session));
    }

    @GetMapping
    public ResponseEntity<List<Session>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Session> getSession(@PathVariable UUID id) {
        Session session = sessionService.getSession(id);
        if (session != null) {
            return ResponseEntity.ok(session);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<Session> getSessionByCode(@PathVariable String code) {
        Session session = sessionService.getSessionByCode(code);
        if (session != null) {
            return ResponseEntity.ok(session);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Session> startSession(@PathVariable UUID id) {
        Session session = sessionService.startSession(id);
        if (session != null) {
            // Broadcast session update so participants know it started
            messagingTemplate.convertAndSend("/topic/session/" + id, session);
            return ResponseEntity.ok(session);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<Session> endSession(@PathVariable UUID id, @RequestBody Map<String, Object> payload) {
        List<String> transcript = (List<String>) payload.get("transcript");
        Session session = sessionService.endSession(id, transcript);
        if (session != null) {
            // Broadcast session update to notify participants
            messagingTemplate.convertAndSend("/topic/session/" + id, session);
            return ResponseEntity.ok(session);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        if (sessionService.deleteSession(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Session> joinSession(@PathVariable UUID id,
            @RequestBody com.cdac.gd.model.Participant participant) {
        Session session = sessionService.joinSession(id, participant);
        if (session != null) {
            System.out.println("JOIN SESSION: " + session.getId() + " STATUS: " + session.getStatus());
            // Broadcast session update to specific session topic
            messagingTemplate.convertAndSend("/topic/session/" + id, session);
            // Also broadcast to global for dashboard/lists
            messagingTemplate.convertAndSend("/topic/sessions", session);
            return ResponseEntity.ok(session);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/admit/{participantId}")
    public ResponseEntity<Session> admitParticipant(@PathVariable UUID id, @PathVariable String participantId) {
        Session session = sessionService.admitParticipant(id, participantId);
        if (session != null) {
            // Broadcast session update to specific session topic
            messagingTemplate.convertAndSend("/topic/session/" + id, session);
            messagingTemplate.convertAndSend("/topic/sessions", session);
            return ResponseEntity.ok(session);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/regenerate-report")
    public ResponseEntity<Session> regenerateReport(@PathVariable UUID id) {
        Session session = sessionService.regenerateReport(id);
        if (session != null) {
            return ResponseEntity.ok(session);
        }
        return ResponseEntity.status(500).build(); // Return 500 if regeneration fails
    }

    @MessageMapping("/chat")
    public void handleTranscript(@Payload Map<String, String> payload) {
        String sessionId = payload.get("sessionId");
        String sender = payload.get("sender");
        String text = payload.get("text");

        System.out.println("Received transcript: " + text + " from " + sender + " for session " + sessionId); // Debug
                                                                                                              // log

        if (sessionId != null && text != null) {
            // Save to DB
            Transcription transcription = new Transcription();
            transcription.setSessionId(UUID.fromString(sessionId));
            transcription.setSpeakerId(sender);
            transcription.setText(text);
            transcription.setTimestamp(LocalDateTime.now());
            transcriptionRepository.save(transcription);

            // Send to Kafka for AI processing
            kafkaProducerService.sendTranscript(sessionId, sender, text);

            // Broadcast to other participants
            messagingTemplate.convertAndSend("/topic/session/" + sessionId, payload);
        }
    }
}
