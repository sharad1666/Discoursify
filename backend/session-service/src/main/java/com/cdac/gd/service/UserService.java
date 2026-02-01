package com.cdac.gd.service;

import com.cdac.gd.model.Session;
import com.cdac.gd.model.User;
import com.cdac.gd.repository.SessionRepository;
import com.cdac.gd.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    public Map<String, Object> getUserStats(String email) {
        Map<String, Object> stats = new HashMap<>();

        // Mock logic for now as we don't have full session participation tracking yet
        // In a real app, we'd query a SessionParticipant repository

        stats.put("meetingsJoined", 12); // Placeholder
        stats.put("avgConfidence", 87.4);
        stats.put("participationScore", 92.9);
        stats.put("totalHours", 18.5);

        return stats;
    }

    public List<Session> getUserSessions(String email) {
        // Mock: return all sessions for now, or filter by host if we had that logic
        // fully connected
        // In real app: return sessions where user is a participant
        return sessionRepository.findAll().stream().limit(5).toList();
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

            // DEBUG LOGGING
            System.out.println("DEBUG: Syncing User: " + dbUser.getEmail());

            if (dbUser.getEmail().equalsIgnoreCase("shivtejbhilare@gmail.com")
                    || dbUser.getEmail().equalsIgnoreCase("bhilareshivtejofficial@gmail.com")
                    || dbUser.getEmail().startsWith("admin")
                    || dbUser.getEmail().equals("dev@example.com")) {
                System.out.println("DEBUG: User matched ADMIN whitelist. Setting role to ADMIN.");
                dbUser.setRole("ADMIN");
            } else {
                System.out.println("DEBUG: User did NOT match ADMIN whitelist.");
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
                System.out.println("UserService: New user assigned ADMIN role");
            } else {
                user.setRole("USER");
                System.out.println("UserService: New user assigned USER role");
            }
            user.setStatus("active");
            return userRepository.save(user);
        }
    }
}
