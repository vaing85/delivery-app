import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Orders Integration Tests', () => {
  let customerToken: string;
  let driverToken: string;
  let adminToken: string;
  let customerId: string;
  let driverId: string;
  let orderId: string;

  beforeAll(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    const customer = await prisma.user.create({
      data: {
        email: 'customer@example.com',
        password: hashedPassword,
        firstName: 'Customer',
        lastName: 'User',
        role: 'CUSTOMER',
        isActive: true,
        isVerified: true
      }
    });

    const driver = await prisma.user.create({
      data: {
        email: 'driver@example.com',
        password: hashedPassword,
        firstName: 'Driver',
        lastName: 'User',
        role: 'DRIVER',
        isActive: true,
        isVerified: true,
        driverProfile: {
          create: {
            licenseNumber: 'DL123456',
            vehicleType: 'CAR',
            isAvailable: true
          }
        }
      }
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        isVerified: true
      }
    });

    customerId = customer.id;
    driverId = driver.id;

    // Get tokens
    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = customerLogin.body.data.tokens.accessToken;

    const driverLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver@example.com', password: 'Password123!' });
    driverToken = driverLogin.body.data.tokens.accessToken;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.tokens.accessToken;
  });

  beforeEach(async () => {
    // Clean up orders before each test
    await prisma.order.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/orders', () => {
    it('should create an order successfully', async () => {
      const orderData = {
        items: [
          {
            name: 'Test Item',
            description: 'Test Description',
            quantity: 2,
            unitPrice: 10.00,
            totalPrice: 20.00
          }
        ],
        pickupAddress: '123 Pickup St, City, State 12345',
        deliveryAddress: '456 Delivery Ave, City, State 12345',
        instructions: 'Handle with care',
        isFragile: true,
        requiresSignature: true,
        requiresPhoto: true
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.orderNumber).toBeDefined();
      expect(response.body.data.order.customerId).toBe(customerId);
      expect(response.body.data.order.status).toBe('PENDING');
      expect(response.body.data.order.items).toHaveLength(1);
      
      orderId = response.body.data.order.id;
    });

    it('should fail without authentication', async () => {
      const orderData = {
        items: [{ name: 'Test Item', quantity: 1, unitPrice: 10, totalPrice: 10 }],
        pickupAddress: '123 Pickup St',
        deliveryAddress: '456 Delivery Ave'
      };

      await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(401);
    });

    it('should fail with invalid order data', async () => {
      const orderData = {
        items: [], // Empty items
        pickupAddress: '', // Empty address
        deliveryAddress: '' // Empty address
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      // Create test orders
      const order1 = await prisma.order.create({
        data: {
          orderNumber: 'ORD-001',
          customerId,
          pickupAddress: '123 Pickup St',
          deliveryAddress: '456 Delivery Ave',
          subtotal: 20.00,
          tax: 2.00,
          deliveryFee: 5.00,
          total: 27.00,
          items: {
            create: {
              name: 'Test Item 1',
              quantity: 1,
              unitPrice: 20.00,
              totalPrice: 20.00
            }
          }
        }
      });

      const order2 = await prisma.order.create({
        data: {
          orderNumber: 'ORD-002',
          customerId,
          pickupAddress: '789 Pickup St',
          deliveryAddress: '012 Delivery Ave',
          subtotal: 30.00,
          tax: 3.00,
          deliveryFee: 5.00,
          total: 38.00,
          items: {
            create: {
              name: 'Test Item 2',
              quantity: 1,
              unitPrice: 30.00,
              totalPrice: 30.00
            }
          }
        }
      });
    });

    it('should get orders for customer', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should get orders for admin', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=PENDING')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      response.body.data.orders.forEach((order: any) => {
        expect(order.status).toBe('PENDING');
      });
    });
  });

  describe('GET /api/orders/:id', () => {
    beforeEach(async () => {
      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-003',
          customerId,
          pickupAddress: '123 Pickup St',
          deliveryAddress: '456 Delivery Ave',
          subtotal: 20.00,
          tax: 2.00,
          deliveryFee: 5.00,
          total: 27.00,
          items: {
            create: {
              name: 'Test Item',
              quantity: 1,
              unitPrice: 20.00,
              totalPrice: 20.00
            }
          }
        }
      });
      orderId = order.id;
    });

    it('should get order details for customer', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.id).toBe(orderId);
      expect(response.body.data.order.customerId).toBe(customerId);
    });

    it('should get order details for admin', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.id).toBe(orderId);
    });

    it('should fail for unauthorized access', async () => {
      // Create another customer
      const otherCustomer = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: 'hashedpassword',
          firstName: 'Other',
          lastName: 'Customer',
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true
        }
      });

      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@example.com', password: 'Password123!' });
      const otherToken = otherLogin.body.data.tokens.accessToken;

      await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should fail with non-existent order', async () => {
      const fakeOrderId = 'fake-order-id';
      
      await request(app)
        .get(`/api/orders/${fakeOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/orders/:id', () => {
    beforeEach(async () => {
      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-004',
          customerId,
          pickupAddress: '123 Pickup St',
          deliveryAddress: '456 Delivery Ave',
          subtotal: 20.00,
          tax: 2.00,
          deliveryFee: 5.00,
          total: 27.00,
          items: {
            create: {
              name: 'Test Item',
              quantity: 1,
              unitPrice: 20.00,
              totalPrice: 20.00
            }
          }
        }
      });
      orderId = order.id;
    });

    it('should update order status as admin', async () => {
      const updateData = {
        status: 'CONFIRMED'
      };

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('CONFIRMED');
    });

    it('should assign driver to order', async () => {
      const updateData = {
        driverId: driverId,
        status: 'PICKUP_ASSIGNED'
      };

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.driverId).toBe(driverId);
      expect(response.body.data.order.status).toBe('PICKUP_ASSIGNED');
    });

    it('should fail to update order as customer', async () => {
      const updateData = {
        status: 'CONFIRMED'
      };

      await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(403);
    });
  });
});
