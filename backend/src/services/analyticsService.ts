import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsTimeRange {
  startDate: Date;
  endDate: Date;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  revenueByPaymentMethod: Array<{ method: string; amount: number; percentage: number }>;
}

export interface DeliveryAnalytics {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  cancelledDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  deliverySuccessRate: number;
  deliveriesByStatus: Array<{ status: string; count: number; percentage: number }>;
}

export interface DriverAnalytics {
  totalDrivers: number;
  activeDrivers: number;
  averageDeliveriesPerDriver: number;
  topPerformers: Array<{
    driverId: string;
    driverName: string;
    deliveriesCompleted: number;
    averageRating: number;
    totalEarnings: number;
  }>;
  driverEfficiency: Array<{
    driverId: string;
    driverName: string;
    efficiencyScore: number;
    onTimeRate: number;
    customerRating: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  customerRetentionRate: number;
  averageOrdersPerCustomer: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: Date;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageOrderValue: number;
  }>;
}

export interface GeographicAnalytics {
  deliveriesByCity: Array<{ city: string; count: number; percentage: number }>;
  averageDeliveryDistance: number;
  mostPopularRoutes: Array<{
    from: string;
    to: string;
    count: number;
    averageTime: number;
  }>;
  deliveryZones: Array<{
    zone: string;
    deliveries: number;
    averageTime: number;
    successRate: number;
  }>;
}

export interface BusinessMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  orderGrowthRate: number;
  customerSatisfactionScore: number;
  systemUptime: number;
  peakHours: Array<{ hour: number; orders: number }>;
  seasonalTrends: Array<{ month: string; orders: number; revenue: number }>;
}

class AnalyticsService {
  // Revenue Analytics
  async getRevenueAnalytics(timeRange: AnalyticsTimeRange): Promise<RevenueAnalytics> {
    const { startDate, endDate } = timeRange;

    // Get total revenue for the period
    const totalRevenueResult = await prisma.order.aggregate({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        total: true
      }
    });

    const totalRevenue = totalRevenueResult._sum.total || 0;

    // Get average order value
    const avgOrderValueResult = await prisma.order.aggregate({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _avg: {
        total: true
      }
    });

    const averageOrderValue = avgOrderValueResult._avg.total || 0;

