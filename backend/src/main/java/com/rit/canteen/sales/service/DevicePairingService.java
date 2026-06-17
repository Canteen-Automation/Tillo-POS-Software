package com.rit.canteen.sales.service;

import com.rit.canteen.sales.model.Terminal;
import com.rit.canteen.sales.repository.TerminalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages the in-memory OTP pairing lifecycle for ESP32 terminal devices.
 *
 * Flow:
 * 1. Device boots, generates a 6-digit OTP, displays it on screen
 * 2. Device calls registerOtp() — stores OTP + deviceId in memory (5-min TTL)
 * 3. Admin sees OTP on device screen, enters it in dashboard against a terminal
 * 4. Admin calls linkDevice() — matches OTP, binds device to terminal, returns apiKey
 * 5. Device polls checkPairingStatus() — gets back apiKey once admin completes step 4
 */
@Service
public class DevicePairingService {

    private static final long OTP_TTL_MS = 5 * 60 * 1000L; // 5 minutes

    @Autowired
    private TerminalRepository terminalRepository;

    /**
     * Represents a pending pairing request from a device.
     */
    private static class PairingRequest {
        final String otp;
        final String deviceId;
        final Instant createdAt;
        // Set once admin links the device
        volatile String apiKey;
        volatile Long terminalId;
        volatile boolean completed;

        PairingRequest(String otp, String deviceId) {
            this.otp = otp;
            this.deviceId = deviceId;
            this.createdAt = Instant.now();
            this.completed = false;
        }

        boolean isExpired() {
            return Instant.now().toEpochMilli() - createdAt.toEpochMilli() > OTP_TTL_MS;
        }
    }

    // OTP → PairingRequest
    private final ConcurrentHashMap<String, PairingRequest> pendingPairings = new ConcurrentHashMap<>();

    /**
     * Called by the ESP32 device. Registers (or refreshes) the device's OTP in memory.
     * If the OTP was already matched by an admin, returns the assigned apiKey.
     *
     * @return Map with status ("WAITING" or "PAIRED") and optionally "apiKey"
     */
    public Map<String, Object> registerOtp(String otp, String deviceId) {
        PairingRequest existing = pendingPairings.get(otp);

        // If this OTP was already linked by admin, return the apiKey
        if (existing != null && existing.completed && existing.deviceId.equals(deviceId)) {
            // Clean up after delivering the key
            pendingPairings.remove(otp);
            return Map.of(
                "status", "PAIRED",
                "apiKey", existing.apiKey,
                "terminalId", existing.terminalId
            );
        }

        // Register or refresh the OTP
        pendingPairings.put(otp, new PairingRequest(otp, deviceId));

        return Map.of("status", "WAITING");
    }

    /**
     * Called by the admin dashboard. Links a device's OTP to a specific terminal.
     *
     * @return Optional.empty() if OTP not found/expired, or the updated Terminal
     */
    public Optional<Terminal> linkDevice(Long terminalId, String otp) {
        PairingRequest request = pendingPairings.get(otp);

        if (request == null || request.isExpired()) {
            pendingPairings.remove(otp); // Clean up expired
            return Optional.empty();
        }

        Optional<Terminal> terminalOpt = terminalRepository.findById(terminalId);
        if (terminalOpt.isEmpty()) {
            return Optional.empty();
        }

        Terminal terminal = terminalOpt.get();

        // Bind the device to the terminal
        terminal.setDeviceId(request.deviceId);
        terminal.setPaired(true);
        terminal.setPairedAt(LocalDateTime.now());
        terminalRepository.save(terminal);

        // Mark the pairing as completed so the device can pick up the apiKey
        request.apiKey = terminal.getApiKey();
        request.terminalId = terminal.getId();
        request.completed = true;

        System.out.println(">>> Device paired: " + request.deviceId +
            " → Terminal: " + terminal.getName() + " [ID: " + terminal.getId() + "]");

        return Optional.of(terminal);
    }

    /**
     * Unpairs a device from a terminal, clearing its deviceId and paired status.
     */
    public Optional<Terminal> unpairDevice(Long terminalId) {
        Optional<Terminal> terminalOpt = terminalRepository.findById(terminalId);
        if (terminalOpt.isEmpty()) {
            return Optional.empty();
        }

        Terminal terminal = terminalOpt.get();
        terminal.setDeviceId(null);
        terminal.setPaired(false);
        terminal.setPairedAt(null);
        terminalRepository.save(terminal);

        System.out.println(">>> Device unpaired from Terminal: " + terminal.getName() +
            " [ID: " + terminal.getId() + "]");

        return Optional.of(terminal);
    }

    /**
     * Periodic cleanup of expired OTP entries (runs every 60 seconds).
     */
    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredOtps() {
        pendingPairings.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
}
