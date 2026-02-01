package com.cdac.gd.controller;

import com.cdac.gd.model.Session;
import com.cdac.gd.model.User;
import com.cdac.gd.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(
            @RequestParam(defaultValue = "user@example.com") String email) {
        // In real app, get email from SecurityContext
        return ResponseEntity.ok(userService.getUserStats(email));
    }

    @GetMapping("/me/sessions")
    public ResponseEntity<List<Session>> getUserSessions(
            @RequestParam(defaultValue = "user@example.com") String email) {
        // In real app, get email from SecurityContext
        return ResponseEntity.ok(userService.getUserSessions(email));
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(
            @RequestParam(defaultValue = "user@example.com") String email) {
        return ResponseEntity.ok(userService.getUserProfile(email));
    }

    @PostMapping
    public ResponseEntity<?> syncUser(@RequestBody User user) {
        try {
            System.out.println("Received sync request for: " + user.getEmail());
            User syncedUser = userService.syncUser(user);
            return ResponseEntity.ok(syncedUser);
        } catch (Exception e) {
            System.err.println("Error syncing user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error syncing user: " + e.getMessage());
        }
    }
}
