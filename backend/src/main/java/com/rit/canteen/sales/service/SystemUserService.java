package com.rit.canteen.sales.service;

import com.rit.canteen.sales.model.SystemUser;
import com.rit.canteen.sales.repository.SystemUserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SystemUserService {

    @Autowired
    private SystemUserRepository repository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Value("${app.master.username}")
    private String masterUsername;

    @Value("${app.master.password}")
    private String masterPassword;

    @PostConstruct
    public void init() {
        // Ensure at least one 'MASTER' user exists in the database
        List<SystemUser> masters = repository.findByRole("MASTER");
        
        if (masters.isEmpty()) {
            SystemUser master = new SystemUser();
            master.setName("Admin Master");
            master.setEmail(masterUsername);
            master.setPassword(passwordEncoder.encode(masterPassword));
            master.setRole("MASTER");
            master.setPermissions(List.of("dashboard", "sale", "customers", "purchases", "inventory", "expense", "reports", "stores", "table", "wallet", "promotions", "feedback"));
            master.setViewOnly(false);
            repository.save(master);
            System.out.println(">>> SEEDED DEFAULT MASTER USER from failsafe source.");
        } else {
            System.out.println(">>> MASTER USER(S) FOUND IN DATABASE. Skipping default seeding.");
        }
    }

    public List<SystemUser> getAllManagers() {
        return repository.findByRole("MANAGER");
    }

    public SystemUser createManager(SystemUser manager) {
        manager.setRole("MANAGER");
        manager.setPassword(passwordEncoder.encode(manager.getPassword()));
        return repository.save(manager);
    }

    public List<SystemUser> getAllStaff() {
        return repository.findByRole("STAFF");
    }

    public SystemUser createStaff(SystemUser staff) {
        staff.setRole("STAFF");
        staff.setPassword(passwordEncoder.encode(staff.getPassword()));
        return repository.save(staff);
    }

    public List<SystemUser> getMasters() {
        return repository.findByRole("MASTER");
    }

    public SystemUser createMaster(SystemUser admin) {
        admin.setRole("MASTER");
        admin.setPassword(passwordEncoder.encode(admin.getPassword()));
        // Grant full permissions by default for new admins
        admin.setPermissions(List.of("dashboard", "sale", "customers", "purchases", "inventory", "expense", "reports", "stores", "table", "wallet", "promotions", "feedback"));
        return repository.save(admin);
    }

    public void deleteManager(Long id) {
        if (id != null) {
            repository.deleteById(id);
        }
    }

    public void updateMasterAccount(Long id, String email, String password, String name) {
        SystemUser user;
        if (id == null || id == 0) {
            // If failsafe user (ID 0) or null, try to find the first master in the database
            user = repository.findByRole("MASTER").stream().findFirst()
                    .orElseGet(() -> {
                        SystemUser newMaster = new SystemUser();
                        newMaster.setRole("MASTER");
                        newMaster.setPermissions(List.of("dashboard", "sale", "customers", "purchases", "inventory", "expense", "reports", "stores", "table", "wallet", "promotions", "feedback"));
                        return newMaster;
                    });
        } else {
            user = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Master account not found with ID: " + id));
        }
        
        if (email != null) user.setEmail(email);
        if (password != null && !password.isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }
        if (name != null) user.setName(name);
        repository.save(user);
    }

    public Optional<SystemUser> authenticate(String email, String password) {
        // 1. Try Database First
        Optional<SystemUser> user = repository.findByEmail(email);
        if (user.isPresent()) {
            boolean matches = passwordEncoder.matches(password, user.get().getPassword());
            if (matches) {
                return user;
            }
        } else {
            // 2. Try Failsafe (Properties) - ONLY if no Master users exist in DB
            List<SystemUser> masters = repository.findByRole("MASTER");
            if (masters.isEmpty()) {
                if (email.equals(masterUsername) && passwordEncoder.matches(password, passwordEncoder.encode(masterPassword))) {
                    SystemUser failsafeUser = new SystemUser();
                    failsafeUser.setId(0L); 
                    failsafeUser.setName("Failsafe Admin");
                    failsafeUser.setEmail(masterUsername);
                    failsafeUser.setRole("MASTER");
                    failsafeUser.setPermissions(List.of("dashboard", "sale", "customers", "purchases", "inventory", "expense", "reports", "stores", "table", "wallet", "promotions", "feedback"));
                    return Optional.of(failsafeUser);
                }
            }
        }
        
        return Optional.empty();
    }
}
