package com.cdac.gd.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class KafkaConsumerService {

    @Autowired
    private AiEvaluationService aiService;

    @Autowired
    private ObjectMapper objectMapper;

    @KafkaListener(topics = "gd-transcripts", groupId = "gd-group")
    public void listen(String message) {
        try {
            // Parse JSON message
            JsonNode json = objectMapper.readTree(message);
            String sessionId = json.get("sessionId").asText();
            String sender = json.get("sender").asText();
            String text = json.get("text").asText();

            // Only generate feedback for substantial input (> 5 words)
            if (text.split("\\s+").length > 5) {
                // Generate concise feedback
                String feedback = aiService.evaluateArgument("General Discussion", text);

                // Log instead of broadcast (SimpMessagingTemplate removed)
                System.out.println("Generated AI Feedback for session " + sessionId + ": " + feedback);
            }
        } catch (Exception e) {
            System.err.println("Error processing Kafka message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
