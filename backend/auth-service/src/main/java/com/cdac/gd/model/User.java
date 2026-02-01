package com.cdac.gd.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;
    private String role; // USER, ADMIN
    private String status; // active, banned

    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    private Integer sessionsCount;
    private Integer totalParticipations;

    @Column(columnDefinition = "text")
    private String profilePicture;

    private Boolean emailVerified;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "active";
        }
        if (role == null) {
            role = "USER";
        }
        if (sessionsCount == null) {
            sessionsCount = 0;
        }
        if (totalParticipations == null) {
            totalParticipations = 0;
        }
        if (emailVerified == null) {
            emailVerified = false;
        }
    }
}
