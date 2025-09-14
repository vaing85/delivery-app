import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Delivery App API',
      version: '1.0.0',
      description: 'A comprehensive delivery management system API',
      contact: {
        name: 'API Support',
        email: 'support@deliveryapp.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.deliveryapp.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'firstName', 'lastName', 'role'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier',
              example: 'clx1234567890abcdef',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'BUSINESS', 'DRIVER', 'CUSTOMER'],
              description: 'User role',
              example: 'CUSTOMER',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active',
              example: true,
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether the user email is verified',
              example: true,
            },
            avatar: {
              type: 'string',
              description: 'User avatar URL',
              example: 'https://example.com/avatar.jpg',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
              example: '+1234567890',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        Order: {
          type: 'object',
          required: ['id', 'orderNumber', 'customerId', 'status', 'paymentStatus'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique order identifier',
              example: 'clx1234567890abcdef',
            },
            orderNumber: {
              type: 'string',
              description: 'Human-readable order number',
              example: 'ORD-2024-001',
            },
            customerId: {
              type: 'string',
              description: 'ID of the customer who placed the order',
              example: 'clx1234567890abcdef',
            },
            driverId: {
              type: 'string',
              description: 'ID of the assigned driver',
              example: 'clx1234567890abcdef',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
              description: 'Current order status',
              example: 'PENDING',
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
              description: 'Payment status',
              example: 'PENDING',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
              description: 'Order items',
            },
            pickupAddress: {
              type: 'string',
              description: 'Pickup address',
              example: '123 Main St, City, State 12345',
            },
            deliveryAddress: {
              type: 'string',
              description: 'Delivery address',
              example: '456 Oak Ave, City, State 12345',
            },
            subtotal: {
              type: 'number',
              format: 'float',
              description: 'Order subtotal',
              example: 25.99,
            },
            tax: {
              type: 'number',
              format: 'float',
              description: 'Tax amount',
              example: 2.60,
            },
            deliveryFee: {
              type: 'number',
              format: 'float',
              description: 'Delivery fee',
              example: 5.00,
            },
            total: {
              type: 'number',
              format: 'float',
              description: 'Total amount',
              example: 33.59,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order last update timestamp',
            },
          },
        },
        OrderItem: {
          type: 'object',
          required: ['id', 'name', 'quantity', 'unitPrice', 'totalPrice'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique item identifier',
              example: 'clx1234567890abcdef',
            },
            name: {
              type: 'string',
              description: 'Item name',
              example: 'Pizza Margherita',
            },
            description: {
              type: 'string',
              description: 'Item description',
              example: 'Fresh mozzarella, tomato sauce, basil',
            },
            quantity: {
              type: 'integer',
              description: 'Item quantity',
              example: 2,
            },
            unitPrice: {
              type: 'number',
              format: 'float',
              description: 'Price per unit',
              example: 12.99,
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              description: 'Total price for this item',
              example: 25.98,
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Operation completed successfully',
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message',
                  example: 'Validation failed',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                  description: 'Error details',
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: 'Current page number',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  description: 'Number of items per page',
                  example: 20,
                },
                total: {
                  type: 'integer',
                  description: 'Total number of items',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total number of pages',
                  example: 5,
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'An error occurred',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Delivery App API Documentation',
  }));

  // JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default specs;
