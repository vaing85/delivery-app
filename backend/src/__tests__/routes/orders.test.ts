import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import ordersRouter from '../../routes/orders';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    orderItem: {
      createMany: jest.fn()
    }
  }))
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', role: 'ADMIN' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/orders', ordersRouter);

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders', () => {
    it('should return orders list', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          status: 'PENDING',
          customerId: 'customer-1',
          total: 100.00,
          createdAt: new Date()
        }
      ];

      const mockPrisma = new PrismaClient() as any;
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should handle pagination parameters', async () => {
      const mockPrisma = new PrismaClient() as any;
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await request(app)
        .get('/api/orders?page=2&limit=10')
        .expect(200);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );
    });

    it('should filter by status', async () => {
      const mockPrisma = new PrismaClient() as any;
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await request(app)
        .get('/api/orders?status=PENDING')
        .expect(200);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING'
          })
        })
      );
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return a specific order', async () => {
      const mockOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        status: 'PENDING',
        customerId: 'customer-1',
        total: 100.00,
        items: [],
        customer: { firstName: 'John', lastName: 'Doe' }
      };

      const mockPrisma = new PrismaClient() as any;
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const response = await request(app)
        .get('/api/orders/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockOrder);
    });

    it('should return 404 for non-existent order', async () => {
      const mockPrisma = new PrismaClient() as any;
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await request(app)
        .get('/api/orders/non-existent')
        .expect(404);
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        pickupAddress: '123 Main St',
        deliveryAddress: '456 Oak Ave',
        items: [
          { name: 'Item 1', quantity: 2, unitPrice: 10.00 }
        ],
        subtotal: 20.00,
        tax: 2.00,
        deliveryFee: 5.00,
        total: 27.00
      };

      const mockOrder = {
        id: 'new-order-id',
        orderNumber: 'ORD-002',
        ...orderData
      };

      const mockPrisma = new PrismaClient() as any;
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.orderItem.createMany.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidOrderData = {
        pickupAddress: '',
        deliveryAddress: '456 Oak Ave',
        items: []
      };

      await request(app)
        .post('/api/orders')
        .send(invalidOrderData)
        .expect(400);
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update an existing order', async () => {
      const updateData = {
        status: 'CONFIRMED',
        driverId: 'driver-1'
      };

      const mockUpdatedOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        status: 'CONFIRMED',
        driverId: 'driver-1'
      };

      const mockPrisma = new PrismaClient() as any;
      mockPrisma.order.update.mockResolvedValue(mockUpdatedOrder);

      const response = await request(app)
        .put('/api/orders/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should delete an order', async () => {
      const mockPrisma = new PrismaClient() as any;
      mockPrisma.order.delete.mockResolvedValue({ id: '1' });

      const response = await request(app)
        .delete('/api/orders/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });
  });
});
