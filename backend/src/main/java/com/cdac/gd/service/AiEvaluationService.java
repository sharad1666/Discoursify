package com.cdac.gd.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiEvaluationService {

    @Value("${github.token}")
    private String githubToken;

    private final RestTemplate restTemplate = new RestTemplate();

    // Using a hypothetical endpoint for GitHub Models / Copilot Chat API
    // In reality, this might need adjustment based on the exact API provider the
    // user intends.
    // For now, assuming OpenAI-compatible endpoint or similar.
    @org.springframework.beans.factory.annotation.Autowired
    private com.cdac.gd.repository.TranscriptionRepository transcriptionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.cdac.gd.repository.ReportRepository reportRepository;

    public String generateReport(String transcript) {
        String prompt = "You are an expert communication coach. Analyze the following transcript from a Group Discussion.\n"
                + "Transcript: \"" + transcript + "\"\n\n" +
                "Provide feedback in the following STRICT format:\n" +
                "1. **Score**: [0-10]/10\n" +
                "2. **Analysis**: [Provide a brief analysis of what the speaker did well and where they struggled.]\n" +
                "3. **Improvements**:\n" +
                "   - **Said**: \"[Quote exact sentence from transcript]\"\n" +
                "   - **Should have said**: \"[Improved version]\"\n" +
                "   - **Reason**: [Why the change is better]\n" +
                "   (Provide 2-3 examples like this)\n" +
                "4. **Key Metrics**:\n" +
                "   - Clarity: [Low/Medium/High]\n" +
                "   - Confidence: [Low/Medium/High]\n" +
                "   - Listening: [Low/Medium/High]";

        return callAiApi(prompt, 1000);
    }

    public void generateIndividualReports(com.cdac.gd.model.Session session) {
        List<com.cdac.gd.model.Transcription> transcriptions = transcriptionRepository.findBySessionId(session.getId());

        // Group by speaker
        Map<String, StringBuilder> speakerTranscripts = new HashMap<>();
        StringBuilder fullTranscript = new StringBuilder();

        for (com.cdac.gd.model.Transcription t : transcriptions) {
            speakerTranscripts.computeIfAbsent(t.getSpeakerId(), k -> new StringBuilder())
                    .append(t.getText()).append(" ");
            fullTranscript.append(t.getSpeakerId()).append(": ").append(t.getText()).append("\n");
        }

        // Generate report for each speaker
        for (Map.Entry<String, StringBuilder> entry : speakerTranscripts.entrySet()) {
            String speakerId = entry.getKey();
            String text = entry.getValue().toString();

            String aiReport = generateReport(text);

            com.cdac.gd.model.Report report = new com.cdac.gd.model.Report();
            report.setSessionId(session.getId());
            report.setUserEmail(speakerId);
            report.setContent(aiReport);
            report.setCreatedAt(java.time.LocalDateTime.now());

            reportRepository.save(report);
        }

        // Generate Session Summary Report (Stored as a report for the host or a special
        // 'SUMMARY' user)
        String summaryReport = generateReport("Analyze this entire group discussion:\n" + fullTranscript.toString());
        com.cdac.gd.model.Report sessionReport = new com.cdac.gd.model.Report();
        sessionReport.setSessionId(session.getId());
        sessionReport.setUserEmail("SESSION_SUMMARY"); // Special flag
        sessionReport.setContent("### Overall Session Summary\n\n" + summaryReport);
        sessionReport.setCreatedAt(java.time.LocalDateTime.now());
        reportRepository.save(sessionReport);
    }
    // ... existing code ...

    public String analyzeNews(String articleContent) {
        String prompt = "You are a helpful assistant. Analyze this news article and extract 3-5 key points that are useful for a group discussion. Format as bullet points.\n\nArticle: "
                + articleContent;
        return callAiApi(prompt, 300);
    }

    public String generateGDTopics(String category) {
        String categoryPrompt = (category == null || category.equalsIgnoreCase("Random"))
                ? "diverse (mix of Geopolitics, Social Ethics, Technology, Economics, and Abstract)"
                : "focused specifically on the category: '" + category + "'";

        String prompt = "You are an expert in group discussions. Generate 6 unique, thought-provoking, and debatable group discussion topics "
                + categoryPrompt + " based on current global events (as of "
                + java.time.LocalDate.now() + "), emerging trends, and abstract concepts. \n" +
                "Rules:\n" +
                "1. Topics must be STRICTLY " + categoryPrompt + ". Do not deviate.\n" +
                "2. AVOID generic topics like 'AI vs Human', 'Online Education', or 'Social Media'.\n" +
                "3. Focus on specific, nuanced issues (e.g., instead of 'Climate Change', use 'The economic viability of Green Hydrogen in developing nations').\n"
                +
                "4. Return ONLY a JSON array with format: [{\"topic\": \"...\", \"context\": \"brief context\"}].\n" +
                "5. Do NOT use markdown formatting.";
        return callAiApi(prompt, 800);
    }

    public String explainTopic(String topic) {
        String prompt = "You are an expert educator. Explain this topic in a clear, concise way suitable for group discussion preparation. Include background, key perspectives, and current relevance.\n\nTopic: "
                + topic;
        return callAiApi(prompt, 500);
    }

    public String generateKeyPoints(String topic) {
        String prompt = "You are a GD expert. Generate 5-7 key discussion points for this topic. Format as bullet points with clear, actionable insights.\n\nTopic: "
                + topic;
        return callAiApi(prompt, 400);
    }

    public String generateDebateMotion(String articleText) {
        String prompt = "Based on the following news article, generate a single, controversial, and debatable motion (statement) suitable for a debate practice. The motion should be clear and concise.\n\nArticle: "
                + articleText;
        return callAiApi(prompt, 100);
    }

    public String evaluateArgument(String motion, String argument) {
        String prompt = "You are a debate judge. Evaluate the following argument for the motion: \"" + motion + "\".\n"
                +
                "Argument: \"" + argument + "\"\n\n" +
                "Provide feedback in JSON format: {\"score\": [0-10], \"strength\": \"[Weak/Moderate/Strong]\", \"feedback\": \"[Brief specific feedback]\", \"improvement\": \"[One suggestion to make it better]\"}. Do not use markdown.";
        return callAiApi(prompt, 300);
    }

    public String getWordDefinition(String word) {
        String prompt = "You are a communication expert. Provide a concise definition, 3 synonyms (Power Words), and 3 example sentences relevant to a Professional Group Discussion context for the word: \""
                + word
                + "\". Format as JSON: {\"definition\": \"...\", \"synonyms\": [\"...\"], \"examples\": [\"...\"]}. Do not use markdown.";
        return callAiApi(prompt, 400);
    }

    public String generatePhrase(String context, String intent) {
        String prompt = "You are a communication coach. Generate 3 variations of a phrase for a Group Discussion participant who wants to: "
                + context
                + ". The tone should be: " + intent
                + ". Return ONLY a clean string with the 3 numbered options, separated by newlines. No intro text.";
        return callAiApi(prompt, 200);
    }

    private String callAiApi(String prompt, int maxTokens) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + githubToken);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o"); // Standard GitHub Model
        body.put("messages", List.of(message));
        body.put("temperature", 1.0);
        body.put("max_tokens", maxTokens);
        body.put("top_p", 1.0);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            if (githubToken == null || githubToken.isEmpty() || githubToken.contains("placeholder")) {
                return getFallbackResponse(prompt);
            }

            String url = "https://models.inference.ai.azure.com/chat/completions";

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getBody() != null && response.getBody().containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
                    if (messageObj != null && messageObj.containsKey("content")) {
                        String text = (String) messageObj.get("content");
                        return text.replace("```json", "").replace("```", "").trim();
                    }
                }
            }
            logError("Response invalid: " + response.getBody());
            return getFallbackResponse(prompt);

        } catch (org.springframework.web.client.HttpClientErrorException
                | org.springframework.web.client.HttpServerErrorException e) {
            logError("API Error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            return getFallbackResponse(prompt);
        } catch (Exception e) {
            logError("Exception: " + e.getMessage());
            e.printStackTrace();
            return getFallbackResponse(prompt);
        }
    }

    private void logError(String message) {
        try (java.io.FileWriter fw = new java.io.FileWriter("ai_debug.log", true);
                java.io.PrintWriter pw = new java.io.PrintWriter(fw)) {
            pw.println(java.time.LocalDateTime.now() + ": " + message);
        } catch (java.io.IOException e) {
            System.err.println("Failed to write log: " + e.getMessage());
        }
    }

    private String getFallbackResponse(String prompt) {
        if (prompt.contains("Generate 6 unique")) {
            // Extract category if present
            String category = "Random";
            if (prompt.contains("focused specifically on the category: '")) {
                int start = prompt.indexOf("focused specifically on the category: '") + 39;
                int end = prompt.indexOf("'", start);
                if (start > 38 && end > start) {
                    category = prompt.substring(start, end);
                }
            }
            return getMockTopics(category);
        } else if (prompt.contains("Explain this topic")) {
            return "AI Explanation (Fallback): This topic explores the intersection of modern technology and societal values. It is highly relevant in today's context as it impacts policy, economics, and individual rights. Key perspectives include the balance between innovation and regulation.";
        } else if (prompt.contains("Generate 5-7 key discussion points")) {
            return "- The economic implications of this issue are vast and multifaceted.\n- Social equity must be considered when implementing new policies.\n- Technological advancements could serve as a double-edged sword.\n- Global cooperation is essential for a sustainable solution.\n- The long-term impact on future generations remains uncertain.";
        } else if (prompt.contains("generate a single, controversial, and debatable motion")) {
            return "This house believes that immediate radical reform is necessary to address the crisis described.";
        } else if (prompt.contains("Evaluate the following argument")) {
            return "{\"score\": 7, \"strength\": \"Moderate\", \"feedback\": \"Good effort. Your argument has a clear premise but lacks specific evidence.\", \"improvement\": \"Include a concrete example or statistic to strengthen your point.\"}";
        } else if (prompt.contains("Provide a concise definition")) {
            return "{\"definition\": \"A fallback definition (API Unavailable).\", \"synonyms\": [\"Alternative\", \"Option\", \"Choice\"], \"examples\": [\"This is a fallback example.\", \"The AI service is currently unavailable.\", \"Please check your API token.\"]}";
        } else if (prompt.contains("Generate 3 variations of a phrase")) {
            return "1. \"I see where you're coming from, but I have a different take.\"\n2. \"That's an interesting point; however, consider this perspective.\"\n3. \"While I agree with part of that, we should also look at the downsides.\"";
        } else if (prompt.contains("Analyze this news article")) {
            return "- Key Point 1: The article discusses a major shift in global policy.\n- Key Point 2: Economic factors are driving these changes.\n- Key Point 3: Experts warn of potential long-term consequences.";
        } else if (prompt.contains("Analyze the following transcript")) {
            return "1. **Score**: 7/10\n2. **Analysis**: You communicated your ideas clearly but could improve on active listening.\n3. **Improvements**:\n   - **Said**: \"I disagree.\"\n   - **Should have said**: \"I see your point, but I have a different perspective.\"\n   - **Reason**: More polite and constructive.\n4. **Key Metrics**:\n   - Clarity: High\n   - Confidence: Medium\n   - Listening: Medium";
        }
        return "Unable to generate content at this time. (AI Service Error)";
    }

    private String getMockTopics(String category) {
        // Define category-specific mocks
        Map<String, String[]> categoryMocks = new HashMap<>();

        categoryMocks.put("Technology", new String[] {
                "{\"topic\": \"The Ethical Implications of AI in Healthcare\", \"context\": \"Balancing diagnostic accuracy with patient privacy.\"},",
                "{\"topic\": \"The Dead Internet Theory\", \"context\": \"Is the internet becoming populated purely by bots?\"},",
                "{\"topic\": \"Cybersecurity in Quantum Computing Era\", \"context\": \"Preparing for the post-encryption world.\"},",
                "{\"topic\": \"Algorithm Bias in Hiring\", \"context\": \"Can AI be truly objective in recruitment?\"},",
                "{\"topic\": \"Deepfakes and Political Stability\", \"context\": \"The impact of synthetic media on democracy.\"},",
                "{\"topic\": \"Space Internet Constellations\", \"context\": \"Impact of Starlink and others on astronomy and connectivity.\"},"
        });

        categoryMocks.put("Economics", new String[] {
                "{\"topic\": \"Universal Basic Income vs Guaranteed Jobs\", \"context\": \"Which model best suits the automation age?\"},",
                "{\"topic\": \"De-dollarization of Global Trade\", \"context\": \"The rise of BRICS currency and its impact on the USD.\"},",
                "{\"topic\": \"The Gig Economy: Freedom or Exploitation?\", \"context\": \"Assessing the long-term viability of contract work.\"},",
                "{\"topic\": \"Cryptocurrency Regulation\", \"context\": \"Balancing innovation with financial stability.\"},",
                "{\"topic\": \"Inflation vs Recession\", \"context\": \"Central bank policies and their impact on the middle class.\"},",
                "{\"topic\": \"Sustainable Capitalism\", \"context\": \"Can profit motives align with environmental goals?\"},"
        });

        categoryMocks.put("Geopolitics", new String[] {
                "{\"topic\": \"The Future of the Arctic Route\", \"context\": \"Geopolitical competition for new trade routes.\"},",
                "{\"topic\": \"Digital Sovereignty\", \"context\": \"Nations building their own internet firewalls and data laws.\"},",
                "{\"topic\": \"Resource Wars: Water\", \"context\": \"The next major conflict trigger in developing regions.\"},",
                "{\"topic\": \"Soft Power in the 21st Century\", \"context\": \"Influence of culture vs military might.\"},",
                "{\"topic\": \"The Relevance of the UN\", \"context\": \"Is the United Nations still effective in conflict resolution?\"},",
                "{\"topic\": \"Space Militarization\", \"context\": \"The race to control low-earth orbit assets.\"}"
        });

        // Default constraints for "Random" or unknown categories
        String[] templates = {
                "{\"topic\": \"The Ethical Implications of AI in Healthcare\", \"context\": \"Balancing diagnostic accuracy with patient privacy and algorithmic bias.\"},",
                "{\"topic\": \"Universal Basic Income in the Age of Automation\", \"context\": \"Should nations implement UBI as AI displaces traditional jobs?\"},",
                "{\"topic\": \"The Future of Space Privatization\", \"context\": \"Analyzing the benefits and risks of corporations leading space exploration.\"},",
                "{\"topic\": \"Social Credit Systems and Personal Freedom\", \"context\": \"Debating the impact of state-surveillance on individual behavior and rights.\"},",
                "{\"topic\": \"Cryptocurrency vs. Central Bank Digital Currencies\", \"context\": \"The battle for the future of money and financial sovereignty.\"},",
                "{\"topic\": \"The Gig Economy: Freedom or Exploitation?\", \"context\": \"Assessing the long-term viability and fairness of contract-based work.\"},",
                "{\"topic\": \"Gene Editing: Cure or Designer Babies?\", \"context\": \"The moral boundaries of CRISPR technology in humans.\"},",
                "{\"topic\": \"Nuclear Energy in a Carbon-Neutral World\", \"context\": \"Is nuclear power essential for fighting climate change despite the risks?\"},",
                "{\"topic\": \"The Death of Anonymity on the Internet\", \"context\": \"Should real-name policies be enforced to combat cyberbullying and fake news?\"},",
                "{\"topic\": \"The Role of Art in an AI-Generated World\", \"context\": \"Does human creativity still hold value when machines can produce art?\"}"
        };

        String[] selectedArr = templates;

        // If we have specific mocks for the category, use them
        if (category != null && categoryMocks.containsKey(category)) {
            selectedArr = categoryMocks.get(category);
        } else if (category != null && !category.equals("Random")) {
            // If category is something else (e.g. Health), filter random templates best we
            // can or just return random
            // For now, return Random to avoid returning empty
        }

        // Shuffle and pick 6
        List<String> selected = new java.util.ArrayList<>(java.util.Arrays.asList(selectedArr));
        java.util.Collections.shuffle(selected);

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < 6 && i < selected.size(); i++) {
            json.append(selected.get(i));
        }
        // Remove last comma if exists
        if (json.length() > 1 && json.charAt(json.length() - 1) == ',') {
            json.setLength(json.length() - 1);
        }
        json.append("]");
        return json.toString();
    }
}
