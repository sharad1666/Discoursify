package com.cdac.gd.repository;

import com.cdac.gd.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Page<User> findByStatus(String status, Pageable pageable);

    Long countByStatus(String status);

    Page<User> findByNameContainingOrEmailContaining(String name, String email, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT DATE(u.createdAt) as date, COUNT(u) as count FROM User u WHERE u.createdAt >= :startDate GROUP BY DATE(u.createdAt) ORDER BY date")
    List<Object[]> getUserGrowth(java.time.LocalDateTime startDate);
}
