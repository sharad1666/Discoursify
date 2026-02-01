package com.cdac.gd.repository;

import com.cdac.gd.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {
    List<Report> findBySessionId(UUID sessionId);

    List<Report> findByUserEmail(String userEmail);
}
