package com.cdac.gd.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action; // USER_BANNED, SESSION_ENDED, SETTINGS_UPDATED, etc.
    private String adminEmail;
    private String targetType; // USER, SESSION, SYSTEM
    private String targetId;

    @Column(columnDefinition = "text")
    private String details;

    private LocalDateTime timestamp;
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
