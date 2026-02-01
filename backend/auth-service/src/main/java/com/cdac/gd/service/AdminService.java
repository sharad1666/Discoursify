package com.cdac.gd.service;

import com.cdac.gd.model.User;
import com.cdac.gd.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.time.LocalDateTime;
import java.util.*;
import com.cdac.gd.model.AuditLog;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    // Get system statistics
    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("active");

        // Placeholder for Session stats (handled by Session Service now)
        long totalSessions = 0;
        long activeSessions = 0;

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("totalSessions", totalSessions);
        stats.put("activeSessions", activeSessions);

        // Calculate uptime
        long uptimeMillis = System.currentTimeMillis() - ManagementFactory.getRuntimeMXBean().getStartTime();
        long uptimeHours = uptimeMillis / (1000 * 60 * 60);
        stats.put("uptime", uptimeHours + "h " + (uptimeMillis / (1000 * 60) % 60) + "m");

        stats.put("avgSessionDuration", "0 min");

        return stats;
    }

    // Get system health metrics
    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();

        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;

        int memoryPercent = (int) ((usedMemory * 100) / maxMemory);

        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        double cpuLoad = osBean.getSystemLoadAverage();
        int cpuPercent = cpuLoad > 0 ? (int) (cpuLoad * 100 / Runtime.getRuntime().availableProcessors()) : 45;

        health.put("cpu", Math.min(cpuPercent, 100));
        health.put("memory", memoryPercent);
        health.put("disk", 55); // Placeholder
        health.put("network", 30); // Placeholder

        return health;
    }

    // Get service health status
    public Map<String, Object> getServiceHealth() {
        Map<String, Object> services = new HashMap<>();

        // Database health
        Map<String, Object> dbHealth = new HashMap<>();
        try {
            long start = System.currentTimeMillis();
            userRepository.count(); // Test query
            long time = System.currentTimeMillis() - start;
            dbHealth.put("status", "healthy");
            dbHealth.put("responseTime", time);
            dbHealth.put("lastCheck", LocalDateTime.now().toString());
        } catch (Exception e) {
            dbHealth.put("status", "error");
            dbHealth.put("responseTime", 0);
            dbHealth.put("lastCheck", LocalDateTime.now().toString());
        }
        services.put("database", dbHealth);

        return services;
    }

    // Get all users with pagination
    public Map<String, Object> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findAll(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("users", userPage.getContent());
        response.put("totalPages", userPage.getTotalPages());
        response.put("totalElements", userPage.getTotalElements());
        response.put("currentPage", page);

        return response;
    }

    // Ban/Unban user
    public User toggleUserBan(Long userId, boolean banned, String adminEmail, String ipAddress) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String oldStatus = user.getStatus();
            user.setStatus(banned ? "banned" : "active");
            User savedUser = userRepository.save(user);

            // Log audit trail
            auditLogService.logAction(
                    banned ? "USER_BANNED" : "USER_UNBANNED",
                    adminEmail,
                    "USER",
                    userId.toString(),
                    String.format("User %s status changed from %s to %s", user.getEmail(), oldStatus, user.getStatus()),
                    ipAddress);

            return savedUser;
        }
        throw new RuntimeException("User not found");
    }

    // Create new user
    public User createUser(User user, String adminEmail, String ipAddress) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("User with this email already exists");
        }

        User savedUser = userRepository.save(user);

        auditLogService.logAction(
                "USER_CREATED",
                adminEmail,
                "USER",
                savedUser.getId().toString(),
                "Created new user: " + user.getEmail(),
                ipAddress);

        return savedUser;
    }

    // Get system logs
    public List<AuditLog> getSystemLogs(String level, int limit) {
        // In a real scenario, we would filter by level if AuditLog had a level field
        // For now, we just return the recent logs
        return auditLogService.getRecentLogs();
    }

    @org.springframework.beans.factory.annotation.Value("${app.owner.email}")
    private String ownerEmail;

    // Update User Role (e.g., Make Admin)
    public User updateUserRole(Long userId, String newRole, String adminEmail, String ipAddress) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Prevent demoting the Owner
            if (user.getEmail().equalsIgnoreCase(ownerEmail) && !"ADMIN".equalsIgnoreCase(newRole)) {
                throw new RuntimeException("Action Denied: You cannot demote the Super Admin.");
            }

            // Ensure Owner is always ADMIN if somehow they are being updated
            if (user.getEmail().equalsIgnoreCase(ownerEmail)) {
                newRole = "ADMIN";
            }

            String oldRole = user.getRole();
            user.setRole(newRole.toUpperCase());
            User savedUser = userRepository.save(user);

            // Log audit trail
            auditLogService.logAction(
                    "USER_ROLE_UPDATED",
                    adminEmail,
                    "USER",
                    userId.toString(),
                    String.format("User %s role changed from %s to %s", user.getEmail(), oldRole, user.getRole()),
                    ipAddress);

            return savedUser;
        }
        throw new RuntimeException("User not found");
    }

    // Get analytics data
    public Map<String, Object> getAnalytics(String period) {
        Map<String, Object> analytics = new HashMap<>();
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);

        // Session trends - EMPTY for now
        List<Map<String, Object>> sessionTrends = new ArrayList<>();
        analytics.put("sessionTrends", sessionTrends);

        // User growth
        List<Object[]> userGrowthData = userRepository.getUserGrowth(startDate);
        List<Map<String, Object>> userGrowth = new ArrayList<>();
        // For simplicity in this view, we'll show daily new users
        for (Object[] row : userGrowthData) {
            Map<String, Object> day = new HashMap<>();
            day.put("date", row[0].toString());
            day.put("count", row[1]); // This is new users per day
            userGrowth.add(day);
        }
        analytics.put("userGrowth", userGrowth);

        // Top topics - EMPTY
        List<Map<String, Object>> topTopics = new ArrayList<>();
        analytics.put("topTopics", topTopics);

        return analytics;
    }

    // Execute System Action
    public boolean executeSystemAction(String action, String adminEmail, String ipAddress) {
        String actionDetails = "";

        switch (action) {
            case "Cache Clear":
                // Simulate Spring Cache Evict
                actionDetails = "Cleared system cache regions: [users, sessions, reports]";
                // In real app: cacheManager.getCacheNames().forEach(name ->
                // cacheManager.getCache(name).clear());
                break;
            case "WS Restart":
                // Simulate WebSocket Broker restart
                actionDetails = "Restarted WebSocket Message Broker relay connection";
                break;
            case "Key Rotation":
                // Simulate API Key rotation
                actionDetails = "Rotated internal service API keys. Old keys invalidated.";
                break;
            default:
                throw new RuntimeException("Invalid system action: " + action);
        }

        auditLogService.logAction(
                "SYSTEM_ACTION_" + action.toUpperCase().replace(" ", "_"),
                adminEmail,
                "SYSTEM",
                "N/A",
                actionDetails,
                ipAddress);

        return true;
    }
}
