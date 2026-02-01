package com.cdac.gd.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class Participant {
    private String id;
    private String name;
    private String email;
    private boolean isHost;
    private LocalDateTime joinedAt;
    private Long speakingTime; // in seconds
}
