package com.cdac.gd.repository;

import com.cdac.gd.model.Transcription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TranscriptionRepository extends JpaRepository<Transcription, UUID> {
    java.util.List<Transcription> findBySessionId(UUID sessionId);
}
