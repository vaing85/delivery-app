import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@deliveryapp.com' },
    update: {},
    create: {
      email: 'admin@deliveryapp.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      customerProfile: {
        create: {
          totalOrders: 0,
          totalSpent: 0.0,
          loyaltyPoints: 0
        }
      }
    }
  });

  // Create test customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@deliveryapp.com' },
    update: {},
    create: {
      email: 'customer@deliveryapp.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Customer',
      phone: '+1234567890',
      role: 'CUSTOMER',
      isActive: true,
      isVerified: true,
      address: {
        create: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
          latitude: 40.7128,
          longitude: -74.0060,
          isDefault: true
        }
      },
      customerProfile: {
        create: {
          totalOrders: 0,
          totalSpent: 0.0,
          loyaltyPoints: 0
        }
      }
    }
  });

  // Create test driver
  const driverPassword = await bcrypt.hash('driver123', 12);
  const driver = await prisma.user.upsert({
    where: { email: 'driver@deliveryapp.com' },
    update: {},
    create: {
      email: 'driver@deliveryapp.com',
      password: driverPassword,
      firstName: 'Mike',
      lastName: 'Driver',
      phone: '+1234567891',
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
      address: {
        create: {
          street: '456 Oak Ave',
          city: 'New York',
          state: 'NY',
          postalCode: '10002',
          country: 'USA',
          latitude: 40.7589,
          longitude: -73.9851,
          isDefault: true
        }
      },
      driverProfile: {
        create: {
          licenseNumber: 'LIC-123456789',
          vehicleType: 'VAN',
          vehicleModel: 'Ford Transit',
          vehicleColor: 'White',
          licensePlate: 'ABC123',
          insuranceInfo: 'INS-987654321',
          backgroundCheck: true,
          isAvailable: true,
          currentLocationLat: 40.7128,
          currentLocationLng: -74.0060,
          lastActive: new Date(),
          rating: 4.8,
          totalDeliveries: 0
        }
      }
    }
  });

  // Create test order
  const order = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      customerId: customer.id,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'CARD',
      pickupAddress: '123 Main St, New York, NY 10001',
      deliveryAddress: '789 Pine St, New York, NY 10003',
      pickupLat: 40.7128,
      pickupLng: -74.0060,
      deliveryLat: 40.7505,
      deliveryLng: -73.9934,
      scheduledPickup: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      scheduledDelivery: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      subtotal: 75.00,
      tax: 6.75,
      deliveryFee: 8.00,
      total: 89.75,
      tip: 5.00,
      instructions: 'Please handle with care, fragile items',
      isFragile: true,
      requiresSignature: true,
      requiresPhoto: true,
      items: {
        create: [
          {
            name: 'Electronics Package',
            description: 'Fragile electronics items',
            quantity: 1,
            unitPrice: 75.00,
            totalPrice: 75.00,
            weight: 2.5,
            dimensions: '12x8x6 inches'
          }
        ]
      }
    }
  });

  // Create test delivery
  const delivery = await prisma.delivery.create({
    data: {
      orderId: order.id,
      driverId: driver.id,
      status: 'ASSIGNED',
      startTime: new Date(),
      estimatedDuration: 120, // 2 hours
      distance: 5.2 // 5.2 km
    }
  });

  // Create test notification
  const notification = await prisma.notification.create({
    data: {
      userId: customer.id,
      title: 'Order Confirmed',
      message: `Your order ${order.orderNumber} has been confirmed and assigned to a driver.`,
      type: 'ORDER_UPDATE',
      isRead: false,
      data: JSON.stringify({
        orderId: order.id,
        orderNumber: order.orderNumber,
        driverName: `${driver.firstName} ${driver.lastName}`
      })
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user:', admin.email);
  console.log('👤 Customer user:', customer.email);
  console.log('🚚 Driver user:', driver.email);
  console.log('📦 Test order:', order.orderNumber);
  console.log('🚚 Test delivery created');
  console.log('🔔 Test notification created');

  console.log('\n🔑 Test Credentials:');
  console.log('Admin: admin@deliveryapp.com / admin123');
  console.log('Customer: customer@deliveryapp.com / customer123');
  console.log('Driver: driver@deliveryapp.com / driver123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
