# CSMR Admin Panel API Documentation

## Overview
The CSMR Admin Panel provides comprehensive management capabilities for the journal publication system, inspired by Taylor & Francis publishing workflows.

## Base URL
```
http://localhost:5000/api/admin
```

## Authentication
All admin endpoints require authentication using JWT tokens with admin privileges.

- Include the token in the request header: `Authorization: Bearer YOUR_TOKEN`
- User must have `isAdmin: true` or `role: 'admin'`

---

## Dashboard & Analytics

### Get Dashboard Statistics
**GET** `/dashboard`
- Get comprehensive dashboard statistics and metrics
- Access: Admin only

**Response**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalArticles": 45,
      "totalJournals": 3,
      "recentSubmissions": 12,
      "publishedThisYear": 8
    },
    "articlesByStatus": [
      { "_id": "submitted", "count": 5 },
      { "_id": "under-review", "count": 8 },
      { "_id": "published", "count": 12 }
    ],
    "userRegistrations": [
      { "_id": { "year": 2024, "month": 1 }, "count": 15 }
    ],
    "topJournals": [
      {
        "journalTitle": "CSMR Journal of Technology",
        "articleCount": 25
      }
    ]
  }
}
```

### Get System Analytics
**GET** `/analytics?period=30`
- Get detailed system analytics
- Access: Admin only
- Query Parameters:
  - `period`: Number of days (default: 30)

**Response**
```json
{
  "success": true,
  "data": {
    "submissionTrends": [
      { "_id": { "year": 2024, "month": 1, "day": 15 }, "count": 3 }
    ],
    "publicationTrends": [
      { "_id": { "year": 2024, "month": 1 }, "count": 2 }
    ],
    "avgReviewTime": 45.5
  }
}
```

---

## User Management

### Get All Users
**GET** `/users?page=1&limit=10&role=author&search=john`
- Get paginated list of users with filtering
- Access: Admin only
- Query Parameters:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `role`: Filter by user role
  - `search`: Search in name, email, institution
  - `sortBy`: Sort field (default: 'createdAt')
  - `sortOrder`: 'asc' or 'desc' (default: 'desc')

**Response**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "author",
        "isAdmin": false,
        "institution": "University of Example",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50
    }
  }
}
```

### Update User Role
**PUT** `/users/:id`
- Update user role and admin status
- Access: Admin only

**Request Body**
```json
{
  "role": "editor",
  "isAdmin": false
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "editor",
    "isAdmin": false,
    "institution": "University of Example"
  }
}
```

### Delete User
**DELETE** `/users/:id`
- Delete user account
- Access: Admin only
- Note: Cannot delete users with existing articles

**Response**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Article Management

### Get All Articles
**GET** `/articles?page=1&limit=10&status=submitted&journal=journal_id`
- Get paginated list of articles with advanced filtering
- Access: Admin only
- Query Parameters:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by article status
  - `journal`: Filter by journal ID
  - `search`: Search in title, abstract, authors
  - `sortBy`: Sort field (default: 'submissionDate')
  - `sortOrder`: 'asc' or 'desc' (default: 'desc')