    // Get previous period for growth calculation
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime());

    const previousRevenueResult = await prisma.order.aggregate({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate
        }
      },
      _sum: {
        total: true
      }
    });

    const previousRevenue = previousRevenueResult._sum.total || 0;
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Monthly revenue breakdown
    const monthlyRevenue = await this.getMonthlyRevenue(startDate, endDate);

    // Revenue by payment method
    const revenueByPaymentMethod = await this.getRevenueByPaymentMethod(startDate, endDate);

    return {
      totalRevenue,
      averageOrderValue,
      revenueGrowth,
      monthlyRevenue,
      revenueByPaymentMethod
    };
  }

  // Delivery Analytics
  async getDeliveryAnalytics(timeRange: AnalyticsTimeRange): Promise<DeliveryAnalytics> {
    const { startDate, endDate } = timeRange;

    const deliveries = await prisma.delivery.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED').length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'IN_TRANSIT' || d.status === 'PENDING').length;
    const cancelledDeliveries = deliveries.filter(d => d.status === 'CANCELLED').length;

    // Calculate average delivery time
    const completedDeliveriesWithTimes = deliveries.filter(d => 
      d.status === 'DELIVERED' && d.startTime && d.endTime
    );

    const averageDeliveryTime = completedDeliveriesWithTimes.length > 0
      ? completedDeliveriesWithTimes.reduce((sum, d) => {
          const deliveryTime = d.endTime!.getTime() - d.startTime!.getTime();
          return sum + deliveryTime;
        }, 0) / completedDeliveriesWithTimes.length / (1000 * 60) // Convert to minutes
      : 0;

    // Calculate on-time delivery rate (assuming 30 minutes is on-time)
    const onTimeDeliveries = completedDeliveriesWithTimes.filter(d => {
      const deliveryTime = d.endTime!.getTime() - d.startTime!.getTime();
      return deliveryTime <= 30 * 60 * 1000; // 30 minutes in milliseconds
    }).length;

    const onTimeDeliveryRate = completedDeliveriesWithTimes.length > 0
      ? (onTimeDeliveries / completedDeliveriesWithTimes.length) * 100
      : 0;

    const deliverySuccessRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;

    // Deliveries by status
    const statusCounts = deliveries.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const deliveriesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalDeliveries > 0 ? (count / totalDeliveries) * 100 : 0
    }));

    return {
      totalDeliveries,
      completedDeliveries,
      pendingDeliveries,
      cancelledDeliveries,
      averageDeliveryTime,
      onTimeDeliveryRate,
      deliverySuccessRate,
      deliveriesByStatus
    };
  }

  // Driver Analytics
  async getDriverAnalytics(timeRange: AnalyticsTimeRange): Promise<DriverAnalytics> {
    const { startDate, endDate } = timeRange;

    const drivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        isActive: true
      },
      include: {
        driverProfile: true,
        deliveries: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.deliveries.length > 0).length;

    const totalDeliveries = drivers.reduce((sum, d) => sum + d.deliveries.length, 0);
    const averageDeliveriesPerDriver = totalDrivers > 0 ? totalDeliveries / totalDrivers : 0;

    // Top performers
    const topPerformers = drivers
      .map(driver => {
        const completedDeliveries = driver.deliveries.filter(d => d.status === 'DELIVERED');
        // Mock driver earnings calculation (assuming $5 per delivery)
        const totalEarnings = completedDeliveries.length * 5;
        
        return {
          driverId: driver.id,
          driverName: `${driver.firstName} ${driver.lastName}`,
          deliveriesCompleted: completedDeliveries.length,
          averageRating: 4.2, // Mock average rating
          totalEarnings
        };
      })
      .sort((a, b) => b.deliveriesCompleted - a.deliveriesCompleted)
      .slice(0, 10);

    // Driver efficiency
    const driverEfficiency = drivers.map(driver => {
      const completedDeliveries = driver.deliveries.filter(d => d.status === 'DELIVERED');
      const onTimeDeliveries = completedDeliveries.filter(d => {
        if (!d.startTime || !d.endTime) return false;
        const deliveryTime = d.endTime.getTime() - d.startTime.getTime();
        return deliveryTime <= 30 * 60 * 1000; // 30 minutes
      });

      const onTimeRate = completedDeliveries.length > 0
        ? (onTimeDeliveries.length / completedDeliveries.length) * 100
        : 0;

      const efficiencyScore = (onTimeRate + 4.2 * 20) / 2; // Mock rating

      return {
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        efficiencyScore,
        onTimeRate,
        customerRating: 4.2 // Mock rating
      };
    });

    return {
      totalDrivers,
      activeDrivers,
      averageDeliveriesPerDriver,
      topPerformers,
      driverEfficiency
    };
  }

  // Customer Analytics
  async getCustomerAnalytics(timeRange: AnalyticsTimeRange): Promise<CustomerAnalytics> {
    const { startDate, endDate } = timeRange;

    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        isActive: true
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.orders.length > 0).length;
    const newCustomers = customers.filter(c => c.createdAt >= startDate).length;

    // Customer retention calculation
    const previousPeriodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - previousPeriodLength);
    const previousEndDate = new Date(startDate.getTime());

    const previousActiveCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        isActive: true,
        orders: {
          some: {
            createdAt: {
              gte: previousStartDate,
              lte: previousEndDate
            }
          }
        }
      }
    });

    const customerRetentionRate = previousActiveCustomers > 0
      ? (activeCustomers / previousActiveCustomers) * 100
      : 0;

    const totalOrders = customers.reduce((sum, c) => sum + c.orders.length, 0);
    const averageOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;

    // Top customers
    const topCustomers = customers
      .map(customer => {
        const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0);
        const lastOrderDate = customer.orders.length > 0
          ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
          : customer.createdAt;

        return {
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          totalOrders: customer.orders.length,
          totalSpent,
          lastOrderDate
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Customer segments
    const customerSegments = [
      {
        segment: 'High Value',
        count: customers.filter(c => {
          const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0);
          return totalSpent > 1000;
        }).length,
        percentage: 0,
        averageOrderValue: 0
      },
      {
        segment: 'Medium Value',
        count: customers.filter(c => {
          const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0);
          return totalSpent > 100 && totalSpent <= 1000;
        }).length,
        percentage: 0,
        averageOrderValue: 0
      },
      {
        segment: 'Low Value',
        count: customers.filter(c => {
          const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0);
          return totalSpent <= 100;
        }).length,
        percentage: 0,
        averageOrderValue: 0
      }
    ];

    // Calculate percentages and average order values
    customerSegments.forEach(segment => {
      segment.percentage = totalCustomers > 0 ? (segment.count / totalCustomers) * 100 : 0;
      
      const segmentCustomers = customers.filter(c => {
        const totalSpent = c.orders.reduce((sum, o) => sum + (o.total || 0), 0);
        switch (segment.segment) {
          case 'High Value': return totalSpent > 1000;
          case 'Medium Value': return totalSpent > 100 && totalSpent <= 1000;
          case 'Low Value': return totalSpent <= 100;
          default: return false;
        }
      });

      const segmentTotalOrders = segmentCustomers.reduce((sum, c) => sum + c.orders.length, 0);
      segment.averageOrderValue = segmentTotalOrders > 0
        ? segmentCustomers.reduce((sum, c) => sum + c.orders.reduce((s, o) => s + o.total, 0), 0) / segmentTotalOrders
        : 0;
    });

    return {
      totalCustomers,
      activeCustomers,
      newCustomers,
      customerRetentionRate,
      averageOrdersPerCustomer,
      topCustomers,
      customerSegments
    };
  }

  // Geographic Analytics
  async getGeographicAnalytics(timeRange: AnalyticsTimeRange): Promise<GeographicAnalytics> {
    const { startDate, endDate } = timeRange;

    const deliveries = await prisma.delivery.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    });

    // Deliveries by city
    const cityCounts = deliveries.reduce((acc, d) => {
      const city = d.order.deliveryAddress?.split(',')[1]?.trim() || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const deliveriesByCity = Object.entries(cityCounts)
      .map(([city, count]) => ({
        city,
        count,
        percentage: deliveries.length > 0 ? (count / deliveries.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Average delivery distance (mock calculation)
    const averageDeliveryDistance = 5.2; // Mock value in km

    // Most popular routes
    const routeCounts = deliveries.reduce((acc, d) => {
      const from = d.order.pickupAddress?.split(',')[1]?.trim() || 'Unknown';
      const to = d.order.deliveryAddress?.split(',')[1]?.trim() || 'Unknown';
      const route = `${from} → ${to}`;
      
      if (!acc[route]) {
        acc[route] = { count: 0, totalTime: 0 };
      }
      acc[route].count++;
      
      if (d.startTime && d.endTime) {
        const deliveryTime = d.endTime.getTime() - d.startTime.getTime();
        acc[route].totalTime += deliveryTime;
      }
      
      return acc;
    }, {} as Record<string, { count: number; totalTime: number }>);

    const mostPopularRoutes = Object.entries(routeCounts)
      .map(([route, data]) => {
        const [from, to] = route.split(' → ');
        return {
          from,
          to,
          count: data.count,
          averageTime: data.count > 0 ? data.totalTime / data.count / (1000 * 60) : 0 // Convert to minutes
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Delivery zones (mock data)
    const deliveryZones = [
      { zone: 'Downtown', deliveries: 45, averageTime: 25, successRate: 95 },
      { zone: 'Suburbs', deliveries: 32, averageTime: 35, successRate: 92 },
      { zone: 'Industrial', deliveries: 18, averageTime: 40, successRate: 88 },
      { zone: 'Residential', deliveries: 28, averageTime: 30, successRate: 94 }
    ];

    return {
      deliveriesByCity,
      averageDeliveryDistance,
      mostPopularRoutes,
      deliveryZones
    };
  }

  // Business Metrics
  async getBusinessMetrics(timeRange: AnalyticsTimeRange): Promise<BusinessMetrics> {
    const { startDate, endDate } = timeRange;

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Order growth rate
    const previousPeriodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - previousPeriodLength);
    const previousEndDate = new Date(startDate.getTime());

    const previousOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate
        }
      }
    });

    const orderGrowthRate = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;

    // Customer satisfaction score (mock calculation)
    const customerSatisfactionScore = 4.2;

    // System uptime (mock value)
    const systemUptime = 99.8;

    // Peak hours
    const hourCounts = orders.reduce((acc, o) => {
      const hour = o.createdAt.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: hourCounts[hour] || 0
    }));

    // Seasonal trends
    const seasonalTrends = await this.getSeasonalTrends(startDate, endDate);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      orderGrowthRate,
      customerSatisfactionScore,
      systemUptime,
      peakHours,
      seasonalTrends
    };
  }

  // Helper methods
  private async getMonthlyRevenue(startDate: Date, endDate: Date): Promise<Array<{ month: string; revenue: number }>> {
    const months: Array<{ month: string; revenue: number }> = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      
      const revenue = await prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          total: true
        }
      });

      months.push({
        month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: revenue._sum.total || 0
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  private async getRevenueByPaymentMethod(startDate: Date, endDate: Date) {
    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        total: true,
        paymentMethod: true
      }
    });

    const methodTotals = orders.reduce((acc, o) => {
      const method = o.paymentMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + o.total;
      return acc;
    }, {} as Record<string, number>);

    const totalRevenue = Object.values(methodTotals).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(methodTotals).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
    }));
  }

  private async getSeasonalTrends(startDate: Date, endDate: Date): Promise<Array<{ month: string; orders: number; revenue: number }>> {
    const months: Array<{ month: string; orders: number; revenue: number }> = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      
      const [orders, revenue] = await Promise.all([
        prisma.order.count({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        }),
        prisma.order.aggregate({
          where: {
            status: 'DELIVERED',
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          _sum: {
            total: true
          }
        })
      ]);

      months.push({
        month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        orders,
        revenue: revenue._sum.total || 0
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }
}

export const analyticsService = new AnalyticsService();
