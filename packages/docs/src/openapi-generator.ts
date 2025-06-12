import { OpenAPIV3 } from 'openapi-types';

export function generateOpenAPISpec(): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Ganger Platform API',
      version: '1.6.0',
      description: `
# Ganger Platform Medical Management API

A comprehensive API for medical practice management, including patient care, medication authorization, inventory management, and staff coordination.

## Features
- **Patient Management**: Complete patient records and care coordination
- **Medication Authorization**: AI-powered medication approval workflows
- **Inventory Management**: Medical supply tracking with barcode scanning
- **Staff Management**: Employee scheduling and task coordination
- **Communication Hub**: HIPAA-compliant patient communication
- **Payment Processing**: Medical billing and payment handling

## Authentication
All API endpoints require authentication using Bearer tokens. Include your token in the Authorization header:

\`\`\`
Authorization: Bearer your-jwt-token-here
\`\`\`

## Rate Limiting
API endpoints are rate limited based on endpoint type:
- Standard endpoints: 100 requests per 15 minutes
- AI Processing: 20 requests per 5 minutes
- Authentication: 10 requests per 15 minutes

## HIPAA Compliance
This API is designed to be HIPAA compliant. All PHI access is logged and audited.
      `,
      contact: {
        name: 'Ganger Platform Support',
        email: 'support@gangerdermatology.com',
        url: 'https://gangerdermatology.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://gangerdermatology.com/terms'
      }
    },
    servers: [
      {
        url: 'https://medication-auth.gangerdermatology.com',
        description: 'Production API - Medication Authorization'
      },
      {
        url: 'https://inventory.gangerdermatology.com',
        description: 'Production API - Inventory Management'
      },
      {
        url: 'https://handouts.gangerdermatology.com',
        description: 'Production API - Patient Handouts'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development API'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      // Health and Monitoring
      '/api/health': {
        get: {
          tags: ['System'],
          summary: 'System health check',
          description: 'Check the health status of the system and all integrations',
          operationId: 'getHealthStatus',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'System health status',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthStatusResponse'
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/monitoring/health-dashboard': {
        get: {
          tags: ['Monitoring'],
          summary: 'Comprehensive health dashboard',
          description: 'Get detailed system health information including integrations, performance metrics, and alerts',
          operationId: 'getHealthDashboard',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'action',
              in: 'query',
              description: 'Dashboard section to retrieve',
              schema: {
                type: 'string',
                enum: ['overview', 'integrations', 'alerts'],
                default: 'overview'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Health dashboard data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthDashboardResponse'
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      // Patient Management
      '/api/patients': {
        get: {
          tags: ['Patients'],
          summary: 'List patients',
          description: 'Retrieve a paginated list of patients with optional filtering',
          operationId: 'listPatients',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number for pagination',
              schema: {
                type: 'integer',
                minimum: 1,
                default: 1
              }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Number of items per page',
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 20
              }
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search term for patient name or email',
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '200': {
              description: 'List of patients',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/StandardSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Patient' }
                          },
                          meta: {
                            $ref: '#/components/schemas/PaginationMeta'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Patients'],
          summary: 'Create new patient',
          description: 'Create a new patient record',
          operationId: 'createPatient',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreatePatientRequest'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Patient created successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/StandardSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Patient' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/patients/{patientId}': {
        get: {
          tags: ['Patients'],
          summary: 'Get patient by ID',
          description: 'Retrieve detailed information about a specific patient',
          operationId: 'getPatient',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'patientId',
              in: 'path',
              required: true,
              description: 'Patient ID',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Patient details',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/StandardSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/PatientDetail' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        },
        put: {
          tags: ['Patients'],
          summary: 'Update patient',
          description: 'Update patient information',
          operationId: 'updatePatient',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'patientId',
              in: 'path',
              required: true,
              description: 'Patient ID',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdatePatientRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Patient updated successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/StandardSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Patient' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '404': { $ref: '#/components/responses/NotFound' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      // Medication Authorization
      '/api/medications/authorize': {
        post: {
          tags: ['Medication Authorization'],
          summary: 'Request medication authorization',
          description: 'Submit a medication authorization request for AI analysis',
          operationId: 'requestMedicationAuthorization',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MedicationAuthorizationRequest'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Authorization request submitted',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/StandardSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MedicationAuthorization' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' }
          }
        }
      },
      '/api/medications/authorize/{authorizationId}': {
        get: {
          tags: ['Medication Authorization'],
          summary: 'Get authorization status',
          description: 'Retrieve the status and details of a medication authorization',
          operationId: 'getAuthorizationStatus',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'authorizationId',
              in: 'path',
              required: true,
              description: 'Authorization ID',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Authorization details',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/StandardSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MedicationAuthorizationDetail' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      // Inventory Management
      '/api/inventory/items': {
        get: {
          tags: ['Inventory'],
          summary: 'List inventory items',
          description: 'Retrieve inventory items with optional location filtering',
          operationId: 'listInventoryItems',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'locationId',
              in: 'query',
              description: 'Filter by location ID',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            },
            {
              name: 'category',
              in: 'query',
              description: 'Filter by item category',
              schema: {
                type: 'string'
              }
            },
            {
              name: 'lowStock',
              in: 'query',
              description: 'Filter items with low stock levels',
              schema: {
                type: 'boolean'
              }
            }
          ],
          responses: {
            '200': {
              description: 'List of inventory items',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/StandardSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/InventoryItem' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Inventory'],
          summary: 'Add inventory item',
          description: 'Add a new item to inventory',
          operationId: 'addInventoryItem',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateInventoryItemRequest'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Inventory item created',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/StandardSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/InventoryItem' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      // Cache Management
      '/api/cache/stats': {
        get: {
          tags: ['Cache'],
          summary: 'Get cache statistics',
          description: 'Retrieve cache performance metrics and status',
          operationId: 'getCacheStats',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Cache statistics',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/StandardSuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/CacheStats' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from authentication endpoint'
        }
      },
      schemas: {
        // Standard Response Schemas
        StandardSuccessResponse: {
          type: 'object',
          required: ['success', 'timestamp', 'requestId', 'path', 'method', 'statusCode'],
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-08T15:30:00.000Z'
            },
            requestId: {
              type: 'string',
              format: 'uuid',
              example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
            },
            path: {
              type: 'string',
              example: '/api/patients'
            },
            method: {
              type: 'string',
              example: 'GET'
            },
            statusCode: {
              type: 'integer',
              example: 200
            }
          }
        },
        StandardErrorResponse: {
          type: 'object',
          required: ['error', 'code', 'message', 'timestamp', 'requestId', 'path', 'method', 'statusCode'],
          properties: {
            error: {
              type: 'string',
              example: 'Resource not found'
            },
            code: {
              type: 'string',
              example: 'NOT_FOUND'
            },
            message: {
              type: 'string',
              example: 'The requested resource was not found'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            requestId: {
              type: 'string',
              format: 'uuid'
            },
            path: {
              type: 'string'
            },
            method: {
              type: 'string'
            },
            statusCode: {
              type: 'integer'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 150 },
                totalPages: { type: 'integer', example: 8 }
              }
            },
            performance: {
              type: 'object',
              properties: {
                duration_ms: { type: 'integer', example: 45 },
                cached: { type: 'boolean', example: false }
              }
            }
          }
        },
        // Entity Schemas
        Patient: {
          type: 'object',
          required: ['id', 'name', 'email', 'created_at'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com'
            },
            phone: {
              type: 'string',
              example: '+1-555-123-4567'
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '1990-01-15'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PatientDetail: {
          allOf: [
            { $ref: '#/components/schemas/Patient' },
            {
              type: 'object',
              properties: {
                medical_history: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      condition: { type: 'string' },
                      diagnosed_date: { type: 'string', format: 'date' },
                      status: { type: 'string', enum: ['active', 'resolved', 'chronic'] }
                    }
                  }
                },
                current_medications: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Medication' }
                },
                insurance_info: {
                  type: 'object',
                  properties: {
                    provider: { type: 'string' },
                    policy_number: { type: 'string' },
                    group_number: { type: 'string' }
                  }
                }
              }
            }
          ]
        },
        CreatePatientRequest: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phone: {
              type: 'string',
              pattern: '^\\+?[1-9]\\d{1,14}$'
            },
            date_of_birth: {
              type: 'string',
              format: 'date'
            }
          }
        },
        UpdatePatientRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phone: {
              type: 'string',
              pattern: '^\\+?[1-9]\\d{1,14}$'
            }
          }
        },
        Medication: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            dosage: { type: 'string' },
            frequency: { type: 'string' },
            prescribed_date: { type: 'string', format: 'date' }
          }
        },
        MedicationAuthorizationRequest: {
          type: 'object',
          required: ['patient_id', 'medication', 'prescribing_physician'],
          properties: {
            patient_id: {
              type: 'string',
              format: 'uuid'
            },
            medication: {
              type: 'object',
              required: ['name', 'dosage', 'frequency'],
              properties: {
                name: { type: 'string' },
                dosage: { type: 'string' },
                frequency: { type: 'string' },
                duration: { type: 'string' }
              }
            },
            prescribing_physician: {
              type: 'string'
            },
            medical_necessity: {
              type: 'string',
              description: 'Justification for the medication'
            },
            insurance_info: {
              type: 'object',
              properties: {
                provider: { type: 'string' },
                policy_number: { type: 'string' }
              }
            }
          }
        },
        MedicationAuthorization: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'denied', 'requires_review']
            },
            patient_id: { type: 'string', format: 'uuid' },
            medication: { $ref: '#/components/schemas/Medication' },
            created_at: { type: 'string', format: 'date-time' },
            decision_date: { type: 'string', format: 'date-time' },
            ai_confidence: { type: 'number', minimum: 0, maximum: 1 }
          }
        },
        MedicationAuthorizationDetail: {
          allOf: [
            { $ref: '#/components/schemas/MedicationAuthorization' },
            {
              type: 'object',
              properties: {
                analysis_details: {
                  type: 'object',
                  properties: {
                    risk_factors: { type: 'array', items: { type: 'string' } },
                    drug_interactions: { type: 'array', items: { type: 'string' } },
                    cost_analysis: {
                      type: 'object',
                      properties: {
                        estimated_cost: { type: 'number' },
                        insurance_coverage: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          ]
        },
        InventoryItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            sku: { type: 'string' },
            barcode: { type: 'string' },
            category: { type: 'string' },
            location_id: { type: 'string', format: 'uuid' },
            current_stock: { type: 'integer', minimum: 0 },
            min_stock_level: { type: 'integer', minimum: 0 },
            max_stock_level: { type: 'integer', minimum: 0 },
            unit_price: { type: 'number', minimum: 0 },
            supplier: { type: 'string' },
            last_restocked: { type: 'string', format: 'date-time' },
            is_active: { type: 'boolean' }
          }
        },
        CreateInventoryItemRequest: {
          type: 'object',
          required: ['name', 'sku', 'location_id', 'current_stock'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            sku: { type: 'string', minLength: 1, maxLength: 50 },
            barcode: { type: 'string' },
            category: { type: 'string' },
            location_id: { type: 'string', format: 'uuid' },
            current_stock: { type: 'integer', minimum: 0 },
            min_stock_level: { type: 'integer', minimum: 0 },
            max_stock_level: { type: 'integer', minimum: 0 },
            unit_price: { type: 'number', minimum: 0 },
            supplier: { type: 'string' }
          }
        },
        HealthStatusResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy']
            },
            timestamp: { type: 'string', format: 'date-time' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'boolean' },
                cache: { type: 'boolean' },
                external_apis: { type: 'boolean' }
              }
            },
            performance: {
              type: 'object',
              properties: {
                response_time_ms: { type: 'integer' },
                database_query_time_ms: { type: 'integer' }
              }
            }
          }
        },
        HealthDashboardResponse: {
          type: 'object',
          properties: {
            system_health: {
              type: 'object',
              properties: {
                overall_status: {
                  type: 'string',
                  enum: ['healthy', 'degraded', 'unhealthy']
                },
                services: {
                  type: 'object',
                  properties: {
                    healthy: { type: 'integer' },
                    total: { type: 'integer' },
                    critical_issues: { type: 'integer' },
                    warnings: { type: 'integer' }
                  }
                }
              }
            },
            integrations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: {
                    type: 'string',
                    enum: ['healthy', 'unhealthy', 'degraded', 'unknown']
                  },
                  response_time: { type: 'integer' },
                  last_checked: { type: 'string', format: 'date-time' },
                  error: { type: 'string' }
                }
              }
            }
          }
        },
        CacheStats: {
          type: 'object',
          properties: {
            cache_performance: {
              type: 'object',
              properties: {
                hit_rate: { type: 'string', example: '85.42%' },
                total_requests: { type: 'integer' },
                hits: { type: 'integer' },
                misses: { type: 'integer' }
              }
            },
            redis_status: {
              type: 'object',
              properties: {
                available: { type: 'boolean' },
                connection_info: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request - invalid input parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/StandardErrorResponse'
              },
              example: {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                message: 'One or more fields contain invalid values',
                details: [
                  {
                    field: 'email',
                    message: 'Invalid email format',
                    code: 'INVALID_FORMAT'
                  }
                ],
                timestamp: '2025-01-08T15:30:00.000Z',
                requestId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                path: '/api/patients',
                method: 'POST',
                statusCode: 400
              }
            }
          }
        },
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/StandardErrorResponse'
              },
              example: {
                error: 'Authentication token required',
                code: 'UNAUTHORIZED',
                message: 'Authentication required to access this resource',
                timestamp: '2025-01-08T15:30:00.000Z',
                requestId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                path: '/api/patients',
                method: 'GET',
                statusCode: 401
              }
            }
          }
        },
        Forbidden: {
          description: 'Access denied - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/StandardErrorResponse'
              },
              example: {
                error: 'Insufficient permissions',
                code: 'FORBIDDEN',
                message: 'You do not have permission to access this resource',
                timestamp: '2025-01-08T15:30:00.000Z',
                requestId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                path: '/api/patients',
                method: 'GET',
                statusCode: 403
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/StandardErrorResponse'
              },
              example: {
                error: 'Patient not found',
                code: 'NOT_FOUND',
                message: 'The requested resource was not found',
                timestamp: '2025-01-08T15:30:00.000Z',
                requestId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                path: '/api/patients/123e4567-e89b-12d3-a456-426614174000',
                method: 'GET',
                statusCode: 404
              }
            }
          }
        },
        RateLimited: {
          description: 'Rate limit exceeded',
          headers: {
            'Retry-After': {
              description: 'Number of seconds to wait before making another request',
              schema: {
                type: 'integer'
              }
            }
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/StandardErrorResponse'
              },
              example: {
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later',
                details: {
                  retryAfter: 60
                },
                timestamp: '2025-01-08T15:30:00.000Z',
                requestId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                path: '/api/medications/authorize',
                method: 'POST',
                statusCode: 429
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'System',
        description: 'System health and status endpoints'
      },
      {
        name: 'Monitoring',
        description: 'Comprehensive monitoring and alerting'
      },
      {
        name: 'Patients',
        description: 'Patient management and records'
      },
      {
        name: 'Medication Authorization',
        description: 'AI-powered medication authorization workflows'
      },
      {
        name: 'Inventory',
        description: 'Medical supply inventory management'
      },
      {
        name: 'Cache',
        description: 'Cache management and performance'
      }
    ]
  };
}