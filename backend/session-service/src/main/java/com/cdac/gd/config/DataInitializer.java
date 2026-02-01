package com.cdac.gd.config;

import com.cdac.gd.model.AuditLog;
import com.cdac.gd.model.Session;
import com.cdac.gd.model.User;
import com.cdac.gd.repository.AuditLogRepository;
import com.cdac.gd.repository.SessionRepository;
import com.cdac.gd.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    public void run(String... args) throws Exception {
        // Ensure specific admin exists or is promoted
        String adminEmail = "bhilareshivtejofficial@gmail.com";
        User adminUser = userRepository.findByEmail(adminEmail).orElse(null);

        if (adminUser == null) {
            // Create if not exists
            adminUser = new User();
            adminUser.setEmail(adminEmail);
            adminUser.setName("Shivtej Bhilare");
            adminUser.setRole("ADMIN");
            adminUser.setStatus("active");
            adminUser.setSessionsCount(15);
            adminUser.setTotalParticipations(50);
            adminUser.setCreatedAt(LocalDateTime.now().minusMonths(6));
            adminUser.setLastLogin(LocalDateTime.now());
            userRepository.save(adminUser);
            System.out.println("Created new Admin user: " + adminEmail);
        } else if (!"ADMIN".equals(adminUser.getRole())) {
            // Promote existing user
            adminUser.setRole("ADMIN");
            userRepository.save(adminUser);
            System.out.println("Promoted existing user to ADMIN: " + adminEmail);
        }

        if (userRepository.count() <= 1) { // Basic seeding if DB is mostly empty
            System.out.println("Seeding database with initial data...");

            // Create Regular Users
            createUser("john.doe@example.com", "John Doe", "active", 5, 12);
            createUser("jane.smith@example.com", "Jane Smith", "active", 8, 20);
            createUser("mike.wilson@example.com", "Mike Wilson", "banned", 2, 5);
            createUser("sarah.jones@example.com", "Sarah Jones", "active", 10, 30);
            createUser("david.brown@example.com", "David Brown", "active", 3, 8);

            // Create Sessions
            createSession("Future of AI in Healthcare", "John Doe", "LIVE", 12);
            createSession("Sustainable Energy Solutions", "Jane Smith", "SCHEDULED", 0);
            createSession("Web 3.0 and Blockchain", "Sarah Jones", "COMPLETED", 25);
            createSession("Remote Work Culture", "David Brown", "LIVE", 8);

            // Create Audit Logs
            createAuditLog("USER_BANNED", adminEmail, "USER", "3",
                    "User Mike Wilson banned for violation of terms");
            createAuditLog("SESSION_ENDED", adminEmail, "SESSION", "S-101",
                    "Session 'Intro to Java' force ended");

            System.out.println("Database seeding completed.");
        }
    }

    private void createUser(String email, String name, String status, int sessions, int participations) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setRole("USER");
        user.setStatus(status);
        user.setSessionsCount(sessions);
        user.setTotalParticipations(participations);
        user.setCreatedAt(LocalDateTime.now().minusDays((long) (Math.random() * 100)));
        user.setLastLogin(LocalDateTime.now().minusHours((long) (Math.random() * 48)));
        userRepository.save(user);
    }

    private void createSession(String topic, String host, String status, int participants) {
        Session session = new Session();
        session.setTopic(topic);
        session.setHostEmail(host); // Using host name as email/id for simplicity in this view
        session.setStatus(status);
        session.setParticipantsCount(participants);
        session.setStartTime(LocalDateTime.now().minusMinutes((long) (Math.random() * 60)));
        if ("COMPLETED".equals(status)) {
            session.setEndTime(LocalDateTime.now());
        }
        session.setDescription("A deep dive into " + topic);
        sessionRepository.save(session);
    }

    private void createAuditLog(String action, String admin, String type, String targetId, String details) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setAdminEmail(admin);
        log.setTargetType(type);
        log.setTargetId(targetId);
        log.setDetails(details);
        log.setIpAddress("127.0.0.1");
        // timestamp set in @PrePersist
        auditLogRepository.save(log);
    }
}
