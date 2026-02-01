package com.cdac.gd.controller;

import com.cdac.gd.model.AuditLog;
import com.cdac.gd.model.Session;
import com.cdac.gd.model.User;
import com.cdac.gd.service.AdminService;
import com.cdac.gd.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Get system statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    /**
     * Get system health metrics
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        return ResponseEntity.ok(adminService.getSystemHealth());
    }

    /**
     * Get service health status
     */
    @GetMapping("/services/status")
    public ResponseEntity<Map<String, Object>> getServiceHealth() {
        return ResponseEntity.ok(adminService.getServiceHealth());
    }

    /**
     * Get all users with pagination
     */
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminService.getAllUsers(page, size));
    }

    /**
     * Get active sessions
     */
    @GetMapping("/sessions/active")
    public ResponseEntity<List<Session>> getActiveSessions() {
        return ResponseEntity.ok(adminService.getActiveSessions());
    }

    /**
     * Ban or unban a user
     */
    /**
     * Ban or unban a user
     */
    @PostMapping("/users/{id}/ban")
    public ResponseEntity<User> toggleUserBan(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest,
            java.security.Principal principal) {
        boolean banned = (Boolean) request.getOrDefault("banned", false);
        String adminEmail = principal != null ? principal.getName()
                : (String) request.getOrDefault("adminEmail", "unknown_admin");
        String ipAddress = httpRequest.getRemoteAddr();
        return ResponseEntity.ok(adminService.toggleUserBan(id, banned, adminEmail, ipAddress));
    }

    /**
     * Update user role
     */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest,
            java.security.Principal principal) {
        String newRole = request.get("role");
        String adminEmail = principal != null ? principal.getName() : "unknown_admin";
        String ipAddress = httpRequest.getRemoteAddr();
        return ResponseEntity.ok(adminService.updateUserRole(id, newRole, adminEmail, ipAddress));
    }

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    /**
     * Force end a session
     */
    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Map<String, String>> forceEndSession(
            @PathVariable UUID id,
            HttpServletRequest httpRequest,
            java.security.Principal principal) {
        String adminEmail = principal != null ? principal.getName() : "unknown_admin";
        String ipAddress = httpRequest.getRemoteAddr();
        adminService.forceEndSession(id, adminEmail, ipAddress);

        // Broadcast deletion
        Map<String, Object> update = new HashMap<>();
        update.put("id", id);
        update.put("status", "DELETED");
        messagingTemplate.convertAndSend("/topic/sessions", update);

        return ResponseEntity.ok(Map.of("message", "Session ended successfully"));
    }

    /**
     * Create a new user
     */
    @PostMapping("/users")
    public ResponseEntity<User> createUser(
            @RequestBody User user,
            HttpServletRequest httpRequest,
            java.security.Principal principal) {
        // Default password or other fields if needed
        String adminEmail = principal != null ? principal.getName() : "unknown_admin";
        String ipAddress = httpRequest.getRemoteAddr();
        return ResponseEntity.ok(adminService.createUser(user, adminEmail, ipAddress));
    }

    /**
     * Get system logs
     */
    @GetMapping("/logs")
    public ResponseEntity<List<AuditLog>> getSystemLogs(
            @RequestParam(defaultValue = "all") String level,
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(adminService.getSystemLogs(level, limit));
    }

    /**
     * Get analytics data
     */
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestParam(defaultValue = "7d") String period) {
        return ResponseEntity.ok(adminService.getAnalytics(period));
    }

    /**
     * Update system settings (placeholder)
     */
    @PutMapping("/settings")
    public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, Object> settings) {
        // Implement settings update logic
        return ResponseEntity.ok(Map.of("message", "Settings updated successfully"));
    }

    /**
     * Get audit logs
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogService.getRecentLogs());
    }

    /**
     * Export data (users, sessions, logs)
     */
    @GetMapping("/export/{type}")
    public ResponseEntity<Map<String, Object>> exportData(@PathVariable String type) {
        Map<String, Object> exportData = new HashMap<>();

        switch (type.toLowerCase()) {
            case "users":
                exportData.put("data", adminService.getAllUsers(0, 1000));
                exportData.put("type", "users");
                exportData.put("exportedAt", java.time.LocalDateTime.now().toString());
                break;
            case "sessions":
                exportData.put("data", adminService.getActiveSessions());
                exportData.put("type", "sessions");
                exportData.put("exportedAt", java.time.LocalDateTime.now().toString());
                break;
            case "logs":
                exportData.put("data", auditLogService.getRecentLogs());
                exportData.put("type", "audit_logs");
                exportData.put("exportedAt", java.time.LocalDateTime.now().toString());
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid export type"));
        }

        return ResponseEntity.ok(exportData);
    }

    /**
     * Execute system maintenance action
     */
    @PostMapping("/system/actions")
    public ResponseEntity<Map<String, String>> executeSystemAction(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest,
            java.security.Principal principal) {
        String action = request.get("action");
        String adminEmail = principal != null ? principal.getName() : "unknown_admin";
        String ipAddress = httpRequest.getRemoteAddr();

        try {
            adminService.executeSystemAction(action, adminEmail, ipAddress);
            return ResponseEntity.ok(Map.of("message", action + " initiated successfully", "status", "success"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage(), "status", "error"));
        }
    }
}
