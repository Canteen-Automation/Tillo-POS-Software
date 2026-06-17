package com.rit.canteen.sales.controller;

import com.rit.canteen.sales.config.JwtUtil;
import com.rit.canteen.sales.config.LoginRateLimiter;
import com.rit.canteen.sales.model.*;
import com.rit.canteen.sales.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import io.jsonwebtoken.Claims;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginRateLimiter rateLimiter;

    // ── PUBLIC ────────────────────────────────────────────────────────────────

    @PostMapping("/check")
    public ResponseEntity<LoginResponse> checkUserExists(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.checkUserExists(request.getMobileNumber());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> registerUser(@Valid @RequestBody PinVerificationRequest request,
                                                       HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        if (!rateLimiter.tryConsume(ip)) {
            return ResponseEntity.status(429).build();
        }
        LoginResponse response = userService.registerUser(
            request.getMobileNumber(), request.getName(), request.getPin());
        if (response.isSuccess()) {
            // Attach JWT on successful registration
            Long userId = response.getUser() != null ? response.getUser().getId() : null;
            if (userId != null) {
                String token = jwtUtil.generateUserToken(userId, request.getMobileNumber());
                response.setToken(token);
            }
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody PinVerificationRequest request,
                                                HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        if (!rateLimiter.tryConsume(ip)) {
            LoginResponse rateResp = new LoginResponse(false, "Too many login attempts. Please wait 5 minutes.");
            return ResponseEntity.status(429).body(rateResp);
        }
        LoginResponse response = userService.verifyPinAndLogin(request.getMobileNumber(), request.getPin());
        if (response.isSuccess()) {
            Long userId = response.getUser() != null ? response.getUser().getId() : null;
            if (userId != null) {
                String token = jwtUtil.generateUserToken(userId, request.getMobileNumber());
                response.setToken(token);
            }
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<LoginResponse> logout(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.logout(request.getMobileNumber());
        return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    // ── AUTHENTICATED (customer token required) ────────────────────────────────

    @PostMapping("/change-pin")
    public ResponseEntity<LoginResponse> changePin(@Valid @RequestBody ChangePinRequest request) {
        // Extra ownership check: the JWT's mobileNumber must match the request
        String tokenMobile = getAuthenticatedMobile();
        if (tokenMobile != null && !tokenMobile.equals(request.getMobileNumber())) {
            return ResponseEntity.status(403).body(
                new LoginResponse(false, "You can only change your own PIN."));
        }
        LoginResponse response = userService.changePin(
            request.getMobileNumber(), request.getCurrentPin(), request.getNewPin());
        return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/user/{mobileNumber}")
    public ResponseEntity<LoginResponse.UserDto> getUser(@PathVariable String mobileNumber) {
        // Customers can only fetch their own profile; staff can fetch any
        String tokenMobile = getAuthenticatedMobile();
        if (tokenMobile != null && !tokenMobile.equals(mobileNumber) && !isStaff()) {
            return ResponseEntity.status(403).build();
        }
        LoginResponse.UserDto userDto = userService.getUserByMobile(mobileNumber);
        return userDto != null ? ResponseEntity.ok(userDto) : ResponseEntity.notFound().build();
    }

    // ── STAFF/MASTER ONLY ────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<Page<LoginResponse.UserDto>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<LoginResponse.UserDto> users = userService.getAllUsers(search, PageRequest.of(page, size));
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<LoginResponse.UserDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request) {
        // Extra ownership check: customers can only update their own profile; staff can update any
        Long tokenUserId = getTokenUserId();
        if (tokenUserId != null && !tokenUserId.equals(id) && !isStaff()) {
            return ResponseEntity.status(403).build();
        }
        LoginResponse.UserDto updated = userService.updateUser(id, request.getName(),
                request.getMobileNumber(), request.getPin());
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/suspend")
    public ResponseEntity<LoginResponse.UserDto> toggleSuspension(@PathVariable Long id) {
        LoginResponse.UserDto updated = userService.toggleSuspension(id);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Long getTokenUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            Object uid = claims.get("userId");
            if (uid != null) {
                return uid instanceof Integer ? ((Integer) uid).longValue() : (Long) uid;
            }
        }
        return null;
    }

    private String getAuthenticatedMobile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            // Customer tokens have the mobile as subject
            String type = (String) claims.get("type");
            if ("customer".equals(type)) {
                return claims.getSubject();
            }
        }
        return null; // Staff or system token — not a customer
    }

    private boolean isStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().startsWith("ROLE_MASTER")
                       || a.getAuthority().startsWith("ROLE_MANAGER")
                       || a.getAuthority().startsWith("ROLE_STAFF"));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) return xfHeader.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
