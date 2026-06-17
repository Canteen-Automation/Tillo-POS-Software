package com.rit.canteen.sales.controller;

import com.rit.canteen.sales.model.Order;
import com.rit.canteen.sales.model.Terminal;
import com.rit.canteen.sales.model.TerminalDTO;
import com.rit.canteen.sales.service.DevicePairingService;
import com.rit.canteen.sales.service.TerminalService;
import com.rit.canteen.sales.repository.TerminalRepository;
import com.rit.canteen.sales.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/terminals")
public class TerminalController {

    @Autowired
    private TerminalService terminalService;

    @Autowired
    private DevicePairingService devicePairingService;

    @Autowired
    private TerminalRepository terminalRepository;

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping
    public List<TerminalDTO> getAllTerminals() {
        return terminalService.getAllTerminals().stream()
            .map(t -> new TerminalDTO(
                t.getId(), 
                t.getName(), 
                t.getLocation(), 
                "********", 
                "****",
                t.isPaired(),
                t.getDeviceId() != null ? maskDeviceId(t.getDeviceId()) : null,
                t.getPairedAt()
            ))
            .toList();
    }

    @PostMapping
    public ResponseEntity<Terminal> createTerminal(@RequestBody Terminal terminal) {
        Terminal created = terminalService.createTerminal(terminal);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/verify-pin")
    public ResponseEntity<?> verifyPinAndGetDetails(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String pin = request.get("pin");
        if (terminalService.verifyPin(id, pin)) {
            Optional<Terminal> terminal = terminalService.getTerminalById(id);
            return ResponseEntity.ok(terminal.get());
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid Security PIN"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTerminal(@PathVariable Long id) {
        terminalService.deleteTerminal(id);
        return ResponseEntity.noContent().build();
    }

    // ──────────────────────────────────────────────────────────────
    //  Order Lookup (ESP32 uses X-API-KEY)
    // ──────────────────────────────────────────────────────────────

    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<?> getOrderForTerminal(
            @PathVariable String orderNumber,
            @RequestHeader("X-API-KEY") String apiKey) {
        
        // 1. Verify API Key
        Optional<Terminal> terminal = terminalRepository.findByApiKey(apiKey);
        if (terminal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid API Key"));
        }

        // 2. Fetch Order
        Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            
            // Check if order is expired/archived
            if (order.isArchived()) {
                return ResponseEntity.status(HttpStatus.GONE)
                    .body(Map.of("message", "This order has expired and cannot be processed."));
            }

            // Check if order is already fulfilled
            if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "This order has already been fulfilled and cannot be printed again."));
            }
            
            return ResponseEntity.ok(order);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateApiKey(@RequestHeader("X-API-KEY") String apiKey) {
        Optional<Terminal> terminal = terminalRepository.findByApiKey(apiKey);
        if (terminal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", "INVALID", "message", "Invalid API Key"));
        }
        Terminal t = terminal.get();
        System.out.println(">>> Terminal Connected & Validated: " + t.getName() + " [ID: " + t.getId() + ", Location: " + t.getLocation() + "]");
        return ResponseEntity.ok(Map.of(
            "status", "VALID",
            "terminalId", t.getId(),
            "name", t.getName(),
            "location", t.getLocation()
        ));
    }

    // ──────────────────────────────────────────────────────────────
    //  OTP-Based Device Pairing
    // ──────────────────────────────────────────────────────────────

    /**
     * POST /api/terminals/pair
     * Called by ESP32 during setup. The device sends its OTP and chipId.
     * If pairing is already completed (admin linked it), returns the apiKey.
     * Otherwise returns status "WAITING".
     * 
     * No auth required — the device has no credentials yet.
     */
    @PostMapping("/pair")
    public ResponseEntity<?> registerDeviceOtp(@RequestBody Map<String, String> body) {
        String otp = body.get("otp");
        String deviceId = body.get("deviceId");

        if (otp == null || otp.isBlank() || deviceId == null || deviceId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Both 'otp' and 'deviceId' are required"));
        }

        Map<String, Object> result = devicePairingService.registerOtp(otp, deviceId);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/terminals/{id}/link-device
     * Called by admin dashboard. Admin enters the OTP shown on the ESP32 screen.
     * Links the device to this terminal record.
     * 
     * Requires JWT auth (admin role).
     */
    @PostMapping("/{id}/link-device")
    public ResponseEntity<?> linkDevice(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String otp = body.get("otp");

        if (otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP is required"));
        }

        Optional<Terminal> result = devicePairingService.linkDevice(id, otp);
        if (result.isPresent()) {
            Terminal t = result.get();
            return ResponseEntity.ok(Map.of(
                "message", "Device linked successfully",
                "terminalId", t.getId(),
                "name", t.getName(),
                "deviceId", t.getDeviceId()
            ));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Invalid or expired OTP. Please check the code on the device screen and try again."));
        }
    }

    /**
     * POST /api/terminals/{id}/unpair
     * Called by admin dashboard to disconnect a device from a terminal.
     * The device will need to re-pair on next boot.
     */
    @PostMapping("/{id}/unpair")
    public ResponseEntity<?> unpairDevice(@PathVariable Long id) {
        Optional<Terminal> result = devicePairingService.unpairDevice(id);
        if (result.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Device unpaired successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Terminal not found"));
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────────────────────

    /**
     * Masks a device ID for display: "Esp 32 - AABBCCDDEEFF" → "Esp 32 - AA••••••EEFF"
     */
    private String maskDeviceId(String deviceId) {
        if (deviceId == null || deviceId.length() < 8) return deviceId;
        // Find the last part (MAC portion) of the device ID
        int dashIndex = deviceId.lastIndexOf('-');
        if (dashIndex >= 0 && dashIndex + 5 < deviceId.length()) {
            String prefix = deviceId.substring(0, dashIndex + 1).trim();
            String mac = deviceId.substring(dashIndex + 1).trim();
            if (mac.length() >= 6) {
                return prefix + " " + mac.substring(0, 2) + "••••" + mac.substring(mac.length() - 4);
            }
        }
        return deviceId.substring(0, 4) + "••••" + deviceId.substring(deviceId.length() - 4);
    }
}
