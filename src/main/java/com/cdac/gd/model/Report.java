package com.cdac.gd.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID sessionId;
    private String userEmail;

    @Column(columnDefinition = "text")
    private String content;

    private LocalDateTime createdAt;
}