**Response**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "_id": "article_id",
        "title": "Research Article Title",
        "abstract": "Article abstract...",
        "status": "submitted",
        "manuscriptId": "CSMR-2024-001",
        "submissionDate": "2024-01-15T10:30:00.000Z",
        "journal": {
          "_id": "journal_id",
          "title": "CSMR Journal of Technology",
          "issn": "1234-5678"
        },
        "authors": [
          {
            "name": "John Doe",
            "email": "john@example.com",
            "affiliation": "University of Example",
            "isCorresponding": true
          }
        ]
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 25
    }
  }
}
```

### Update Article Status
**PUT** `/articles/:id/status`
- Update article status and assign editors
- Access: Admin only

**Request Body**
```json
{
  "status": "under-review",
  "editorAssigned": "editor_user_id",
  "associateEditor": "associate_editor_id",
  "comments": "Status change comments"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "_id": "article_id",
    "title": "Research Article Title",
    "status": "under-review",
    "editorAssigned": "editor_user_id",
    "statusHistory": [
      {
        "status": "under-review",
        "changedBy": "admin_user_id",
        "changedAt": "2024-01-15T10:30:00.000Z",
        "comments": "Status change comments"
      }
    ]
  }
}
```

### Assign Reviewers
**PUT** `/articles/:id/assign-reviewers`
- Assign reviewers to an article
- Access: Admin only

**Request Body**
```json
{
  "reviewerIds": ["reviewer1_id", "reviewer2_id"],
  "dueDate": "2024-02-15T23:59:59.000Z"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "_id": "article_id",
    "reviewers": ["reviewer1_id", "reviewer2_id"],
    "reviewDueDate": "2024-02-15T23:59:59.000Z"
  }
}
```

---

## Publication Management

### Get Publication Workflow
**GET** `/publications/workflow`
- Get articles count by publication status
- Access: Admin only

**Response**
```json
{
  "success": true,
  "data": {
    "submitted": 5,
    "initialReview": 3,
    "underReview": 8,
    "revisionRequired": 2,
    "revised": 1,
    "accepted": 4,
    "rejected": 3,
    "published": 12,
    "withdrawn": 1
  }
}
```

### Get Articles Ready for Publication
**GET** `/publications/ready?page=1&limit=10`
- Get articles that are accepted and ready to be published
- Access: Admin only

**Response**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "_id": "article_id",
        "title": "Research Article Title",
        "status": "accepted",
        "acceptedDate": "2024-01-15T10:30:00.000Z",
        "journal": {
          "_id": "journal_id",
          "title": "CSMR Journal of Technology",
          "issn": "1234-5678"
        }
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 2,
      "total": 15
    }
  }
}
```

### Publish Article
**PUT** `/publications/:id/publish`
- Publish an accepted article
- Access: Admin only

**Request Body**
```json
{
  "volume": 1,
  "issue": 1,
  "pageRange": {
    "start": 1,
    "end": 15
  },
  "doi": "10.1234/csmr.2024.001"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "_id": "article_id",
    "title": "Research Article Title",
    "status": "published",
    "publicationDate": "2024-01-15T10:30:00.000Z",
    "volume": 1,
    "issue": 1,
    "pageRange": {
      "start": 1,
      "end": 15
    },
    "doi": "10.1234/csmr.2024.001"
  }
}
```

### Generate DOI
**POST** `/publications/:id/generate-doi`
- Generate DOI for an article
- Access: Admin only

**Request Body**
```json
{
  "prefix": "10.1234"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "doi": "10.1234/csmr.1642234567.abc12345",
    "articleId": "article_id"
  }
}
```

---

## Review Management

### Get All Reviews
**GET** `/reviews?page=1&limit=10&status=completed&reviewerId=reviewer_id`
- Get paginated list of reviews with filtering
- Access: Admin only
- Query Parameters:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by review status
  - `reviewerId`: Filter by reviewer ID
  - `articleId`: Filter by article ID

