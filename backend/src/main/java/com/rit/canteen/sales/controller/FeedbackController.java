package com.rit.canteen.sales.controller;

import com.rit.canteen.sales.model.Feedback;
import com.rit.canteen.sales.model.ItemRating;
import com.rit.canteen.sales.model.Order;
import com.rit.canteen.sales.repository.FeedbackRepository;
import com.rit.canteen.sales.repository.ItemRatingRepository;
import com.rit.canteen.sales.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.rit.canteen.sales.service.SystemNotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import io.jsonwebtoken.Claims;

import java.util.*;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ItemRatingRepository itemRatingRepository;

    @Autowired
    private SystemNotificationService notificationService;

    @GetMapping
    public Page<Feedback> getAllFeedback(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return feedbackRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @GetMapping("/item-details")
    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getItemDetails(
            @RequestParam String productName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String trimmedName = productName != null ? productName.trim() : "";
        
        // Sort by feedback.createdAt DESC
        Sort sort = Sort.by(Sort.Direction.DESC, "feedback.createdAt");
        Page<ItemRating> ratings = itemRatingRepository.findByProductNameIgnoreCase(trimmedName, PageRequest.of(page, size, sort));
        
        return ratings.map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("rating", r.getRating());
            
            // Priority: Item-specific comment -> parent Feedback comment -> empty
            String comment = r.getComment();
            Feedback f = r.getFeedback();
            if (comment == null || comment.isBlank()) {
                if (f != null) {
                    comment = f.getComment();
                }
            }
            
            map.put("comment", comment != null ? comment : "");
            map.put("date", f != null ? f.getCreatedAt() : java.time.LocalDateTime.now());
            map.put("userName", f != null ? f.getUserName() : "Anonymous");
            map.put("orderNumber", (f != null && f.getOrder() != null) ? f.getOrder().getOrderNumber() : "N/A");
            return map;
        });
    }

    @GetMapping("/item-stats")
    public Map<String, Object> getItemStats(@RequestParam String productName) {
        Map<String, Object> stats = new HashMap<>();
        List<Object[]> distribution = feedbackRepository.getItemRatingDistribution(productName);
        List<Map<String, Object>> distList = new ArrayList<>();
        
        long totalCount = 0;
        double sum = 0;
        
        for (Object[] row : distribution) {
            Map<String, Object> item = new HashMap<>();
            int rating = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            item.put("rating", rating);
            item.put("count", count);
            distList.add(item);
            
            totalCount += count;
            sum += (rating * count);
        }
        
        stats.put("distribution", distList);
        stats.put("totalReviews", totalCount);
        stats.put("averageRating", totalCount > 0 ? sum / totalCount : 0.0);
        
        return stats;
    }

    @GetMapping("/stats")
    public Map<String, Object> getFeedbackStats() {
        Map<String, Object> stats = new HashMap<>();
        
        Double avg = feedbackRepository.getAverageRating();
        stats.put("averageRating", avg != null ? avg : 0.0);
        
        List<Object[]> distribution = feedbackRepository.getRatingDistribution();
        List<Map<String, Object>> distList = new ArrayList<>();
        for (Object[] row : distribution) {
            Map<String, Object> item = new HashMap<>();
            item.put("rating", ((Number) row[0]).intValue());
            item.put("count", ((Number) row[1]).longValue());
            distList.add(item);
        }
        stats.put("distribution", distList);
        
        List<Object[]> topRated = feedbackRepository.getTopRatedItems();
        List<Map<String, Object>> topList = new ArrayList<>();
        for (Object[] row : topRated) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("average", row[1] != null ? ((Number) row[1]).doubleValue() : 0.0);
            item.put("count", row[2] != null ? ((Number) row[2]).longValue() : 0);
            topList.add(item);
        }
        stats.put("ratedItems", topList);
        
        return stats;
    }

    @GetMapping("/latest-unrated/{userId}")
    public ResponseEntity<Order> getLatestUnratedOrder(@PathVariable Long userId) {
        if (!canAccessUser(userId)) {
            return ResponseEntity.status(403).build();
        }
        // Look for any order that is either PAID or COMPLETED
        Optional<Order> latestOrderOpt = orderRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);
        
        if (latestOrderOpt.isPresent()) {
            Order order = latestOrderOpt.get();
            String status = order.getStatus().toUpperCase();
            if ((status.equals("PAID") || status.equals("COMPLETED")) && !order.isHasFeedback()) {
                return ResponseEntity.ok(order);
            }
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/skip/{orderId}")
    @Transactional
    public ResponseEntity<Void> skipFeedback(@PathVariable Long orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            if (!canAccessUser(order.getUserId())) {
                return ResponseEntity.status(403).build();
            }
            order.setHasFeedback(true);
            orderRepository.save(order);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/submit")
    @Transactional
    public ResponseEntity<Feedback> submitFeedback(@RequestBody Feedback feedback) {
        if (feedback.getOrder() == null || feedback.getOrder().getId() == null) {
            return ResponseEntity.badRequest().build();
        }

        Optional<Order> orderOpt = orderRepository.findById(feedback.getOrder().getId());
        if (orderOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Order order = orderOpt.get();
        if (!canAccessUser(order.getUserId())) {
            return ResponseEntity.status(403).build();
        }
        feedback.setOrder(order);
        
        // Link item ratings to feedback and propagate comment
        if (feedback.getItemRatings() != null) {
            for (ItemRating rating : feedback.getItemRatings()) {
                rating.setFeedback(feedback);
                // Propagate the general comment to each item for better visibility in item-wise dashboard
                if (rating.getComment() == null || rating.getComment().isBlank()) {
                    rating.setComment(feedback.getComment());
                }
            }
        }

        Feedback savedFeedback = feedbackRepository.save(feedback);
        
        // Mark order as rated
        order.setHasFeedback(true);
        orderRepository.save(order);

        // Notify Admins
        notificationService.createNotification(
            "New Feedback Received",
            "A new feedback has been submitted by " + (feedback.getUserName() != null ? feedback.getUserName() : "a customer") + " for Order #" + order.getDisplayOrderId(),
            "FEEDBACK",
            "/feedback"
        );

        return ResponseEntity.ok(savedFeedback);
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
