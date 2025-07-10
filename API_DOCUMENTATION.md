# Journal Publication API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication using JSON Web Tokens (JWT).

- Include the token in the request header: 
  `Authorization: Bearer YOUR_TOKEN`

## Error Responses
All endpoints return standardized error responses in the following format:
```json
{
  "success": false,
  "message": "Error message details"
}
```

---

## User Endpoints

### Register User
**POST** `/users`
- Register a new user account
- Access: Public

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "institution": "University of Example",
  "academicDegree": "PhD",
  "researchInterests": ["AI", "Machine Learning"],
  "orcidId": "0000-0000-0000-0000"
}
```

**Response**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "isAdmin": false,
  "role": "user",
  "institution": "University of Example",
  "token": "your_jwt_token"
}
```

### Login User
**POST** `/users/login`
- Log in an existing user
- Access: Public

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "isAdmin": false,
  "role": "user",
  "institution": "University of Example",
  "token": "your_jwt_token"
}
```

### Get User Profile
**GET** `/users/profile`
- Get the profile of the currently logged in user
- Access: Private

**Response**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "isAdmin": false,
  "role": "user",
  "institution": "University of Example",
  "academicDegree": "PhD",
  "researchInterests": ["AI", "Machine Learning"],
  "orcidId": "0000-0000-0000-0000"
}
```

### Update User Profile
**PUT** `/users/profile`
- Update the profile of the currently logged in user
- Access: Private

**Request Body**
```json
{
  "name": "John Doe Updated",
  "email": "john@example.com",
  "institution": "New University",
  "academicDegree": "PhD",
  "researchInterests": ["AI", "Machine Learning", "Deep Learning"],
  "orcidId": "0000-0000-0000-0000",
  "password": "newpassword123" // Optional
}
```

**Response**
```json
{
  "_id": "user_id",
  "name": "John Doe Updated",
  "email": "john@example.com",
  "isAdmin": false,
  "role": "user",
  "institution": "New University",
  "token": "your_jwt_token"
}
```

---

## Journal Endpoints

### Get All Journals
**GET** `/journals`
- Get a list of all journals
- Access: Public
- Supports query parameters for filtering, sorting, and pagination:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `sort`: Field to sort by (e.g. `sort=title`)
  - `select`: Fields to return (e.g. `select=title,issn`)

**Response**
```json
{
  "success": true,
  "count": 1,
  "pagination": {
    "next": {
      "page": 2,
      "limit": 10
    }
  },
  "data": [
    {
      "_id": "journal_id",
      "title": "Journal of Science",
      "description": "A journal about science",
      "issn": "1234-5678",
      "chiefEditor": "Dr. Smith",
      "scope": ["Science", "Technology"],
      "impactFactor": 4.5,
      "publishingFrequency": "Quarterly"
    }
  ]
}
```

### Get Single Journal
**GET** `/journals/:id`
- Get details of a specific journal by ID
- Access: Public

