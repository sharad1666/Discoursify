package com.cdac.gd.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    @Autowired
    private AiEvaluationService aiService;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @KafkaListener(topics = "gd-transcripts", groupId = "gd-group")
    public void listen(String message) {
        try {
            // Parse JSON message
            com.fasterxml.jackson.databind.JsonNode json = objectMapper.readTree(message);
            String sessionId = json.get("sessionId").asText();
            String sender = json.get("sender").asText();
            String text = json.get("text").asText();

            // Only generate feedback for substantial input (> 5 words)
            if (text.split("\\s+").length > 5) {
                // Generate concise feedback
                String feedback = aiService.evaluateArgument("General Discussion", text);

                // Create feedback payload
                java.util.Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("type", "AI_FEEDBACK");
                payload.put("sender", "AI_COACH");
                payload.put("targetUser", sender);
                payload.put("content", feedback);
                payload.put("timestamp", java.time.LocalDateTime.now().toString());

                // Broadcast to session
                messagingTemplate.convertAndSend("/topic/session/" + sessionId, payload);
                System.out.println("Broadcasted AI Feedback to session " + sessionId);
            }
        } catch (Exception e) {
            System.err.println("Error processing Kafka message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
