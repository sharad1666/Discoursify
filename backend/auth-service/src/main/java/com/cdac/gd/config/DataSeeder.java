package com.cdac.gd.config;

import com.cdac.gd.model.User;
import com.cdac.gd.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "bhilareshivtejofficial@gmail.com";

        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setName("Admin");
            admin.setRole("ADMIN");
            admin.setStatus("active");
            admin.setEmailVerified(true);
            admin.setProfilePicture("https://ui-avatars.com/api/?name=Admin&background=random");

            userRepository.save(admin);
            System.out.println("Admin user seeded: " + adminEmail);
        } else {
            System.out.println("Admin user already exists.");
        }
    }
}
