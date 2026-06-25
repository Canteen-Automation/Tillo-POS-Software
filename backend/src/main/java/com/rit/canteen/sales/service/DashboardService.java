package com.rit.canteen.sales.service;

import com.rit.canteen.sales.model.DashboardStats;
import com.rit.canteen.sales.model.GeneralDashboardData;
import com.rit.canteen.sales.model.Order;
import com.rit.canteen.sales.model.TrendingItem;
import com.rit.canteen.sales.repository.OrderRepository;
import com.rit.canteen.sales.repository.PurchaseOrderRepository;
import com.rit.canteen.sales.repository.VendorRepository;
import com.rit.canteen.sales.repository.TokenTransactionRepository;
import com.rit.canteen.sales.repository.UserRepository;
import com.rit.canteen.sales.model.ProcurementDashboardData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class DashboardService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private VendorRepository vendorRepository;
    
    @Autowired
    private TokenTransactionRepository tokenTransactionRepository;

    @Autowired
    private UserRepository userRepository;

    public GeneralDashboardData getGeneralDashboardData(LocalDateTime from, LocalDateTime to) {
        java.time.ZoneId zone = java.time.ZoneId.of("Asia/Kolkata");
        if (from == null) from = java.time.LocalDate.now(zone).atStartOfDay();
        if (to == null) to = java.time.LocalDate.now(zone).atTime(java.time.LocalTime.MAX);
        
        System.out.println("[DIAGNOSTIC] Final timestamp range for service logic: " + from + " to " + to);
        DashboardStats stats = getDashboardStats(from, to);

        System.out.println("Fetching dashboard data for range: " + from + " to " + to);
        // 1. Store Overview
        List<Object[]> storeData = orderRepository.getStoreOverview(from, to);
        List<Map<String, Object>> storeOverview = new ArrayList<>();
        for (Object[] row : storeData) {
            Map<String, Object> store = new HashMap<>();
            String stallName = (row[0] != null && !row[0].toString().equals("Unknown Stall")) ? row[0].toString() : "RIT Canteen";
            BigDecimal saleVal = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            long orderCount = row[2] != null ? ((Number) row[2]).longValue() : 0;
            
            System.out.println("[REVENUE-TRACE] Store Overview Result -> Stall: " + stallName + " | Sales: " + saleVal + " | Orders: " + orderCount);
            
            store.put("name", stallName);
            store.put("sale", saleVal);
            store.put("orders", orderCount);
            store.put("taxes", 0);
            store.put("purchase", 0);
            storeOverview.add(store);
        }

        // 2. Hourly Sales
        List<Object[]> hourlyData = orderRepository.getHourlySales(from, to);
        List<Map<String, Object>> hourlySales = new ArrayList<>();
        // Initialize 24 hours
        for (int i = 0; i < 24; i += 2) {
            Map<String, Object> hourMap = new HashMap<>();
            String label = i == 0 ? "12am" : (i > 12 ? (i-12) + "pm" : i + (i == 12 ? "pm" : "am"));
            hourMap.put("time", label);
            hourMap.put("value", 0);
            
            for (Object[] row : hourlyData) {
                int h = ((Number) row[0]).intValue();
                if (h >= i && h < i + 2) {
                    BigDecimal val = (BigDecimal) row[1];
                    hourMap.put("value", ((Number) hourMap.get("value")).doubleValue() + val.doubleValue());
                }
            }
            hourlySales.add(hourMap);
        }

        // 3. Trending Items
        List<Object[]> trendingData = orderRepository.getTopSellingItems(from, to);
        List<TrendingItem> trendingItems = new ArrayList<>();
        for (int i = 0; i < Math.min(trendingData.size(), 4); i++) {
            Object[] row = trendingData.get(i);
            String name = (String) row[0];
            String category = (String) row[1];
            long qty = ((Number) row[2]).longValue();
            String imageData = (String) row[3];
            
            // Format image data for frontend
            String imageUrl = imageData != null ? (imageData.startsWith("http") ? imageData : (imageData.startsWith("data:") ? imageData : "data:image/png;base64," + imageData)) : null;
            
            trendingItems.add(new TrendingItem(name, category, qty, imageUrl));
        }

        // 4. Dynamic Insights
        List<Map<String, String>> insights = new ArrayList<>();
        if (stats.getActiveOrders() > 0) {
            Map<String, String> orderInsight = new HashMap<>();
            orderInsight.put("text", stats.getActiveOrders() + " orders at RIT Canteen! Clearly the crowd's found their happy place 💃🕺");
            orderInsight.put("color", "bg-rose-50 text-rose-600 border-rose-100");
            insights.add(orderInsight);

            BigDecimal avg = (stats.getTotalSales() > 0 && stats.getActiveOrders() > 0) 
                ? BigDecimal.valueOf(stats.getTotalSales()).divide(BigDecimal.valueOf(stats.getActiveOrders()), 2, RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;
            Map<String, String> avgInsight = new HashMap<>();
            avgInsight.put("text", "R" + avg + " average order value! Either everyone's hungry or just living large 🔥😋");
            avgInsight.put("color", "bg-emerald-50 text-emerald-600 border-emerald-100");
            insights.add(avgInsight);

            Map<String, String> customerInsight = new HashMap<>();
            customerInsight.put("text", "RIT Canteen had " + stats.getActiveOrders() + " orders but only " + stats.getDailyCustomers() + " customers — Maybe customers are shy! 🥰");
            customerInsight.put("color", "bg-orange-50 text-orange-600 border-orange-100");
            insights.add(customerInsight);

            Map<String, String> revenueInsight = new HashMap<>();
            revenueInsight.put("text", "RIT Canteen clocked R" + String.format("%,d", stats.getTotalSales()) + " — ka-ching! That's called business booming 💸📈");
            revenueInsight.put("color", "bg-blue-50 text-blue-600 border-blue-100");
            insights.add(revenueInsight);
        } else {
            Map<String, String> emptyInsight = new HashMap<>();
            emptyInsight.put("text", "Waiting for the first orders of the day to roll in... ☕");
            emptyInsight.put("color", "bg-indigo-50 text-indigo-600 border-indigo-100");
            insights.add(emptyInsight);
        }

        System.out.println("Dashboard data generated successfully with " + trendingItems.size() + " trending items.");
        return new GeneralDashboardData(stats, storeOverview, hourlySales, insights, trendingItems);
    }

    public DashboardStats getDashboardStats(LocalDateTime from, LocalDateTime to) {
        System.out.println("[REVENUE-TRACE] Dashboard Request Range: " + from + " to " + to);
        java.time.ZoneId zone = java.time.ZoneId.of("Asia/Kolkata");
        LocalDateTime startOfToday = LocalDate.now(zone).atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now(zone).atTime(LocalTime.MAX);
        
        LocalDateTime startOfYesterday = LocalDate.now(zone).minusDays(1).atStartOfDay();
        LocalDateTime endOfYesterday = LocalDate.now(zone).minusDays(1).atTime(LocalTime.MAX);

        System.out.println("[DIAGNOSTIC] Fetching Total RITZ Spent...");
        BigDecimal totalRevenueRaw = tokenTransactionRepository.sumByType(com.rit.canteen.sales.model.TokenTransaction.TransactionType.SPEND);
        System.out.println("[DIAGNOSTIC] Raw Total RITZ Spent: " + totalRevenueRaw);
        long totalSales = totalRevenueRaw != null ? totalRevenueRaw.longValue() : 0;
        
        System.out.println("[DIAGNOSTIC] Fetching Period RITZ Spent for range: " + from + " to " + to);
        BigDecimal periodRevenueRaw = tokenTransactionRepository.sumByTypeInRange(com.rit.canteen.sales.model.TokenTransaction.TransactionType.SPEND, from, to);
        System.out.println("[DIAGNOSTIC] Raw Period RITZ Spent: " + periodRevenueRaw);
        long periodRevenue = periodRevenueRaw != null ? periodRevenueRaw.longValue() : 0;
        
        int activeOrders = (int) orderRepository.countByCreatedAtBetween(from, to);
        int dailyCustomers = (int) orderRepository.countUniqueUsersInRange(from, to);
        
        System.out.println("[REVENUE-TRACE] Active Orders in Range: " + activeOrders + " | Unique Customers: " + dailyCustomers);

        BigDecimal todayRevenue = tokenTransactionRepository.sumByTypeInRange(com.rit.canteen.sales.model.TokenTransaction.TransactionType.SPEND, startOfToday, endOfToday);
        BigDecimal yesterdayRevenue = tokenTransactionRepository.sumByTypeInRange(com.rit.canteen.sales.model.TokenTransaction.TransactionType.SPEND, startOfYesterday, endOfYesterday);
        System.out.println("[DIAGNOSTIC] Today vs Yesterday SPEND: " + todayRevenue + " / " + yesterdayRevenue);
        
        BigDecimal totalExpensesRaw = purchaseOrderRepository.getTotalPurchaseAmount();
        long totalExpenses = totalExpensesRaw != null ? totalExpensesRaw.longValue() : 0;

        BigDecimal periodExpensesRaw = purchaseOrderRepository.getTotalPurchaseAmountInRange(from, to);
        long periodExpenses = periodExpensesRaw != null ? periodExpensesRaw.longValue() : 0;

        BigDecimal periodPOSOrdersRaw = orderRepository.getCompletedStoreRevenuePerPeriod(from, to);
        long periodPOSOrders = periodPOSOrdersRaw != null ? periodPOSOrdersRaw.longValue() : 0;
        BigDecimal periodTopupsRaw = tokenTransactionRepository.sumByTypeInRange(com.rit.canteen.sales.model.TokenTransaction.TransactionType.TOPUP, from, to);
        long periodTopups = periodTopupsRaw != null ? periodTopupsRaw.longValue() : 0;
        long periodStoreRevenue = periodPOSOrders + periodTopups;

        BigDecimal totalPOSOrdersRaw = orderRepository.getCompletedStoreRevenue();
        long totalPOSOrders = totalPOSOrdersRaw != null ? totalPOSOrdersRaw.longValue() : 0;
        BigDecimal totalTopupsRaw = tokenTransactionRepository.sumByType(com.rit.canteen.sales.model.TokenTransaction.TransactionType.TOPUP);
        long totalTopups = totalTopupsRaw != null ? totalTopupsRaw.longValue() : 0;
        long totalStoreRevenue = totalPOSOrders + totalTopups;

        long suspendedUserCount = userRepository.countByIsSuspended(true);

        double growth = 0;
        if (yesterdayRevenue != null && yesterdayRevenue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal today = todayRevenue != null ? todayRevenue : BigDecimal.ZERO;
            growth = today.subtract(yesterdayRevenue)
                    .divide(yesterdayRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100))
                    .doubleValue();
        } else if (todayRevenue != null && todayRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growth = 100.0;
        }

        return new DashboardStats(totalSales, periodRevenue, activeOrders, dailyCustomers, growth, totalExpenses, periodExpenses, suspendedUserCount, periodStoreRevenue, totalStoreRevenue);
    }

    public ProcurementDashboardData getProcurementDashboardData() {
        // 1. Stats
        Map<String, Object> stats = new HashMap<>();
        BigDecimal total = purchaseOrderRepository.getTotalPurchaseAmount();
        stats.put("totalProcurement", total != null ? total : BigDecimal.ZERO);
        stats.put("activeVendors", vendorRepository.count());
        stats.put("pendingPOs", purchaseOrderRepository.countByStatus("OPEN"));
        stats.put("fillRate", 94.2); // Derived or static for now

        // 2. Trends (Last 6 entries)
        List<Object[]> trendRaw = purchaseOrderRepository.getPurchaseTrend();
        List<Map<String, Object>> trends = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        
        for (int i = Math.max(0, trendRaw.size() - 6); i < trendRaw.size(); i++) {
            Object[] row = trendRaw.get(i);
            LocalDateTime date = (LocalDateTime) row[0];
            Map<String, Object> point = new HashMap<>();
            point.put("month", months[date.getMonthValue() - 1]);
            point.put("purchases", row[1]);
            point.put("orders", 1); // Sample for volume
            trends.add(point);
        }

        // 3. Top Vendors
        List<Object[]> vendorRaw = purchaseOrderRepository.getVendorSummary(
                LocalDate.now().minusMonths(1).atStartOfDay(),
                LocalDateTime.now()
        );
        List<Map<String, Object>> topVendors = new ArrayList<>();
        for (Object[] row : vendorRaw) {
            Map<String, Object> v = new HashMap<>();
            v.put("name", row[0]);
            v.put("volume", row[1]);
            v.put("orders", row[2]);
            v.put("color", "bg-indigo-100 text-indigo-600");
            topVendors.add(v);
        }

        return new ProcurementDashboardData(stats, trends, topVendors);
    }

    public List<Order> getRecentOrders() {
        return orderRepository.findTop5ByOrderByCreatedAtDesc();
    }
}
