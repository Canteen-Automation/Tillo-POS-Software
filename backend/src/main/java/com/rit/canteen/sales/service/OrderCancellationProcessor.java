package com.rit.canteen.sales.service;

import com.rit.canteen.sales.model.Order;
import com.rit.canteen.sales.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderCancellationProcessor {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TokenService tokenService;

    // Run every minute
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processPendingCancellations() {
        // Find orders that were requested to cancel more than 5 minutes ago
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(5);
        List<Order> pendingOrders = orderRepository.findByStatusAndCancelRequestedAtBefore("CANCEL_PENDING", cutoffTime);

        for (Order order : pendingOrders) {
            try {
                // Double check status just in case
                if (!"CANCEL_PENDING".equals(order.getStatus())) {
                    continue;
                }

                // Refund if token used
                if ("RITZ_TOKEN".equals(order.getPaymentMethod())) {
                    tokenService.refund(
                        order.getUserId(), 
                        "ORD-" + order.getDisplayOrderId(),
                        order.getTotalAmount(), 
                        "Auto-processed delayed cancellation"
                    );
                }

                order.setStatus("CANCELLED");
                orderRepository.save(order);
                
                System.out.println("[CANCELLATION PROCESSOR] Successfully cancelled order " + order.getOrderNumber());
            } catch (Exception e) {
                System.err.println("[CANCELLATION PROCESSOR] Error cancelling order " + order.getOrderNumber() + ": " + e.getMessage());
            }
        }
    }
}
