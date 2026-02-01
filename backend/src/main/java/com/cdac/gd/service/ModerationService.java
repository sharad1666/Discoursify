package com.cdac.gd.service;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ModerationService {

    private static final List<String> BAD_WORDS = List.of("bad", "ugly", "hate"); // Example list

    public boolean isToxic(String text) {
        if (text == null)
            return false;
        String lower = text.toLowerCase();
        for (String word : BAD_WORDS) {
            if (lower.contains(word)) {
                return true;
            }
        }
        return false;
    }
}
