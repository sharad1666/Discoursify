package com.cdac.gd.repository;

import com.cdac.gd.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    List<Session> findByStatus(String status);

    List<Session> findByStatusIn(List<String> statuses);

    java.util.Optional<Session> findByCode(String code);

    Long countByStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT DATE(s.startTime) as date, COUNT(s) as count FROM Session s WHERE s.startTime >= :startDate GROUP BY DATE(s.startTime) ORDER BY date")
    List<Object[]> getSessionTrends(java.time.LocalDateTime startDate);

    @org.springframework.data.jpa.repository.Query("SELECT s.topic as topic, COUNT(s) as count FROM Session s GROUP BY s.topic ORDER BY count DESC LIMIT 5")
    List<Object[]> getTopTopics();

    @org.springframework.data.jpa.repository.Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, s.startTime, s.endTime)) FROM Session s WHERE s.endTime IS NOT NULL")
    Double getAverageSessionDuration();

    Long countByStatusIn(List<String> statuses);
}