**Response**
```json
{
  "_id": "journal_id",
  "title": "Journal of Science",
  "description": "A journal about science",
  "issn": "1234-5678",
  "chiefEditor": "Dr. Smith",
  "scope": ["Science", "Technology"],
  "impactFactor": 4.5,
  "publishingFrequency": "Quarterly",
  "openAccess": true,
  "peerReviewed": true,
  "coverImage": "image_url.jpg",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Create Journal
**POST** `/journals`
- Create a new journal
- Access: Private/Admin
- Content-Type: multipart/form-data (for file upload)

**Request Body**
```
title: "Journal of Technology"
description: "A journal about technology"
issn: "8765-4321"
chiefEditor: "Dr. Johnson"
scope: ["Technology", "Engineering"]
indexing: ["Scopus", "Web of Science"]
impactFactor: 3.2
publishingFrequency: "Monthly"
openAccess: true
peerReviewed: true
coverImage: [File Upload]
```

**Response**
```json
{
  "_id": "journal_id",
  "title": "Journal of Technology",
  "description": "A journal about technology",
  "issn": "8765-4321",
  "chiefEditor": "Dr. Johnson",
  "scope": ["Technology", "Engineering"],
  "indexing": ["Scopus", "Web of Science"],
  "impactFactor": 3.2,
  "publishingFrequency": "Monthly",
  "openAccess": true,
  "peerReviewed": true,
  "coverImage": "uploads/coverImage-timestamp.jpg",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Update Journal
**PUT** `/journals/:id`
- Update an existing journal
- Access: Private/Admin
- Content-Type: multipart/form-data (for file upload)

**Response**
```json
{
  "_id": "journal_id",
  "title": "Journal of Technology Updated",
  "description": "A journal about technology and innovation",
  "issn": "8765-4321",
  "chiefEditor": "Dr. Johnson",
  "scope": ["Technology", "Engineering", "Innovation"],
  "indexing": ["Scopus", "Web of Science"],
  "impactFactor": 3.5,
  "publishingFrequency": "Monthly",
  "openAccess": true,
  "peerReviewed": true,
  "coverImage": "uploads/coverImage-timestamp.jpg",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Delete Journal
**DELETE** `/journals/:id`
- Delete a journal
- Access: Private/Admin

**Response**
```json
{
  "message": "Journal removed"
}
```

---

## Article Endpoints

### Get All Articles
**GET** `/articles`
- Get a list of all articles
- Access: Public
- Supports query parameters for filtering, sorting, and pagination:
  - `keyword`: Search in title, abstract, keywords
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

**Response**
```json
{
  "articles": [
    {
      "_id": "article_id",
      "title": "Research on Technology",
      "abstract": "Abstract of the article...",
      "authors": [
        {
          "name": "John Doe",
          "email": "john@example.com",
          "affiliation": "University of Example",
          "isCorresponding": true
        }
      ],
      "journal": {
        "_id": "journal_id",
        "title": "Journal of Technology",
        "issn": "8765-4321"
      },
      "pdfUrl": "uploads/pdf-timestamp.pdf",
      "status": "published",
      "submissionDate": "2023-01-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pages": 5
}
```

### Get Single Article
**GET** `/articles/:id`
- Get details of a specific article by ID
- Access: Public

**Response**
```json
{
  "_id": "article_id",
  "title": "Research on Technology",
  "abstract": "Abstract of the article...",
  "authors": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "affiliation": "University of Example",
      "orcidId": "0000-0000-0000-0000",
      "isCorresponding": true
    }
  ],
  "journal": {
    "_id": "journal_id",
    "title": "Journal of Technology",
    "issn": "8765-4321"
  },
  "keywords": ["technology", "research", "innovation"],
  "pdfUrl": "uploads/pdf-timestamp.pdf",
  "status": "published",
  "submissionDate": "2023-01-01T00:00:00.000Z",
  "publicationDate": "2023-02-01T00:00:00.000Z",
  "volume": 1,
  "issue": 2,
  "pageRange": {
    "start": 100,
    "end": 110
  },
  "doi": "10.1234/article.123456",
  "citations": 5
}
```

### Create Article
**POST** `/articles`
- Submit a new article
- Access: Private
- Content-Type: multipart/form-data (for PDF upload)

**Request Body**
```
title: "New Research on Technology"
abstract: "This paper presents research on technology..."
authors: [{"name":"John Doe","email":"john@example.com","affiliation":"University of Example","isCorresponding":true}]
journal: "journal_id"
keywords: ["technology", "research"]
pdf: [File Upload]
```

**Response**
```json
{
  "_id": "article_id",
  "title": "New Research on Technology",
  "abstract": "This paper presents research on technology...",
  "authors": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "affiliation": "University of Example",
      "isCorresponding": true
    }
  ],
  "journal": "journal_id",
  "keywords": ["technology", "research"],
  "pdfUrl": "uploads/pdf-timestamp.pdf",
  "status": "submitted",
  "submissionDate": "2023-01-01T00:00:00.000Z"
}
```

### Add Review to Article
**POST** `/articles/:id/reviews`
- Add a review to an article
- Access: Private/Reviewer

**Request Body**
```json
{
  "comment": "This is a well-written paper with insightful research.",
  "decision": "accept"
}
```

**Response**
```json
{
  "message": "Review added"
}
```

---

## Other Endpoints

### Submit Contact Form
**POST** `/contact`
- Submit a contact form
- Access: Public

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry about publishing",
  "message": "I would like to know more about the publication process."
}
```

**Response**
```json
{
  "success": true,
  "message": "Contact form submitted successfully"
}
```

### Get Call for Papers
**GET** `/cfp`
- Get current call for papers
- Access: Public

**Response**
```json
{
  "cfps": [
    {
      "title": "Call for Papers - 2024",
      "description": "We are accepting papers for our upcoming issues.",
      "deadline": "2024-12-31"
    }
  ]
}
```

### Subscribe to Newsletter
**POST** `/newsletter`
- Subscribe to the newsletter
- Access: Public

**Request Body**
```json
{
  "email": "john@example.com"
}
```

**Response**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter"
}
``` 