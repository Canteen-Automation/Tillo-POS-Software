package com.rit.canteen.sales.controller;

import com.rit.canteen.sales.model.TokenTransaction;
import com.rit.canteen.sales.model.User;
import com.rit.canteen.sales.service.TokenService;
import com.rit.canteen.sales.service.UserService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private static final BigDecimal MAX_TOPUP = new BigDecimal("5000");

    @Autowired
    private com.rit.canteen.sales.repository.UserRepository userRepository;

    @Autowired
    private com.rit.canteen.sales.service.TokenService tokenService;

    // ── CUSTOMER: own balance only ─────────────────────────────────────────

    @GetMapping("/balance/{userId}")
    public ResponseEntity<?> getBalance(@PathVariable Long userId) {
        // Customers can only read their own balance
        if (!canAccessUser(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(Map.of("balance", user.getRitzTokenBalance()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/transactions/{userId}")
    public ResponseEntity<?> getTransactions(@PathVariable Long userId) {
        if (!canAccessUser(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(tokenService.getTransactions(userId));
    }

    // ── STAFF/MASTER: wallet management ────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> userList = users.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("name", user.getName());
            map.put("mobileNumber", user.getMobileNumber());
            map.put("ritzTokenBalance", user.getRitzTokenBalance());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(userList);
    }

    @PostMapping("/topup")
    public ResponseEntity<?> topUp(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            if (!canAccessUser(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            BigDecimal amount = new BigDecimal(request.get("amount").toString());

            // ── FIX: validate amount BEFORE touching the database ──
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount must be positive"));
            }
            if (amount.compareTo(MAX_TOPUP) > 0) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "Single transaction limit exceeded (Max: 5,000 Ritz Tokens)"));
            }

            String ref = request.getOrDefault("referenceId", "TOPUP-" + System.currentTimeMillis()).toString();
            User updatedUser = tokenService.topUp(userId, amount, ref);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "newBalance", updatedUser.getRitzTokenBalance(),
                "message", "Successfully added " + amount + " Ritz Tokens"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/transactions/all")
    public ResponseEntity<List<TokenTransaction>> getAllTransactions() {
        return ResponseEntity.ok(tokenService.getAllTransactions());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(tokenService.getGlobalStats());
    }

    @GetMapping("/circulation")
    public ResponseEntity<org.springframework.data.domain.Page<com.rit.canteen.sales.model.TokenUnit>> getCirculation(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tokenService.getAllCirculation(page, size));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Returns true if the caller is a staff/manager/master, OR is the specific customer user.
     */
    private boolean canAccessUser(Long targetUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;

        if (auth.getDetails() instanceof Claims claims) {
            String role = (String) claims.get("role");
            // Staff roles can access anyone
            if ("MASTER".equals(role) || "MANAGER".equals(role) || "STAFF".equals(role)) return true;
            // Customers can only access themselves
            Object uid = claims.get("userId");
            if (uid != null) {
                Long tokenUserId = uid instanceof Integer ? ((Integer) uid).longValue() : (Long) uid;
                return tokenUserId.equals(targetUserId);
            }
        }
        return false;
    }
}
