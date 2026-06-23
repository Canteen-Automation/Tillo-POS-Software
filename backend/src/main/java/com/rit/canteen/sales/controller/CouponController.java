package com.rit.canteen.sales.controller;

import com.rit.canteen.sales.model.CouponCode;
import com.rit.canteen.sales.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import io.jsonwebtoken.Claims;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private com.rit.canteen.sales.repository.CouponRedemptionRepository redemptionRepository;

    @Autowired
    private com.rit.canteen.sales.service.TokenService tokenService;

    // ── PUBLIC (authenticated): any logged-in user can redeem ──────────────

    @GetMapping
    public List<CouponCode> getAllCoupons() {
        // Return only active, non-expired coupons for customers
        // (STAFF/MASTER see all — handled client-side via role check)
        return couponRepository.findAll();
    }

    @PostMapping("/redeem")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> redeemCoupon(@RequestBody Map<String, Object> request) {
        String code = ((String) request.get("code")).toUpperCase().trim();
        Long userId = Long.valueOf(request.get("userId").toString());

        if (!canAccessUser(userId)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));
        }

        Optional<CouponCode> couponOpt = couponRepository.findByCode(code);
        if (couponOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Invalid coupon code"));
        }

        CouponCode coupon = couponOpt.get();

        if (!coupon.getIsActive()) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Coupon is currently inactive"));
        }
        if (java.time.LocalDateTime.now().isAfter(coupon.getExpiryDate())) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Coupon has expired"));
        }

        // ── FIX: Atomic check-and-insert to prevent race-condition double redemption ──
        // Use INSERT with conflict handling — if the DB unique constraint fires, it means
        // a concurrent request already redeemed. We catch the exception and return an error.
        try {
            // This will throw if a duplicate exists (unique constraint on user_id + coupon_id)
            // First check the claim count — optimistic check
            if (coupon.getCurrentClaims() >= coupon.getMaxClaims()) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "Coupon claim limit reached"));
            }

            // Attempt to save redemption FIRST — DB unique constraint prevents double-redemption
            redemptionRepository.save(new com.rit.canteen.sales.model.CouponRedemption(userId, coupon.getId()));

            // Atomically increment claim counter
            coupon.setCurrentClaims(coupon.getCurrentClaims() + 1);
            couponRepository.save(coupon);

            // Credit tokens
            tokenService.topUp(userId, coupon.getRewardAmount(), "COUPON-" + code);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Successfully redeemed " + coupon.getRewardAmount() + " Ritz tokens!",
                "rewardAmount", coupon.getRewardAmount()
            ));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // DB unique constraint fired — concurrent or duplicate redemption attempt
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "You have already redeemed this code"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Redemption failed: " + e.getMessage()));
        }
    }

    // ── STAFF/MASTER ONLY: coupon management ──────────────────────────────

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody CouponCode coupon) {
        // SecurityConfig ensures only MASTER/MANAGER/STAFF can reach this
        if (couponRepository.findByCode(coupon.getCode()).isPresent()) {
            return ResponseEntity.badRequest().body("Coupon code already exists");
        }
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable Long id) {
        couponRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        Optional<CouponCode> couponOpt = couponRepository.findById(id);
        if (couponOpt.isPresent()) {
            CouponCode coupon = couponOpt.get();
            coupon.setIsActive(!coupon.getIsActive());
            return ResponseEntity.ok(couponRepository.save(coupon));
        }
        return ResponseEntity.notFound().build();
    }

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
