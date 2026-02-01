package com.cdac.gd.controller;

import com.cdac.gd.service.ContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/content")
public class ContentController {

    @Autowired
    private ContentService contentService;

    @GetMapping("/news")
    public ResponseEntity<Map<String, Object>> getNews(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false, defaultValue = "publishedAt") String sortBy) {
        return ResponseEntity.ok(contentService.getNews(query, page, from, to, sortBy));
    }

    @GetMapping("/headlines")
    public ResponseEntity<Map<String, Object>> getTopHeadlines(
            @RequestParam(required = false, defaultValue = "All") String category,
            @RequestParam(required = false, defaultValue = "1") int page) {
        return ResponseEntity.ok(contentService.getTopHeadlines(category, page));
    }
}
