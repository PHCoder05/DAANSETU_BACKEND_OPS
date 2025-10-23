const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DAANSETU API Documentation',
      version: '1.0.0',
      description: 'A comprehensive REST API for connecting donors with NGOs, enabling transparent donation tracking and management.',
      contact: {
        name: 'DAANSETU Support',
        email: 'info@daansetu.org'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.daansetu.org',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['donor', 'ngo', 'admin'],
              example: 'donor'
            },
            phone: {
              type: 'string',
              example: '+1234567890'
            },
            verified: {
              type: 'boolean',
              example: true
            },
            active: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Donation: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            title: {
              type: 'string',
              example: 'Fresh Vegetables'
            },
            description: {
              type: 'string',
              example: 'Organic vegetables from local farm'
            },
            category: {
              type: 'string',
              enum: ['food', 'clothes', 'books', 'medical', 'electronics', 'furniture', 'other'],
              example: 'food'
            },
            quantity: {
              type: 'number',
              example: 50
            },
            unit: {
              type: 'string',
              example: 'kg'
            },
            status: {
              type: 'string',
              enum: ['available', 'claimed', 'in-transit', 'delivered', 'cancelled'],
              example: 'available'
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
              example: 'normal'
            },
            pickupLocation: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  example: 40.7128
                },
                lng: {
                  type: 'number',
                  example: -74.0060
                },
                address: {
                  type: 'string',
                  example: 'New York, NY'
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Setup',
        description: 'First-time setup and admin creation'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Password Reset',
        description: 'Password reset and recovery flow'
      },
      {
        name: 'Donations',
        description: 'Donation management endpoints'
      },
      {
        name: 'NGOs',
        description: 'NGO and request management'
      },
      {
        name: 'Notifications',
        description: 'User notifications'
      },
      {
        name: 'Reviews',
        description: 'NGO reviews and ratings'
      },
      {
        name: 'Admin',
        description: 'Admin operations (requires admin role)'
      },
      {
        name: 'Search',
        description: 'Advanced search for donations and NGOs'
      },
      {
        name: 'Dashboard',
        description: 'User dashboards and analytics'
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

