package com.rit.canteen.sales.service;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service to manage account lockouts due to consecutive failed login attempts.
 * If 5 failed attempts occur where successive attempts are within 5 seconds,
 * or 5 failed attempts occur in a 5-second window, the account is locked for 1 hour.
 */
@Service
public class LoginLockoutService {

    private static final long LOCKOUT_DURATION_MS = 60 * 60 * 1000L; // 1 hour
    private static final int MAX_ATTEMPTS = 5;
    private static final long MAX_INTERVAL_MS = 5000L; // 5 seconds

    private final Map<String, Long> lockouts = new ConcurrentHashMap<>();
    private final Map<String, List<Long>> failedAttempts = new ConcurrentHashMap<>();

    public boolean isLockedOut(String key) {
        if (key == null) return false;
        Long lockoutExpiry = lockouts.get(key);
        if (lockoutExpiry != null) {
            if (Instant.now().toEpochMilli() < lockoutExpiry) {
                return true;
            } else {
                // Lockout expired - clean up
                lockouts.remove(key);
                failedAttempts.remove(key);
            }
        }
        return false;
    }

    public long getRemainingLockoutTimeMs(String key) {
        if (key == null) return 0;
        Long lockoutExpiry = lockouts.get(key);
        if (lockoutExpiry != null) {
            long remaining = lockoutExpiry - Instant.now().toEpochMilli();
            return Math.max(0, remaining);
        }
        return 0;
    }

    public void registerFailedAttempt(String key) {
        if (key == null) return;
        long now = Instant.now().toEpochMilli();
        List<Long> attempts = failedAttempts.computeIfAbsent(key, k -> Collections.synchronizedList(new ArrayList<>()));

        synchronized (attempts) {
            attempts.add(now);
            
            // Keep only the last MAX_ATTEMPTS attempts
            while (attempts.size() > MAX_ATTEMPTS) {
                attempts.remove(0);
            }

            if (attempts.size() == MAX_ATTEMPTS) {
                // Check if all 5 attempts occurred within a 5 second window
                long firstAttempt = attempts.get(0);
                long lastAttempt = attempts.get(attempts.size() - 1);
                boolean allWithinWindow = (lastAttempt - firstAttempt) <= MAX_INTERVAL_MS;

                // Also check if each successive attempt is within 5 seconds of the previous one
                boolean successiveWithinInterval = true;
                for (int i = 1; i < attempts.size(); i++) {
                    if ((attempts.get(i) - attempts.get(i - 1)) > MAX_INTERVAL_MS) {
                        successiveWithinInterval = false;
                        break;
                    }
                }

                if (allWithinWindow || successiveWithinInterval) {
                    lockouts.put(key, now + LOCKOUT_DURATION_MS);
                }
            }
        }
    }

    public void resetAttempts(String key) {
        if (key == null) return;
        failedAttempts.remove(key);
        lockouts.remove(key);
    }
}
