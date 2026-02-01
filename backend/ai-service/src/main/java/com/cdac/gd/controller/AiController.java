package com.cdac.gd.controller;

import com.cdac.gd.service.AiEvaluationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private AiEvaluationService aiService;

    @PostMapping("/evaluate")
    public ResponseEntity<String> evaluate(@RequestBody Map<String, String> payload) {
        String transcript = payload.get("transcript");
        String topic = payload.getOrDefault("topic", "General Discussion");
        return ResponseEntity.ok(aiService.generateIndividualReport("USER", transcript, topic));
    }

    @PostMapping("/analyze-news")
    public ResponseEntity<String> analyzeNews(@RequestBody Map<String, String> payload) {
        String text = payload.get("text");
        System.out.println("Processing analyze-news request for text length: " + (text != null ? text.length() : 0));
        return ResponseEntity.ok(aiService.analyzeNews(text));
    }

    @PostMapping("/generate-topics")
    public ResponseEntity<String> generateTopics(@RequestBody(required = false) Map<String, String> payload) {
        String category = (payload != null) ? payload.getOrDefault("category", "Random") : "Random";
        return ResponseEntity.ok(aiService.generateGDTopics(category));
    }

    @PostMapping("/explain-topic")
    public ResponseEntity<String> explainTopic(@RequestBody Map<String, String> payload) {
        String topic = payload.get("topic");
        return ResponseEntity.ok(aiService.explainTopic(topic));
    }

    @PostMapping("/key-points")
    public ResponseEntity<String> getKeyPoints(@RequestBody Map<String, String> payload) {
        String topic = payload.get("topic");
        return ResponseEntity.ok(aiService.generateKeyPoints(topic));
    }

    @PostMapping("/debate/motion")
    public ResponseEntity<String> generateDebateMotion(@RequestBody Map<String, String> payload) {
        String text = payload.get("text");
        return ResponseEntity.ok(aiService.generateDebateMotion(text));
    }

    @PostMapping("/debate/evaluate")
    public ResponseEntity<String> evaluateArgument(@RequestBody Map<String, String> payload) {
        String motion = payload.get("motion");
        String argument = payload.get("argument");
        return ResponseEntity.ok(aiService.evaluateArgument(motion, argument));
    }

    @PostMapping("/dictionary")
    public ResponseEntity<String> getWordDefinition(@RequestBody Map<String, String> payload) {
        String word = payload.get("word");
        return ResponseEntity.ok(aiService.getWordDefinition(word));
    }

    @PostMapping("/generate-phrase")
    public ResponseEntity<String> generatePhrase(@RequestBody Map<String, String> payload) {
        String context = payload.get("context");
        String intent = payload.get("intent");
        return ResponseEntity.ok(aiService.generatePhrase(context, intent));
    }
}
