package com.rit.canteen.sales.controller;

import com.rit.canteen.sales.model.Order;
import com.rit.canteen.sales.model.OrderItem;
import com.rit.canteen.sales.model.Product;
import com.rit.canteen.sales.model.User;
import com.rit.canteen.sales.repository.OrderRepository;
import com.rit.canteen.sales.repository.ProductRepository;
import io.jsonwebtoken.Claims;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.rit.canteen.sales.repository.UserRepository;
import com.rit.canteen.sales.service.OrderArchiverService;
import com.rit.canteen.sales.service.TokenService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderArchiverService orderArchiverService;

    @Autowired
    private TokenService tokenService;

    private static final ThreadLocal<List<Map<String, Object>>> requestConflicts = new ThreadLocal<>();

    // ── STAFF/MASTER: all orders ──────────────────────────────────────────

    @GetMapping("/all")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentType,
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean archived,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Specification<Order> spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(cb.equal(root.get("isArchived"), archived));
                if (startDate != null) predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
                if (endDate != null) predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
                if (status != null && !status.isEmpty()) predicates.add(cb.equal(root.get("status"), status));
                if (paymentType != null && !paymentType.isEmpty()) predicates.add(cb.equal(root.get("paymentMethod"), paymentType));
                if (orderType != null && !orderType.isEmpty()) predicates.add(cb.equal(root.get("orderType"), orderType));
                if (search != null && !search.isEmpty()) {
                    String searchLower = "%" + search.toLowerCase() + "%";
                    Join<Order, User> userJoin = root.join("user", JoinType.LEFT);
                    predicates.add(cb.or(
                        cb.like(cb.lower(root.get("displayOrderId")), searchLower),
                        cb.like(cb.lower(root.get("orderNumber")), searchLower),
                        cb.like(cb.lower(userJoin.get("name")), searchLower),
                        cb.like(cb.lower(userJoin.get("mobileNumber")), searchLower)
                    ));
                }
                if (query != null && !Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                    root.fetch("user", JoinType.LEFT);
                }
                return cb.and(predicates.toArray(new Predicate[0]));
            };
            Page<Order> orderPage = orderRepository.findAll(spec, pageable);
            return ResponseEntity.ok(orderPage);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/archive-now")
    public ResponseEntity<?> triggerArchival() {
        try {
            int count = orderArchiverService.archiveNow();
            return ResponseEntity.ok(Map.of("success", true, "archivedCount", count));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── CUSTOMER: place order ─────────────────────────────────────────────

    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> placeOrder(@RequestBody Order order) {
        // ── SECURITY: Verify userId matches the JWT, or is placed by staff ──
        Long tokenUserId = getTokenUserId();
        if (tokenUserId != null && !tokenUserId.equals(order.getUserId())) {
            // Customer can only order for themselves
            if (!isStaff()) {
                return ResponseEntity.status(403).body(
                    Map.of("success", false, "message", "You can only place orders for yourself"));
            }
        }

        if (isStaff()) {
            Optional<User> posUserOpt = userRepository.findByMobileNumber("0000000000");
            User posUser;
            if (posUserOpt.isPresent()) {
                posUser = posUserOpt.get();
            } else {
                posUser = new User();
                posUser.setMobileNumber("0000000000");
                posUser.setName("POS");
                posUser.setPinHash("NOT_APPLICABLE");
                posUser.setCreatedAt(LocalDateTime.now());
                posUser.setUpdatedAt(LocalDateTime.now());
                posUser = userRepository.save(posUser);
            }
            order.setUserId(posUser.getId());
            order.setOrderType("POS");
        }

        if (order.getItems() == null || order.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Order must have items"));
        }

        // ── SECURITY: Server-side price verification ──────────────────────
        BigDecimal serverTotal = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            if (item.getProductId() != null) {
                Optional<Product> productOpt = productRepository.findById(item.getProductId());
                if (productOpt.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false, "message", "Product not found: " + item.getProductId()));
                }
                Product product = productOpt.get();
                // Use offer price if present, otherwise base price
                BigDecimal unitPrice = (product.getOfferPrice() != null && product.getOfferPrice().compareTo(BigDecimal.ZERO) > 0)
                    ? product.getOfferPrice() : product.getPrice();
                serverTotal = serverTotal.add(unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }

        // Allow ±5 tolerance for rounding differences
        if (serverTotal.subtract(order.getTotalAmount()).abs().compareTo(new BigDecimal("5")) > 0) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Price mismatch detected. Please refresh and try again.",
                "serverTotal", serverTotal,
                "clientTotal", order.getTotalAmount()
            ));
        }
        // Always use server-calculated total
        order.setTotalAmount(serverTotal);

        // ── Stock check & update ──────────────────────────────────────────
        List<Map<String, Object>> stockConflicts = new ArrayList<>();
        requestConflicts.remove();

        for (OrderItem item : order.getItems()) {
            Long productId = item.getProductId();
            if (productId != null) {
                int updatedRows = productRepository.decrementStock(productId, item.getQuantity());
                if (updatedRows == 0) {
                    Product p = productRepository.findById(productId).orElse(null);
                    int left = (p != null && p.getStock() != null) ? p.getStock() : 0;
                    Map<String, Object> conflict = new HashMap<>();
                    conflict.put("productId", productId);
                    conflict.put("productName", item.getProductName());
                    conflict.put("requested", item.getQuantity());
                    conflict.put("available", left);
                    stockConflicts.add(conflict);
                }
            }
        }

        if (!stockConflicts.isEmpty()) {
            requestConflicts.set(stockConflicts);
            throw new RuntimeException("CONCURRENCY_STOCK_FAILURE");
        }

        // ── Complete Order Details ────────────────────────────────────────
        for (OrderItem item : order.getItems()) {
            item.setOrder(order);
            if (item.getStallName() == null || item.getStallName().isEmpty() || item.getStallName().equals("Unknown Stall")) {
                item.setStallName("RIT Canteen");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        order.setCreatedAt(now);
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        long todaysOrderCount = orderRepository.countByCreatedAtGreaterThanEqual(startOfDay);
        order.setDisplayOrderId(String.format("%03d", todaysOrderCount + 1));

        // ── Token payment ────────────────────────────────────────────────
        if ("RITZ_TOKEN".equals(order.getPaymentMethod())) {
            try {
                tokenService.spend(order.getUserId(), order.getTotalAmount(), "ORD-" + order.getDisplayOrderId());
            } catch (RuntimeException e) {
                if ("INSUFFICIENT_TOKENS".equals(e.getMessage())) throw new RuntimeException("INSUFFICIENT_TOKENS");
                throw e;
            }
        }

        Order savedOrder = orderRepository.save(order);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "orderNumber", savedOrder.getOrderNumber(),
            "displayOrderId", savedOrder.getDisplayOrderId(),
            "message", "Order placed successfully"
        ));
    }

    // ── CUSTOMER: own orders ──────────────────────────────────────────────

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(@PathVariable Long userId) {
        // Customer can only access their own orders
        Long tokenUserId = getTokenUserId();
        if (tokenUserId != null && !tokenUserId.equals(userId) && !isStaff()) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(orderRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            return orderRepository.findById(id).map(order -> {
                // ── SECURITY: Verify ownership of order ──
                Long tokenUserId = getTokenUserId();
                if (tokenUserId != null && !tokenUserId.equals(order.getUserId()) && !isStaff()) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
                }
                
                String oldStatus = order.getStatus();
                if ("COMPLETED".equalsIgnoreCase(oldStatus) || "DELIVERED".equalsIgnoreCase(oldStatus) || "CANCELLED".equalsIgnoreCase(oldStatus)) {
                    return ResponseEntity.status(400).body(Map.of("error", "Cannot cancel an order that is already " + oldStatus));
                }

                if ("CANCEL_PENDING".equalsIgnoreCase(oldStatus)) {
                    return ResponseEntity.status(400).body(Map.of("error", "Cancellation is already pending for this order."));
                }

                if (!isStaff()) {
                    // Customer cancellation -> CANCEL_PENDING (delayed)
                    order.setStatus("CANCEL_PENDING");
                    order.setCancelRequestedAt(LocalDateTime.now());
                    orderRepository.save(order);
                    return ResponseEntity.ok(Map.of("success", true, "message", "Cancellation requested. It will be processed in 5 minutes unless the order is already being prepared."));
                } else {
                    // Staff manual cancellation -> instant CANCELLED
                    if ("RITZ_TOKEN".equals(order.getPaymentMethod())) {
                        tokenService.refund(order.getUserId(), "ORD-" + order.getDisplayOrderId(),
                                            order.getTotalAmount(), "Order Cancelled by Staff");
                    }
                    order.setStatus("CANCELLED");
                    orderRepository.save(order);
                    return ResponseEntity.ok(Map.of("success", true, "message", "Order cancelled successfully"));
                }
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── STAFF/MASTER: order management ────────────────────────────────────

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id,
                                               @RequestBody Map<String, String> statusUpdate) {
        try {
            String newStatus = statusUpdate.get("status");
            if (newStatus == null || newStatus.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            return orderRepository.findById(id).map(order -> {
                String oldStatus = order.getStatus();
                String nextStatus = newStatus.toUpperCase();
                if ("CANCELLED".equals(nextStatus) && !"CANCELLED".equals(oldStatus)) {
                    if ("RITZ_TOKEN".equals(order.getPaymentMethod())) {
                        tokenService.refund(order.getUserId(), "ORD-" + order.getDisplayOrderId(),
                                            order.getTotalAmount(), "Status changed to CANCELLED");
                    }
                }
                order.setStatus(nextStatus);
                orderRepository.save(order);
                return ResponseEntity.ok(Map.of("success", true, "message", "Order status updated to " + nextStatus));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable Long id, @RequestBody Order updatedOrder) {
        try {
            return orderRepository.findById(id).map(existingOrder -> {
                // ── SECURITY: Verify ownership of order ──
                Long tokenUserId = getTokenUserId();
                if (tokenUserId != null && !tokenUserId.equals(existingOrder.getUserId()) && !isStaff()) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
                }
                
                // Cannot modify completed/delivered orders
                if ("COMPLETED".equalsIgnoreCase(existingOrder.getStatus()) || "DELIVERED".equalsIgnoreCase(existingOrder.getStatus())) {
                    return ResponseEntity.status(400).body(Map.of("error", "Cannot modify a completed or delivered order"));
                }

                BigDecimal oldAmount = existingOrder.getTotalAmount();
                BigDecimal newAmount = updatedOrder.getTotalAmount();

                if ("RITZ_TOKEN".equals(existingOrder.getPaymentMethod())) {
                    int comparison = newAmount.compareTo(oldAmount);
                    if (comparison > 0) {
                        tokenService.spend(existingOrder.getUserId(), newAmount.subtract(oldAmount),
                                           "ORD-EDIT-" + existingOrder.getDisplayOrderId());
                    } else if (comparison < 0) {
                        tokenService.refund(existingOrder.getUserId(), "ORD-" + existingOrder.getDisplayOrderId(),
                                            oldAmount, "Order price reduced during edit");
                        tokenService.spend(existingOrder.getUserId(), newAmount, "ORD-" + existingOrder.getDisplayOrderId());
                    }
                }

                existingOrder.setTotalAmount(newAmount);
                existingOrder.setPaymentMethod(updatedOrder.getPaymentMethod());
                if (updatedOrder.getStatus() != null) {
                    existingOrder.setStatus(updatedOrder.getStatus().toUpperCase());
                }

                // Safely copy items into new instances (without IDs) to trigger correct orphan removal
                List<OrderItem> newItems = new ArrayList<>();
                if (updatedOrder.getItems() != null) {
                    for (OrderItem item : updatedOrder.getItems()) {
                        OrderItem newItem = new OrderItem();
                        newItem.setProductId(item.getProductId());
                        newItem.setProductName(item.getProductName());
                        newItem.setPrice(item.getPrice());
                        newItem.setQuantity(item.getQuantity());
                        newItem.setStallId(item.getStallId());
                        newItem.setStallName(item.getStallName());
                        newItem.setOrder(existingOrder);
                        newItems.add(newItem);
                    }
                }
                existingOrder.getItems().clear();
                existingOrder.getItems().addAll(newItems);

                Order saved = orderRepository.save(existingOrder);
                return ResponseEntity.ok(saved);
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException e) {
        if ("CONCURRENCY_STOCK_FAILURE".equals(e.getMessage())) {
            List<Map<String, Object>> conflicts = requestConflicts.get();
            requestConflicts.remove();
            return ResponseEntity.status(400).body(Map.of(
                "success", false, "errorType", "STOCK_ERROR",
                "message", "Some items in your cart are no longer available in the requested quantity.",
                "conflicts", conflicts != null ? conflicts : new ArrayList<>()
            ));
        }
        if ("INSUFFICIENT_TOKENS".equals(e.getMessage())) {
            return ResponseEntity.status(400).body(Map.of(
                "success", false, "errorType", "TOKEN_ERROR",
                "message", "Insufficient Ritz Tokens. Please top up your wallet."
            ));
        }
        return ResponseEntity.status(500).body(Map.of(
            "success", false,
            "message", e.getMessage() != null ? e.getMessage() : "Internal Server Error"
        ));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

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

    private boolean isStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_MASTER")
                       || a.getAuthority().equals("ROLE_MANAGER")
                       || a.getAuthority().equals("ROLE_STAFF"));
    }
}
