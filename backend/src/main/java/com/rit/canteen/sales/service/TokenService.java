package com.rit.canteen.sales.service;

import com.rit.canteen.sales.model.TokenTransaction;
import com.rit.canteen.sales.model.User;
import com.rit.canteen.sales.repository.TokenTransactionRepository;
import com.rit.canteen.sales.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rit.canteen.sales.model.TokenUnit;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TokenService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenTransactionRepository transactionRepository;
    @Autowired
    private com.rit.canteen.sales.repository.TokenUnitRepository tokenUnitRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<TokenTransaction> getTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    public List<TokenTransaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByTimestampDesc();
    }

    public java.util.Map<String, Object> getGlobalStats() {
        long totalActive = tokenUnitRepository.count(); // Actually all units
        long activeUnits = tokenUnitRepository.countByOwnerIdAndStatus(null, null); // Placeholder, will fix below
        
        List<User> users = userRepository.findAll();
        BigDecimal totalBalance = users.stream()
                .map(u -> u.getRitzTokenBalance() != null ? u.getRitzTokenBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalCirculation", totalBalance);
        stats.put("activeWallets", users.stream().filter(u -> u.getRitzTokenBalance().compareTo(BigDecimal.ZERO) > 0).count());
        stats.put("totalUsers", users.size());
        stats.put("serializedUnitsTotal", tokenUnitRepository.count());
        
        return stats;
    }

    public org.springframework.data.domain.Page<TokenUnit> getAllCirculation(int page, int size) {
        return tokenUnitRepository.findAllByOrderByCreatedAtDesc(org.springframework.data.domain.PageRequest.of(page, size));
    }

    @Transactional
    public User topUp(Long userId, BigDecimal amount, String paymentRef) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ── FIX: Validate BEFORE touching the database ──
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Amount must be positive");
        }
        if (amount.compareTo(new BigDecimal("5000")) > 0) {
            throw new RuntimeException("Single transaction limit exceeded (Max: 5,000 Ritz Tokens)");
        }

        int tokenCount = amount.intValue();
        System.out.println("MINTING: Serializing " + tokenCount + " Ritz tokens for user " + userId);

        // High-Performance Batch Insertion using JDBC
        String sql = "INSERT INTO token_units (token_hash, owner_id, status, created_at) VALUES (?, ?, 'ACTIVE', ?)";
        List<Object[]> batchArgs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < tokenCount; i++) {
            String hash = generateSecureHash();
            batchArgs.add(new Object[]{hash, userId, now});
        }

        jdbcTemplate.batchUpdate(sql, batchArgs);

        // Update cached balance
        BigDecimal currentBalance = user.getRitzTokenBalance() != null ? user.getRitzTokenBalance() : BigDecimal.ZERO;
        BigDecimal newBalance = currentBalance.add(amount);
        user.setRitzTokenBalance(newBalance);
        User savedUser = userRepository.save(user);

        TokenTransaction transaction = new TokenTransaction(
                user,
                amount,
                TokenTransaction.TransactionType.TOPUP,
                "Regulated Wallet Top Up (Serialized ID: " + paymentRef + ")",
                paymentRef
        );
        transactionRepository.save(transaction);

        return savedUser;
    }


    @Transactional
    public void spend(Long userId, BigDecimal amount, String orderRef) {
        // High Concurrency Lock: Ensure no other thread modifies this user balance simultaneously
        User user = userRepository.findByIdWithLock(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal currentBalance = user.getRitzTokenBalance() != null ? user.getRitzTokenBalance() : BigDecimal.ZERO;
        
        if (currentBalance.compareTo(amount) < 0) {
            throw new RuntimeException("INSUFFICIENT_TOKENS");
        }

        int amountToSpend = amount.intValue();
        
        // Identify individual token units to consume
        List<TokenUnit> unitsToSpend = tokenUnitRepository.findActiveUnits(userId, amountToSpend);
        
        if (unitsToSpend.size() < amountToSpend) {
            throw new RuntimeException("SERIALIZED_RECONCILIATION_ERROR: Not enough active units found");
        }

        // PERMANENT REMOVAL: Physical delete from database
        List<Long> unitIds = unitsToSpend.stream().map(TokenUnit::getId).collect(Collectors.toList());
        String placeholders = Collections.nCopies(unitIds.size(), "?").stream().collect(Collectors.joining(","));
        String deleteSql = "DELETE FROM token_units WHERE id IN (" + placeholders + ")";
        
        jdbcTemplate.update(deleteSql, unitIds.toArray());

        // Update cached user balance
        user.setRitzTokenBalance(currentBalance.subtract(amount));
        userRepository.save(user);

        TokenTransaction transaction = new TokenTransaction(
                user,
                amount,
                TokenTransaction.TransactionType.SPEND,
                "Regulated Food Payment (Burned " + amountToSpend + " units)",
                orderRef
        );
        transactionRepository.save(transaction);
        System.out.println("BURNED: " + amountToSpend + " Ritz tokens for user " + userId + " [Order: " + orderRef + "]");
    }

    @Transactional
    public void refund(Long userId, String orderRef, BigDecimal amount, String reason) {
        // Lock user for safety
        User user = userRepository.findByIdWithLock(userId)
                .orElseThrow(() -> new RuntimeException("User not found for refund"));

        // Since original tokens are deleted, we RESTORE balance by MINTING fresh tokens
        int tokenCount = amount.intValue();
        System.out.println("REFUNDING: Reminting " + tokenCount + " new Ritz tokens for user " + userId + " [" + reason + "]");
        
        String sql = "INSERT INTO token_units (token_hash, owner_id, status, created_at) VALUES (?, ?, 'ACTIVE', ?)";
        List<Object[]> batchArgs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = 0; i < tokenCount; i++) {
            batchArgs.add(new Object[]{generateSecureHash(), userId, now});
        }
        
        jdbcTemplate.batchUpdate(sql, batchArgs);

        // Update user balance
        BigDecimal currentBalance = user.getRitzTokenBalance() != null ? user.getRitzTokenBalance() : BigDecimal.ZERO;
        user.setRitzTokenBalance(currentBalance.add(amount));
        userRepository.save(user);

        // Log transaction
        TokenTransaction transaction = new TokenTransaction(
                user,
                amount,
                TokenTransaction.TransactionType.TOPUP,
                "Order Refund: " + reason + " (Ref: " + orderRef + ")",
                "REF-" + orderRef
        );
        transactionRepository.save(transaction);
    }

    private String generateSecureHash() {
        try {
            String base = UUID.randomUUID().toString() + System.nanoTime();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(base.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return "RTX-" + hexString.toString().substring(0, 32).toUpperCase();
        } catch (Exception e) {
            return "RTX-" + UUID.randomUUID().toString().toUpperCase();
        }
    }
}
