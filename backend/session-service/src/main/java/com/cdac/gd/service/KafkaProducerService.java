package com.cdac.gd.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    private static final String TOPIC = "gd-transcripts";

    public void sendTranscript(String sessionId, String sender, String text) {
        String jsonMessage = String.format("{\"sessionId\": \"%s\", \"sender\": \"%s\", \"text\": \"%s\"}",
                sessionId, sender, escapeJson(text));
        kafkaTemplate.send(TOPIC, jsonMessage);
    }

    private String escapeJson(String text) {
        return text.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
