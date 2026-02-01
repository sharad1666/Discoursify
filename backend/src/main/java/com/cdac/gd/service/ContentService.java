package com.cdac.gd.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Service
public class ContentService {

    @Value("${news.api.key:6376163a8aea44618e5a0ed725aec3b1}")
    private String newsApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String NEWS_API_URL = "https://newsapi.org/v2/everything";

    public Map<String, Object> getNews(String query, int page, String from, String to, String sortBy) {
        try {
            System.out.println(
                    "DEBUG: getNews called with query: " + query + ", page: " + page + ", from: " + from + ", to: " + to
                            + ", sortBy: " + sortBy);
            UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(NEWS_API_URL)
                    .queryParam("q", query)
                    .queryParam("apiKey", newsApiKey)
                    .queryParam("sortBy", sortBy)
                    .queryParam("page", page)
                    .queryParam("pageSize", 12);

            if (from != null && !from.isEmpty())
                builder.queryParam("from", from);
            if (to != null && !to.isEmpty())
                builder.queryParam("to", to);

            String url = builder.toUriString();

            System.out.println("DEBUG: Requesting URL: " + url.replace(newsApiKey, "HIDDEN_KEY"));
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null || "error".equals(response.get("status"))) {
                System.out.println("DEBUG: NewsAPI failed or returned null. Returning MOCK data.");
                return getMockNewsresponse();
            } else {
                System.out.println("DEBUG: Received response status: " + response.get("status"));
                System.out.println("DEBUG: Total results: " + response.get("totalResults"));
            }

            return response;
        } catch (Exception e) {
            System.err.println("ERROR: NewsAPI request failed: " + e.getMessage());
            e.printStackTrace(); // Log full stack trace
            System.out.println("DEBUG: Returning MOCK data due to error.");
            return getMockNewsresponse();
        }
    }

    public Map<String, Object> getTopHeadlines(String category, int page) {
        System.out.println("DEBUG: getTopHeadlines called for category: " + category + ", page: " + page);
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl("https://newsapi.org/v2/top-headlines")
                .queryParam("country", "us") // Default to US for better coverage
                .queryParam("apiKey", newsApiKey)
                .queryParam("page", page)
                .queryParam("pageSize", 12);

        if (category != null && !category.equalsIgnoreCase("All")) {
            builder.queryParam("category", category.toLowerCase());
        }

        String url = builder.toUriString();

        try {
            System.out.println("DEBUG: Requesting Headlines URL: " + url.replace(newsApiKey, "HIDDEN_KEY"));
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null || "error".equals(response.get("status"))) {
                return getMockNewsresponse();
            }
            return response;
        } catch (Exception e) {
            System.err.println("ERROR: NewsAPI Headlines request failed: " + e.getMessage());
            return getMockNewsresponse();
        }
    }

    private Map<String, Object> getMockNewsresponse() {
        Map<String, Object> mockResponse = new java.util.HashMap<>();
        mockResponse.put("status", "ok");
        mockResponse.put("totalResults", 5);

        java.util.List<Map<String, Object>> articles = new java.util.ArrayList<>();

        articles.add(Map.of(
                "source", Map.of("name", "TechCrunch"),
                "author", "Tech Reporter",
                "title", "The Future of AI: How Generative Models are Reshaping Industries",
                "description",
                "Artificial Intelligence is no longer just a buzzword. From healthcare to finance, generative models are driving efficiency and innovation at an unprecedented scale.",
                "url", "https://techcrunch.com",
                "urlToImage", "https://images.unsplash.com/photo-1677442136019-21780ecad995",
                "publishedAt", java.time.format.DateTimeFormatter.ISO_INSTANT.format(java.time.Instant.now()),
                "content", "Generative AI is changing the landscape of..."));

        articles.add(Map.of(
                "source", Map.of("name", "The Economist"),
                "author", "Global Editor",
                "title", "Global Economic Shifts: The Rise of Digital Currencies",
                "description",
                "Central banks around the world are exploring CBDCs as cryptocurrency adoption grows. What does this mean for the future of money?",
                "url", "https://economist.com",
                "urlToImage", "https://images.unsplash.com/photo-1518186285589-2f7649de83e0",
                "publishedAt",
                java.time.format.DateTimeFormatter.ISO_INSTANT.format(java.time.Instant.now().minusSeconds(3600)),
                "content", "Digital currencies are becoming a reality..."));

        articles.add(Map.of(
                "source", Map.of("name", "BBC News"),
                "author", "Science Corr",
                "title", "Climate Action: New Policies for a Greener Future",
                "description",
                "World leaders gather to discuss urgent measures required to combat climate change, focusing on renewable energy transitions.",
                "url", "https://bbc.com",
                "urlToImage", "https://images.unsplash.com/photo-1473876988266-ca0860a443b8",
                "publishedAt",
                java.time.format.DateTimeFormatter.ISO_INSTANT.format(java.time.Instant.now().minusSeconds(7200)),
                "content", "The summit focused on renewable energy..."));

        mockResponse.put("articles", articles);
        return mockResponse;
    }
}
