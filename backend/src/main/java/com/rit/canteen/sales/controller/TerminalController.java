package com.rit.canteen.sales.controller;

import com.rit.canteen.sales.model.Order;
import com.rit.canteen.sales.model.Terminal;
import com.rit.canteen.sales.model.TerminalDTO;
import com.rit.canteen.sales.service.DevicePairingService;
import com.rit.canteen.sales.service.TerminalService;
import com.rit.canteen.sales.repository.TerminalRepository;
import com.rit.canteen.sales.repository.OrderRepository;
import com.rit.canteen.sales.repository.StallRepository;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
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

    @Autowired
    private StallRepository stallRepository;

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

    @GetMapping("/counters")
    public ResponseEntity<?> getCounters(
            @RequestHeader(value = "X-API-KEY", required = false) String apiKeyHeader,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        String apiKey = extractApiKey(apiKeyHeader, authHeader);
        if (apiKey == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or missing token"));
        }

        // 1. Verify API Key
        Optional<Terminal> terminal = terminalRepository.findByApiKey(apiKey);
        if (terminal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid API Key"));
        }

        List<Map<String, String>> counters = stallRepository.findAll().stream()
                .map(stall -> Map.of(
                        "counterId", String.valueOf(stall.getId()),
                        "name", stall.getName()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("data", counters));
    }

    private List<String> parseAndCleanOrderNumbers(String input) {
        if (input == null || input.isBlank()) {
            return Collections.emptyList();
        }
        // Normalize common URL encodings or text replacements of carriage return/newline
        String normalized = input
            .replace("%0D", "\r")
            .replace("%0d", "\r")
            .replace("%0A", "\n")
            .replace("%0a", "\n")
            .replace("0x0d", "\r")
            .replace("0x0D", "\r")
            .replace("0x0a", "\n")
            .replace("0x0A", "\n");

        String[] parts = normalized.split("[\\r\\n\\s,;]+");
        List<String> cleanList = new ArrayList<>();
        for (String part : parts) {
            String clean = part.trim();
            if (!clean.isEmpty()) {
                cleanList.add(clean);
            }
        }
        return cleanList;
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getOrderForTerminal(
            @RequestParam("paymentId") String paymentId,
            @RequestHeader(value = "X-API-KEY", required = false) String apiKeyHeader,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        String apiKey = extractApiKey(apiKeyHeader, authHeader);
        if (apiKey == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or missing token"));
        }

        // 1. Verify API Key
        Optional<Terminal> terminal = terminalRepository.findByApiKey(apiKey);
        if (terminal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid API Key"));
        }

        // 2. Parse and Clean payment IDs
        List<String> orderNumbers = parseAndCleanOrderNumbers(paymentId);
        if (orderNumbers.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "paymentId required"));
        }

        // 3. Try to fetch the first order that exists
        for (String orderNum : orderNumbers) {
            Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNum);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                
                // Check if order is expired/archived
                if (order.isArchived()) {
                    continue; // Check other IDs if available, or return GONE
                }

                // Check if order is already fulfilled
                if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "This order has already been fulfilled and cannot be printed again."));
                }
                
                return ResponseEntity.ok(order);
            }
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
    }

    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<?> getOrderForTerminalByPath(
            @PathVariable("orderNumber") String orderNumber,
            @RequestHeader(value = "X-API-KEY", required = false) String apiKeyHeader,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        String apiKey = extractApiKey(apiKeyHeader, authHeader);
        if (apiKey == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or missing token"));
        }

        // 1. Verify API Key
        Optional<Terminal> terminal = terminalRepository.findByApiKey(apiKey);
        if (terminal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid API Key"));
        }

        // 2. Parse and Clean order numbers
        List<String> orderNumbers = parseAndCleanOrderNumbers(orderNumber);
        if (orderNumbers.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "orderNumber required"));
        }

        // 3. Try to fetch the first order that exists
        for (String orderNum : orderNumbers) {
            Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNum);
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
            }
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
    }

    @PutMapping("/orders/delivered")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> markOrderAsDelivered(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-API-KEY", required = false) String apiKeyHeader,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        String orderNumber = body.get("orderNumber");
        if (orderNumber == null || orderNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "orderNumber required"));
        }

        String apiKey = extractApiKey(apiKeyHeader, authHeader);
        if (apiKey == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or missing token"));
        }
        
        // 1. Verify API Key
        Optional<Terminal> terminal = terminalRepository.findByApiKey(apiKey);
        if (terminal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid API Key"));
        }

        // 2. Parse and Clean order numbers
        List<String> orderNumbers = parseAndCleanOrderNumbers(orderNumber);
        if (orderNumbers.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "orderNumber required"));
        }

        // 3. Process all found orders
        List<String> successfulOrders = new ArrayList<>();
        boolean alreadyCompleted = false;
        boolean archivedFound = false;

        for (String orderNum : orderNumbers) {
            Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNum);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                
                if (order.isArchived()) {
                    archivedFound = true;
                    continue;
                }

                if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
                    alreadyCompleted = true;
                    successfulOrders.add(orderNum);
                    continue;
                }

                // Update status to COMPLETED
                order.setStatus("COMPLETED");
                orderRepository.save(order);
                successfulOrders.add(orderNum);
            }
        }

        if (!successfulOrders.isEmpty()) {
            String msg = alreadyCompleted && successfulOrders.size() == 1 
                ? "Order was already marked as delivered." 
                : "Order(s) marked as delivered successfully: " + String.join(", ", successfulOrders);
            return ResponseEntity.ok(Map.of("success", true, "message", msg));
        }

        if (archivedFound) {
            return ResponseEntity.status(HttpStatus.GONE)
                .body(Map.of("message", "The requested order(s) have expired/archived."));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
    }

    @PostMapping("/orders/{orderNumber}/delivered")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> markOrderAsDeliveredPost(
            @PathVariable("orderNumber") String orderNumber,
            @RequestHeader(value = "X-API-KEY", required = false) String apiKeyHeader,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (orderNumber == null || orderNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "orderNumber required"));
        }

        String apiKey = extractApiKey(apiKeyHeader, authHeader);
        if (apiKey == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or missing token"));
        }
        
        // 1. Verify API Key
        Optional<Terminal> terminal = terminalRepository.findByApiKey(apiKey);
        if (terminal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid API Key"));
        }

        // 2. Parse and Clean order numbers
        List<String> orderNumbers = parseAndCleanOrderNumbers(orderNumber);
        if (orderNumbers.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "orderNumber required"));
        }

        // 3. Process all found orders
        List<String> successfulOrders = new ArrayList<>();
        boolean alreadyCompleted = false;
        boolean archivedFound = false;

        for (String orderNum : orderNumbers) {
            Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNum);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                
                if (order.isArchived()) {
                    archivedFound = true;
                    continue;
                }

                if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
                    alreadyCompleted = true;
                    successfulOrders.add(orderNum);
                    continue;
                }

                // Update status to COMPLETED
                order.setStatus("COMPLETED");
                orderRepository.save(order);
                successfulOrders.add(orderNum);
            }
        }

        if (!successfulOrders.isEmpty()) {
            String msg = alreadyCompleted && successfulOrders.size() == 1 
                ? "Order was already marked as delivered." 
                : "Order(s) marked as delivered successfully: " + String.join(", ", successfulOrders);
            return ResponseEntity.ok(Map.of("success", true, "message", msg));
        }

        if (archivedFound) {
            return ResponseEntity.status(HttpStatus.GONE)
                .body(Map.of("message", "The requested order(s) have expired/archived."));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
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
    @GetMapping("/pair")
    public ResponseEntity<?> registerDeviceOtp(@RequestParam("otp") String otp) {
        if (otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP is required"));
        }

        Map<String, Object> result = devicePairingService.registerOtp(otp, "ESP32-Device");
        if ("PAIRED".equals(result.get("status"))) {
            return ResponseEntity.ok(Map.of(
                "status", "PAIRED",
                "apiKey", result.get("apiKey"),
                "terminalId", result.get("terminalId")
            ));
        }
        return ResponseEntity.ok(Map.of("status", "WAITING"));
    }

    @PostMapping("/pair")
    public ResponseEntity<?> registerDeviceOtpPost(@RequestBody Map<String, String> body) {
        String otp = body.get("otp");
        String deviceId = body.get("deviceId");

        if (otp == null || otp.isBlank() || deviceId == null || deviceId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "otp and deviceId are required"));
        }

        Map<String, Object> result = devicePairingService.registerOtp(otp, deviceId);
        if ("PAIRED".equals(result.get("status"))) {
            return ResponseEntity.ok(Map.of(
                "status", "PAIRED",
                "apiKey", result.get("apiKey"),
                "terminalId", result.get("terminalId")
            ));
        }
        return ResponseEntity.ok(Map.of("status", "WAITING"));
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

    private String extractApiKey(String apiKeyHeader, String authHeader) {
        if (apiKeyHeader != null && !apiKeyHeader.isBlank()) {
            return apiKeyHeader;
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        return null;
    }
}
