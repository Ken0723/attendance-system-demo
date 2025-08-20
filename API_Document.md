# Attendance System API Documentation

## Base URL

_All API endpoints are prefixed with `/api`._

## 1. Authentication

_Most endpoints require authentication using Auth0 JWT tokens. Include the token in the Authorization header:_

```http
Authorization: Bearer <token>
```

## 2. Allowed Method

- GET
- POST
- PATCH
- DELETE

## 3. Error Handling

_Errors are returned in JSON format with the following structure:_

```json
{
  "success": false,
  "error": 400,
  "message": "Bad request"
}
```

### 3.1 Error Type

| Status Code |                                Description                                 |
| :---------- | :------------------------------------------------------------------------: |
| 400         |   Bad Request - The request was malformed or contains invalid parameters   |
| 404         |             Not Found - The requested resource does not exist              |
| 422         | Unprocessable Entity - The request was well-formed but cannot be processed |
| 500         |     Internal Server Error - An unexpected error occurred on the server     |

## 4. Endpoints

### 4.1 Authentication & User Management

#### 4.1.1 Check Authentication

`GET /api/check-auth`

> Verifies if the current authentication token is valid.

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "message": "Authenticated"
}
```

**Errors:**  
401: Unauthorized - Invalid or missing authentication token

#### 4.1.1 Request Login

`GET /api/request-login`

> Initiates the login process. If no valid token exists, redirects to Auth0 login page.

**Authentication:** No

**Parameters:**

- nextUrl (query, optional): URL to redirect after successful login

**Response:**

```json
{
  "success": true,
  "login_url": "https://auth0-domain/authorize?..."
}
```

**Or if already logged in:**

```json
{
  "success": true,
  "message": "Already logged in",
  "user_id": 123
}
```

**Errors:**  
500: Internal Server Error - An unexpected error occurred during processing

#### 4.1.2 Login Callback

`GET /api/login-callback`

> Handles the callback from Auth0 after successful authentication.

**Authentication:** No

**Parameters:**

- state (query): Auth0 state parameter

**Response:**  
Redirects to frontend callback URL

**Errors:**  
500: Internal Server Error - An unexpected error occurred during processing

#### 4.1.3 Get User Info

`GET /api/user-info`

> Returns information about the currently authenticated user.

**Authentication:** Yes

**Response:**

```json
{
  "success": true,
  "user_info": {
    "sub": "auth0|user_id",
    "db_info": {
      "id": 1,
      "auth0_id": "auth0|user_id",
      "username": "username",
      "email": "email@example.com",
      "position": "Developer",
      "department": "IT",
      "isActive": true
    }
  }
}
```

**Errors:**  
401: Unauthorized - Invalid or missing authentication token  
500: Internal Server Error - An unexpected error occurred during processing

#### 4.1.4 Get All Users

`GET /api/users`

> Returns a list of all active users in the system.

**Authentication:** Yes (requires `get:users` permission)

**Response:**

```json
[
  {
    "id": 1,
    "auth0_id": "auth0|user_id",
    "username": "username",
    "email": "email@example.com",
    "position": "Developer",
    "department": "IT",
    "isActive": true
  }
]
```

**Errors:**  
401: Unauthorized - Invalid or missing authentication token  
403: Forbidden - Valid token but insufficient permissions  
500: Internal Server Error - An unexpected error occurred during processing

### 4.2 Attendance Management

#### 4.2.1 Get Attendance Summary

`GET /api/attendance`

> Returns a daily summary of attendance records for a specific user within a date range.

**Authentication:** Yes (requires `get:attendance` permission)

**Parameters:**

- user_id (query, required): ID of the user
- start_date (query, optional): Start date in YYYY-MM-DD format
- end_date (query, optional): End date in YYYY-MM-DD format

**Response:**

```json
[
  {
    "date": "2025-03-07",
    "checkInTime": "2025-03-07T08:31:00.000Z",
    "checkOutTime": "2025-03-07T17:31:00.000Z",
    "workDuration": 9.0
  }
]
```

#### 4.2.2 Create Attendance Record

`POST /api/attendance`

> Creates a new attendance record for a specific user.

**Authentication:** Yes (requires `post:attendance` permission)

**Request body:**

```json
[
  {
    "user_id": 1,
    "timestamp": "2025-03-14T09:00:00Z"
  }
]
```

**Response:**

```json
{
  "id": 123,
  "user_id": 1,
  "timestamp": "2025-03-14T09:00:00.000000"
}
```

#### 4.2.3 Get Attendance History

`GET /api/attendance/<user_id>/history`

> Retrieves detailed attendance records for a specific user.

**Authentication:** Yes (requires `get:attendance-history` permission)

**Request body:**

```json
[
  {
    "user_id": 1,
    "timestamp": "2025-03-14T09:00:00Z"
  }
]
```

**Response:**

```json
{
  "id": 123,
  "user_id": 1,
  "timestamp": "2025-03-14T09:00:00.000000"
}
```

### 4.3 Event Management

#### 4.3.1 Get Events

`GET /api/events`

> Retrieves events within a specified date range or month.

**Authentication:** Yes (requires `get:events` permission)

**Parameters:**

- start_date and end_date (query, optional): Date range in YYYY-MM-DD format
- year_month (query, optional): Alternative to date range, format: YYYY-MM

**Response:**

```json
{
  "events": [
    {
      "id": 1,
      "name": "Company Meeting",
      "desc": "Quarterly company meeting",
      "date": "2025-03-15T14:00:00.000000"
    }
  ]
}
```

#### 4.3.2 Create Event

`POST /api/events`

> Creates a new event.

**Authentication:** Yes (requires `post:events` permission)

**Request body:**

```json
{
  "name": "Company Meeting",
  "description": "Quarterly company meeting",
  "date": "2025-03-15T14:00:00"
}
```

**Response:**

```json
{
  "id": 1
}
```

#### 4.3.3 Update Event

`PATCH /api/events/<event_id>`

> Updates an existing event.

**Authentication:** Yes (requires `patch:events` permission)

**Parameters:**

- event_id (path): ID of the event to update

**Request body (all fields optional):**

```json
{
  "name": "Updated Meeting Name",
  "description": "Updated description",
  "date": "2025-03-16T15:00:00"
}
```

**Response:**

```json
{
  "id": 1,
  "updated": true
}
```

#### 4.3.4 Delete Event

`DELETE /api/events/<event_id>`

> Deletes an event.

**Authentication:** Yes (requires `delete:events` permission)

**Parameters:**

- event_id (path): ID of the event to delete

**Request body (all fields optional):**

**Response:**

```json
{
  "delete": 1
}
```

## 5. Permission Scopes

_The API uses the following permission scopes:_

- get:users: View all users
- get:user-info: View the profile page
- get:attendance: View attendance summaries
- get:events: View events
- get:admin-panel: View the admin panel page
- get:calendar: View the calendar page
- get:dashboard: View the dashboard page
- post:events: Create events
- post:attendance: Create attendance records
- patch:events: Update events
- delete:events: Delete events

## 6. Data Models

### User

- id: Integer (Primary Key)
- auth0_id: String (Auth0 user identifier)
- username: String
- email: String
- position: String
- department: String
- is_active: Boolean

### Attendance Record

- id: Integer (Primary Key)
- user_id: Integer (Foreign Key to Users)
- timestamp: DateTime

### Event

- id: Integer (Primary Key)
- name: String
- desc: String
- date: DateTime
