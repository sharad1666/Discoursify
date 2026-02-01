package com.cdac.gd.controller;

import com.cdac.gd.model.Report;
import com.cdac.gd.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    @PostMapping
    public ResponseEntity<Report> createReport(@RequestBody Report report) {
        report.setCreatedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(reportRepository.save(report));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<Report>> getReportsBySession(@PathVariable UUID sessionId) {
        List<Report> reports = reportRepository.findBySessionId(sessionId);
        if (reports.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/session/{sessionId}/user/{email}")
    public ResponseEntity<Report> getReportByUser(@PathVariable UUID sessionId, @PathVariable String email) {
        // Simple linear search for now, or add a custom query in repository
        List<Report> reports = reportRepository.findBySessionId(sessionId);
        for (Report report : reports) {
            if (report.getUserEmail().equals(email)) {
                return ResponseEntity.ok(report);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{email}")
    public ResponseEntity<List<Report>> getReportsByUser(@PathVariable String email) {
        List<Report> reports = reportRepository.findByUserEmail(email);
        return ResponseEntity.ok(reports);
    }
}
