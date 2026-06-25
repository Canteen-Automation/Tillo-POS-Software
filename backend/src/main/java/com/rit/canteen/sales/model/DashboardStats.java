package com.rit.canteen.sales.model;

public class DashboardStats {
    private long totalSales;
    private long periodRevenue;
    private int activeOrders;
    private int dailyCustomers;
    private double growth;
    private long totalExpenses;
    private long periodExpenses;
    private long suspendedUserCount;
    private long periodStoreRevenue;
    private long totalStoreRevenue;

    public DashboardStats() {}

    public DashboardStats(long totalSales, long periodRevenue, int activeOrders, int dailyCustomers, double growth, long totalExpenses, long periodExpenses, long suspendedUserCount) {
        this.totalSales = totalSales;
        this.periodRevenue = periodRevenue;
        this.activeOrders = activeOrders;
        this.dailyCustomers = dailyCustomers;
        this.growth = growth;
        this.totalExpenses = totalExpenses;
        this.periodExpenses = periodExpenses;
        this.suspendedUserCount = suspendedUserCount;
    }

    public DashboardStats(long totalSales, long periodRevenue, int activeOrders, int dailyCustomers, double growth, long totalExpenses, long periodExpenses, long suspendedUserCount, long periodStoreRevenue, long totalStoreRevenue) {
        this.totalSales = totalSales;
        this.periodRevenue = periodRevenue;
        this.activeOrders = activeOrders;
        this.dailyCustomers = dailyCustomers;
        this.growth = growth;
        this.totalExpenses = totalExpenses;
        this.periodExpenses = periodExpenses;
        this.suspendedUserCount = suspendedUserCount;
        this.periodStoreRevenue = periodStoreRevenue;
        this.totalStoreRevenue = totalStoreRevenue;
    }

    public long getTotalSales() { return totalSales; }
    public void setTotalSales(long totalSales) { this.totalSales = totalSales; }

    public long getPeriodRevenue() { return periodRevenue; }
    public void setPeriodRevenue(long periodRevenue) { this.periodRevenue = periodRevenue; }

    public int getActiveOrders() { return activeOrders; }
    public void setActiveOrders(int activeOrders) { this.activeOrders = activeOrders; }

    public int getDailyCustomers() { return dailyCustomers; }
    public void setDailyCustomers(int dailyCustomers) { this.dailyCustomers = dailyCustomers; }

    public double getGrowth() { return growth; }
    public void setGrowth(double growth) { this.growth = growth; }

    public long getTotalExpenses() { return totalExpenses; }
    public void setTotalExpenses(long totalExpenses) { this.totalExpenses = totalExpenses; }

    public long getPeriodExpenses() { return periodExpenses; }
    public void setPeriodExpenses(long periodExpenses) { this.periodExpenses = periodExpenses; }

    public long getSuspendedUserCount() { return suspendedUserCount; }
    public void setSuspendedUserCount(long suspendedUserCount) { this.suspendedUserCount = suspendedUserCount; }

    public long getPeriodStoreRevenue() { return periodStoreRevenue; }
    public void setPeriodStoreRevenue(long periodStoreRevenue) { this.periodStoreRevenue = periodStoreRevenue; }

    public long getTotalStoreRevenue() { return totalStoreRevenue; }
    public void setTotalStoreRevenue(long totalStoreRevenue) { this.totalStoreRevenue = totalStoreRevenue; }
}
