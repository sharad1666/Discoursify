package com.cdac.gd.service;

import com.cdac.gd.model.AuditLog;
import com.cdac.gd.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Log an admin action
     */
    public AuditLog logAction(String action, String adminEmail, String targetType, String targetId, String details,
            String ipAddress) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setAdminEmail(adminEmail);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        return auditLogRepository.save(log);
    }

    /**
     * Get recent audit logs
     */
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }

    /**
     * Get logs by admin
     */
    public Page<AuditLog> getLogsByAdmin(String adminEmail, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return auditLogRepository.findByAdminEmail(adminEmail, pageable);
    }

    /**
     * Get logs by action type
     */
    public Page<AuditLog> getLogsByAction(String action, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return auditLogRepository.findByAction(action, pageable);
    }

    /**
     * Get logs within date range
     */
    public Page<AuditLog> getLogsByDateRange(LocalDateTime start, LocalDateTime end, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return auditLogRepository.findByTimestampBetween(start, end, pageable);
    }
}
