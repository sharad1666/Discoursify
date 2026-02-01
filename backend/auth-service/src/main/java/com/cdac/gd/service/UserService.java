package com.cdac.gd.service;

import com.cdac.gd.model.User;
import com.cdac.gd.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public Map<String, Object> getUserStats(String email) {
        Map<String, Object> stats = new HashMap<>();

        // Mock logic as we don't have full session participation tracking locally in
        // Auth Service
        stats.put("meetingsJoined", 12); // Placeholder
        stats.put("avgConfidence", 87.4);
        stats.put("participationScore", 92.9);
        stats.put("totalHours", 18.5);

        return stats;
    }

    public List<Object> getUserSessions(String email) {
        // Return empty list as Session data is now in Session Service.
        // Frontend should fetch from /api/sessions or Session Service directly.
        return Collections.emptyList();
    }

    public User getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // FAIL-SAFE: Enforce Admin Role dynamically for specific emails
        if (user.getEmail().equalsIgnoreCase("bhilareshivtejofficial@gmail.com") ||
                user.getEmail().equalsIgnoreCase("shivtejbhilare@gmail.com")) {
            user.setRole("ADMIN");
        }

        return user;
    }

    public User syncUser(User user) {
        System.out.println("UserService: Syncing user " + user.getEmail());
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());

        if (existingUser.isPresent()) {
            User dbUser = existingUser.get();
            System.out.println("UserService: Updating existing user " + dbUser.getId());

            dbUser.setName(user.getName());
            dbUser.setProfilePicture(user.getProfilePicture());
            dbUser.setLastLogin(java.time.LocalDateTime.now());
            dbUser.setEmailVerified(user.getEmailVerified());

            if (dbUser.getEmail().equalsIgnoreCase("shivtejbhilare@gmail.com")
                    || dbUser.getEmail().equalsIgnoreCase("bhilareshivtejofficial@gmail.com")
                    || dbUser.getEmail().startsWith("admin")
                    || dbUser.getEmail().equals("dev@example.com")) {
                dbUser.setRole("ADMIN");
            }

            return userRepository.save(dbUser);
        } else {
            System.out.println("UserService: Creating new user for " + user.getEmail());

            user.setCreatedAt(java.time.LocalDateTime.now());
            user.setLastLogin(java.time.LocalDateTime.now());

            if (user.getEmail().equalsIgnoreCase("shivtejbhilare@gmail.com")
                    || user.getEmail().equalsIgnoreCase("bhilareshivtejofficial@gmail.com")
                    || user.getEmail().startsWith("admin")
                    || user.getEmail().equals("dev@example.com")) {
                user.setRole("ADMIN");
            } else {
                user.setRole("USER");
            }
            user.setStatus("active");
            return userRepository.save(user);
        }
    }
}
