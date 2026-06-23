package com.rit.canteen.sales.controller;

import com.rit.canteen.sales.config.JwtUtil;
import com.rit.canteen.sales.config.LoginRateLimiter;
import com.rit.canteen.sales.model.SystemUser;
import com.rit.canteen.sales.service.SystemUserService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.rit.canteen.sales.service.LoginLockoutService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/system")
public class SystemAuthController {

    @Autowired
    private SystemUserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginRateLimiter rateLimiter;

    @Autowired
    private LoginLockoutService lockoutService;

    @Value("${app.security.trust-proxy-headers:false}")
    private boolean trustProxyHeaders;

    // ── PUBLIC ──────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials,
                                   HttpServletRequest request) {
        // Rate limit by IP
        String ip = getClientIp(request);
        if (!rateLimiter.tryConsume(ip)) {
            return ResponseEntity.status(429).body(Map.of(
                "error", "Too many login attempts. Please wait 5 minutes."
            ));
        }

        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email != null && lockoutService.isLockedOut(email)) {
            long remainingMinutes = (lockoutService.getRemainingLockoutTimeMs(email) / 1000) / 60;
            if (remainingMinutes == 0) {
                remainingMinutes = 1;
            }
            return ResponseEntity.status(423).body(Map.of(
                "error", "Account is locked due to too many failed attempts. Please try again in " + remainingMinutes + " minutes."
            ));
        }

        Optional<SystemUser> userOpt = userService.authenticate(email, password);

        if (userOpt.isPresent()) {
            if (email != null) {
                lockoutService.resetAttempts(email);
            }
            SystemUser user = userOpt.get();
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(),
                                                  user.getRole(), user.getPermissions());
            // Return safe DTO — no password hash
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("permissions", user.getPermissions());
            response.put("viewOnly", user.isViewOnly());
            return ResponseEntity.ok(response);
        } else {
            if (email != null) {
                lockoutService.registerFailedAttempt(email);
            }
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }

    // ── PROTECTED (requires MASTER or MANAGER JWT) ───────────────────────────

    @GetMapping("/managers")
    public ResponseEntity<List<SystemUser>> getManagers() {
        return ResponseEntity.ok(sanitize(userService.getAllManagers()));
    }

    @PostMapping("/managers")
    public ResponseEntity<?> addManager(@RequestBody SystemUser manager) {
        requireRole("MASTER", "MANAGER");
        return ResponseEntity.ok(sanitize(userService.createManager(manager)));
    }

    @DeleteMapping("/managers/{id}")
    public ResponseEntity<Void> deleteManager(@PathVariable Long id) {
        requireRole("MASTER");
        userService.deleteManager(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/staff")
    public ResponseEntity<List<SystemUser>> getStaff() {
        return ResponseEntity.ok(sanitize(userService.getAllStaff()));
    }

    @PostMapping("/staff")
    public ResponseEntity<?> addStaff(@RequestBody SystemUser staff) {
        requireRole("MASTER", "MANAGER");
        return ResponseEntity.ok(sanitize(userService.createStaff(staff)));
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        requireRole("MASTER", "MANAGER");
        userService.deleteManager(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admins")
    public ResponseEntity<List<SystemUser>> getAdmins() {
        requireRole("MASTER");
        return ResponseEntity.ok(sanitize(userService.getMasters()));
    }

    @PostMapping("/admins")
    public ResponseEntity<?> addAdmin(@RequestBody SystemUser admin) {
        // Only a MASTER can create another MASTER
        requireRole("MASTER");
        return ResponseEntity.ok(sanitize(userService.createMaster(admin)));
    }

    @PostMapping("/update-master")
    public ResponseEntity<?> updateMaster(@RequestBody Map<String, Object> data) {
        requireRole("MASTER");
        try {
            Object idObj = data.get("id");
            Long id = (idObj != null) ? Long.valueOf(idObj.toString()) : 0L;
            String email = (String) data.get("email");
            String password = (String) data.get("password");
            String name = (String) data.get("name");

            userService.updateMasterAccount(id, email, password, name);
            return ResponseEntity.ok(Map.of("success", true, "message", "Credentials updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /** Strips password hash from response objects */
    private SystemUser sanitize(SystemUser u) {
        u.setPassword("[PROTECTED]");
        return u;
    }

    private List<SystemUser> sanitize(List<SystemUser> users) {
        users.forEach(this::sanitize);
        return users;
    }

    /** Asserts the calling JWT has one of the required roles, throws 403 otherwise */
    private void requireRole(String... roles) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        if (auth.getDetails() instanceof Claims claims) {
            String role = (String) claims.get("role");
            for (String r : roles) {
                if (r.equals(role)) return;
            }
        }
        throw new org.springframework.security.access.AccessDeniedException(
            "Insufficient role. Required: " + String.join(" or ", roles));
    }

    private String getClientIp(HttpServletRequest request) {
        if (trustProxyHeaders) {
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isEmpty()) {
                return xfHeader.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
