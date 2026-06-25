package com.rit.canteen.sales.repository;

import com.rit.canteen.sales.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Order> findFirstByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Order> findFirstByUserIdAndStatusAndHasFeedbackFalseOrderByCreatedAtDesc(Long userId, String status);
    Optional<Order> findFirstByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);
    long countByCreatedAtGreaterThanEqual(LocalDateTime startOfDay);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<Order> findByIsArchivedFalseAndCreatedAtBefore(LocalDateTime timestamp);
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByStatusAndCancelRequestedAtBefore(String status, LocalDateTime cutoffTime);
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o")
    BigDecimal getTotalRevenue();

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED'")
    BigDecimal getTotalCompletedRevenue();

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED' AND (o.orderType = 'POS' OR o.orderType = 'STORE_ORDER' OR o.paymentMethod = 'CASH')")
    BigDecimal getCompletedStoreRevenue();

    @Query("SELECT COUNT(DISTINCT o.userId) FROM Order o WHERE o.createdAt >= :startOfDay")
    long countUniqueUsersToday(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(DISTINCT o.userId) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end")
    long countUniqueUsersInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal getRevenuePerPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal getCompletedRevenuePerPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED' AND (o.orderType = 'POS' OR o.orderType = 'STORE_ORDER' OR o.paymentMethod = 'CASH') AND o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal getCompletedStoreRevenuePerPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<Order> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT i.stallName, SUM(i.price * i.quantity), COUNT(DISTINCT o.id) " +
           "FROM Order o JOIN o.items i " +
           "WHERE o.createdAt >= :start AND o.createdAt <= :end " +
           "GROUP BY i.stallName")
    List<Object[]> getStoreOverview(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT HOUR(o.createdAt), SUM(o.totalAmount) " +
           "FROM Order o " +
           "WHERE o.createdAt >= :start AND o.createdAt <= :end " +
           "GROUP BY HOUR(o.createdAt) " +
           "ORDER BY HOUR(o.createdAt)")
    List<Object[]> getHourlySales(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p.name, p.category, SUM(i.quantity), p.imageData " +
           "FROM Order o JOIN o.items i JOIN Product p ON i.productId = p.id " +
           "WHERE o.createdAt >= :start AND o.createdAt <= :end " +
           "GROUP BY p.name, p.category, p.imageData " +
           "ORDER BY SUM(i.quantity) DESC")
    List<Object[]> getTopSellingItems(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
