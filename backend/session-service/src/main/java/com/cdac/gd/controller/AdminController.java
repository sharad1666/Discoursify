package com.cdac.gd.controller;

import com.cdac.gd.model.AuditLog;
import com.cdac.gd.model.Session;
import com.cdac.gd.service.AdminService;
import com.cdac.gd.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/sessions/active")
    public ResponseEntity<List<Session>> getActiveSessions() {
        return ResponseEntity.ok(adminService.getActiveSessions());
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Map<String, String>> forceEndSession(
            @PathVariable UUID id,
            HttpServletRequest httpRequest,
            java.security.Principal principal) {
        String adminEmail = principal != null ? principal.getName() : "unknown_admin";
        String ipAddress = httpRequest.getRemoteAddr();
        adminService.forceEndSession(id, adminEmail, ipAddress);

        Map<String, Object> update = new HashMap<>();
        update.put("id", id);
        update.put("status", "DELETED");
        messagingTemplate.convertAndSend("/topic/sessions", update);

        return ResponseEntity.ok(Map.of("message", "Session ended successfully"));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<AuditLog>> getSystemLogs(
            @RequestParam(defaultValue = "all") String level,
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(adminService.getSystemLogs(level, limit));
    }
}