**Response**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "article": {
          "_id": "article_id",
          "title": "Research Article Title",
          "manuscriptId": "CSMR-2024-001",
          "status": "under-review"
        },
        "reviewer": {
          "_id": "reviewer_id",
          "name": "Dr. Jane Smith",
          "email": "jane@example.com"
        },
        "status": "completed",
        "submittedAt": "2024-01-15T10:30:00.000Z",
        "rating": 4,
        "recommendation": "accept"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 25
    }
  }
}
```

### Get Review Statistics
**GET** `/reviews/statistics?period=30`
- Get comprehensive review statistics
- Access: Admin only
- Query Parameters:
  - `period`: Number of days (default: 30)

**Response**
```json
{
  "success": true,
  "data": {
    "totalReviews": 45,
    "reviewsByStatus": [
      { "_id": "completed", "count": 35 },
      { "_id": "in-progress", "count": 8 },
      { "_id": "assigned", "count": 2 }
    ],
    "avgReviewTime": 12.5,
    "overdueReviews": 3,
    "topReviewers": [
      {
        "reviewer": {
          "_id": "reviewer_id",
          "name": "Dr. Jane Smith",
          "email": "jane@example.com"
        },
        "reviewCount": 15,
        "avgRating": 4.2
      }
    ]
  }
}
```

### Bulk Assign Reviewers
**POST** `/reviews/bulk-assign`
- Assign reviewers to multiple articles
- Access: Admin only

**Request Body**
```json
{
  "assignments": [
    {
      "articleId": "article1_id",
      "reviewerIds": ["reviewer1_id", "reviewer2_id"],
      "dueDate": "2024-02-15T23:59:59.000Z"
    },
    {
      "articleId": "article2_id",
      "reviewerIds": ["reviewer3_id"],
      "dueDate": "2024-02-20T23:59:59.000Z"
    }
  ]
}
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "articleId": "article1_id",
      "success": true,
      "assignedReviewers": 2
    },
    {
      "articleId": "article2_id",
      "success": true,
      "assignedReviewers": 1
    }
  ]
}
```

---

## Notifications & Monitoring

### Get Admin Notifications
**GET** `/notifications`
- Get system notifications and alerts
- Access: Admin only

**Response**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "type": "pending_submissions",
        "title": "Pending Submissions",
        "message": "5 articles awaiting initial review",
        "count": 5,
        "priority": "high",
        "action": "/admin/articles?status=submitted"
      },
      {
        "type": "overdue_reviews",
        "title": "Overdue Reviews",
        "message": "3 reviews are overdue",
        "count": 3,
        "priority": "high",
        "action": "/admin/reviews?status=overdue"
      }
    ],
    "totalCount": 8
  }
}
```

### Get System Health
**GET** `/notifications/health`
- Get system health status and metrics
- Access: Admin only

**Response**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "checks": {
      "database": {
        "status": "healthy",
        "responseTime": "45ms",
        "threshold": "1000ms"
      },
      "memory": {
        "status": "healthy",
        "usage": "256MB",
        "threshold": "500MB"
      },
      "errors": {
        "status": "healthy",
        "recentErrors": 0,
        "threshold": 10
      }
    }
  }
}
```

### Get Activity Feed
**GET** `/notifications/activity?page=1&limit=20&type=articles`
- Get system activity feed
- Access: Admin only
- Query Parameters:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `type`: Filter by activity type ('articles', 'users', 'reviews')

**Response**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "type": "article_submission",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "user": "John Doe",
        "action": "submitted article",
        "target": "Research Article Title",
        "details": {
          "journal": "CSMR Journal of Technology",
          "status": "submitted",
          "manuscriptId": "CSMR-2024-001"
        }
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 100
    }
  }
}
```

### Send Notification
**POST** `/notifications/send`
- Send notification to users
- Access: Admin only

**Request Body**
```json
{
  "userIds": ["user1_id", "user2_id"],
  "type": "system_announcement",
  "title": "System Maintenance",
  "message": "The system will be under maintenance from 2-4 AM UTC",
  "priority": "high"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "type": "system_announcement",
    "title": "System Maintenance",
    "message": "The system will be under maintenance from 2-4 AM UTC",
    "priority": "high",
    "sentAt": "2024-01-15T10:30:00.000Z",
    "recipients": 2
  },
  "message": "Notification sent to 2 users"
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error message details"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

---

## Rate Limiting

Admin endpoints have rate limiting applied:
- 100 requests per 15 minutes per user
- Rate limit headers included in responses
- Exceeded limit returns 429 status code

---

## Frontend Integration

The admin panel is designed to integrate seamlessly with the CSMR frontend:

1. **Authentication**: Uses the same JWT token system as the main application
2. **CORS**: Configured to work with frontend domains
3. **Error Handling**: Consistent error response format
4. **Pagination**: Standardized pagination for all list endpoints
5. **Filtering**: Comprehensive filtering and search capabilities

### Frontend Routes Mapping

- Dashboard: `/admin/dashboard`
- Users: `/admin/users`
- Articles: `/admin/articles`
- Publications: `/admin/publications`
- Reviews: `/admin/reviews`
- Notifications: `/admin/notifications`
