# API Documentation

This document describes the REST API endpoints for the Rental App backend.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The JWT token is obtained from Supabase Auth when a user signs in.

## Endpoints

### Health Check

#### `GET /api/health`

Check if the API server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend server is up and running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Properties

#### `GET /api/properties`

Get all properties for the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "address": "123 Main St",
      "city": "London",
      "postcode": "SW1A 1AA",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/properties`

Create a new property.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "address": "123 Main St",
  "city": "London",
  "postcode": "SW1A 1AA",
  "country": "UK"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "address": "123 Main St",
    ...
  }
}
```

### Timeline Events

#### `GET /api/timeline`

Get timeline events for the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `propertyId` (optional): Filter by property ID
- `startDate` (optional): Filter events after this date
- `endDate` (optional): Filter events before this date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_type": "lease_start",
      "title": "Lease Start",
      "description": "Your lease begins",
      "event_date": "2024-01-01",
      "property_id": "uuid"
    }
  ]
}
```

### Repair Requests

#### `POST /api/repair-requests`

Create a new repair request.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "property_id": "uuid",
  "title": "Broken heater",
  "description": "The heater in the living room is not working",
  "priority": "high",
  "photos": ["url1", "url2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    ...
  }
}
```

#### `GET /api/repair-requests`

Get all repair requests for the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

### Deposit Requests

#### `POST /api/deposit-requests`

Create a new deposit request.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "property_id": "uuid",
  "amount": 1000,
  "currency": "GBP",
  "requested_date": "2024-01-01"
}
```

#### `GET /api/deposit-requests`

Get all deposit requests for the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

### Contracts

#### `POST /api/contracts/scan`

Analyze a contract document using AI.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "file_url": "https://storage.supabase.co/...",
  "property_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "rent_amount": 1000,
      "lease_start": "2024-01-01",
      "lease_end": "2025-01-01",
      ...
    }
  }
}
```

### Agreements

#### `POST /api/agreements`

Create a flatmate agreement.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "property_id": "uuid",
  "title": "Flatmate Agreement",
  "terms": {
    "rent_split": "equal",
    "utilities": "shared"
  },
  "participants": ["user_id_1", "user_id_2"]
}
```

#### `GET /api/agreements`

Get all agreements for the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

### Upload

#### `POST /api/upload/image`

Upload a property image.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body:**
- `file`: Image file
- `property_id`: Property UUID
- `room_name`: Room name (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.supabase.co/...",
    "id": "uuid"
  }
}
```

#### `POST /api/upload/document`

Upload a document.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body:**
- `file`: Document file
- `property_id`: Property UUID
- `document_type`: Type of document

### Calendar

#### `GET /api/calendar/ics/:propertyId`

Export timeline events as iCal format.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
- Content-Type: `text/calendar`
- iCal file download

### Stripe

#### `GET /api/stripe/plans`

Get available subscription plans.

**Headers:**
- `Authorization: Bearer <token>`

#### `POST /api/stripe/create-checkout-session`

Create a Stripe checkout session.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "price_id": "price_xxx",
  "success_url": "https://your-app.com/success",
  "cancel_url": "https://your-app.com/cancel"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": "..."
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

Currently, there is no rate limiting implemented. Consider implementing rate limiting for production use.

## Pagination

Some endpoints support pagination (when implemented):

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

## Filtering and Sorting

Endpoints that support filtering and sorting will document available query parameters.

---

For more details, see the route files in `backend/src/routes/`.

