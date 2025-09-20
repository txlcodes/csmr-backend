# CSMR Admin Panel

A comprehensive admin panel for the CSMR Journal Publication System, inspired by Taylor & Francis publishing workflows.

## Features

### 🎯 Dashboard & Analytics
- **Real-time Statistics**: User counts, article submissions, publication metrics
- **Visual Charts**: Articles by status, user registration trends, publication rates
- **System Health**: Database performance, memory usage, error monitoring
- **Activity Feed**: Real-time system activity and user actions

### 👥 User Management
- **User Overview**: Paginated user list with advanced filtering
- **Role Management**: Assign and update user roles (user, author, reviewer, editor, admin)
- **Permission Control**: Granular access control based on user roles
- **User Analytics**: Registration trends, activity patterns, performance metrics

### 📝 Article Management
- **Submission Workflow**: Complete article lifecycle management
- **Status Tracking**: Real-time status updates and history
- **Editor Assignment**: Assign editors and associate editors
- **Bulk Operations**: Mass status updates and assignments
- **Advanced Filtering**: Search by title, author, status, journal, date range

### 📚 Publication Management
- **Publication Workflow**: Streamlined publishing process
- **Journal Issues**: Create and manage journal volumes and issues
- **DOI Generation**: Automatic DOI assignment for published articles
- **Publication Metrics**: Track publication rates and timelines
- **Ready-to-Publish**: Queue of articles ready for publication

### 🔍 Review Management
- **Reviewer Assignment**: Assign reviewers to articles with due dates
- **Review Tracking**: Monitor review progress and completion
- **Reviewer Performance**: Track reviewer statistics and performance
- **Bulk Assignment**: Assign multiple reviewers to multiple articles
- **Review Analytics**: Review completion rates, average review times

### 🔔 Notifications & Monitoring
- **System Alerts**: Pending submissions, overdue reviews, system issues
- **Health Monitoring**: Database performance, memory usage, error rates
- **Activity Logging**: Comprehensive audit trail of all actions
- **Notification System**: Send notifications to users and administrators

## API Endpoints

### Dashboard
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/analytics` - Get system analytics

### User Management
- `GET /api/admin/users` - Get all users with filtering
- `PUT /api/admin/users/:id` - Update user role and permissions
- `DELETE /api/admin/users/:id` - Delete user account

### Article Management
- `GET /api/admin/articles` - Get all articles with filtering
- `PUT /api/admin/articles/:id/status` - Update article status
- `PUT /api/admin/articles/:id/assign-reviewers` - Assign reviewers

### Publication Management
- `GET /api/admin/publications/workflow` - Get publication workflow status
- `GET /api/admin/publications/ready` - Get articles ready for publication
- `PUT /api/admin/publications/:id/publish` - Publish article
- `POST /api/admin/publications/:id/generate-doi` - Generate DOI

### Review Management
- `GET /api/admin/reviews` - Get all reviews with filtering
- `GET /api/admin/reviews/statistics` - Get review statistics
- `POST /api/admin/reviews/bulk-assign` - Bulk assign reviewers

### Notifications
- `GET /api/admin/notifications` - Get system notifications
- `GET /api/admin/notifications/health` - Get system health status
- `GET /api/admin/notifications/activity` - Get activity feed
- `POST /api/admin/notifications/send` - Send notifications

## Installation & Setup

### Prerequisites
- Node.js 14+ 
- MongoDB 4.4+
- Express.js 4.18+

### Backend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file with the following variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/csmr-journal
   JWT_SECRET=your_jwt_secret_here
   ```

3. **Start the Server**
   ```bash
   npm run dev
   ```

### Frontend Integration

1. **Authentication Setup**
   ```javascript
   // Use the same authentication system as main app
   const response = await fetch('/api/users/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password }),
     credentials: 'include'
   });
   ```

2. **Role-Based Routing**
   ```javascript
   // Redirect based on user role
   if (user.isAdmin || user.role === 'admin') {
     window.location.href = '/admin/dashboard';
   } else {
     window.location.href = '/dashboard';
   }
   ```

3. **Admin Panel Components**
   - Dashboard with statistics and charts
   - User management interface
   - Article management system
   - Publication workflow management
   - Review management interface
   - Notification system

## Default Admin Account

The system creates a default admin account on startup:
- **Email**: admin@csmr.org.in
- **Password**: Admin@123

**⚠️ Important**: Change the default password after first login!

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Admin-only endpoint protection
- Session management with secure cookies

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation

### Rate Limiting
- 100 requests per 15 minutes for admin actions
- IP-based rate limiting
- User-based rate limiting

### Audit Logging
- All admin actions are logged
- User activity tracking
- System event logging
- Security event monitoring

## Database Schema

### User Roles
- `user`: Basic user account
- `author`: Can submit articles
- `reviewer`: Can review articles
- `editor`: Can manage articles and assign reviewers
- `admin`: Full system access

### Article Statuses
- `submitted`: Newly submitted article
- `initial-review`: Under initial editorial review
- `under-review`: Under peer review
- `revision-required`: Requires author revision
- `revised`: Revised version submitted
- `accepted`: Accepted for publication
- `rejected`: Rejected for publication
- `published`: Published article
- `withdrawn`: Withdrawn by author

## API Documentation

For detailed API documentation, see:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Main API documentation
- [ADMIN_API_DOCUMENTATION.md](./ADMIN_API_DOCUMENTATION.md) - Admin panel specific endpoints

## Frontend Integration

For frontend integration guide, see:
- [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) - Complete frontend integration guide

## Development

### Project Structure
```
csmr-backend/
├── controllers/
│   ├── adminController.js          # Admin dashboard and user management
│   ├── publicationController.js    # Publication workflow management
│   ├── reviewController.js         # Review management
│   └── notificationController.js   # Notifications and monitoring
├── routes/
│   ├── adminRoutes.js              # Admin panel routes
│   ├── publicationRoutes.js        # Publication routes
│   ├── reviewRoutes.js             # Review routes
│   └── notificationRoutes.js       # Notification routes
├── middleware/
│   └── adminMiddleware.js          # Admin-specific middleware
└── models/
    ├── userModel.js                # User schema with roles
    ├── articleModel.js             # Article schema with statuses
    └── journalModel.js             # Journal schema
```

### Adding New Features

1. **Create Controller**
   ```javascript
   // controllers/newFeatureController.js
   const asyncHandler = require('express-async-handler');
   
   const newFeature = asyncHandler(async (req, res) => {
     // Implementation
   });
   
   module.exports = { newFeature };
   ```

2. **Create Routes**
   ```javascript
   // routes/newFeatureRoutes.js
   const express = require('express');
   const router = express.Router();
   const { newFeature } = require('../controllers/newFeatureController');
   const { protect, admin } = require('../middleware/authMiddleware');
   
   router.use(protect, admin);
   router.get('/new-feature', newFeature);
   
   module.exports = router;
   ```

3. **Update Server**
   ```javascript
   // server.js
   app.use('/api/admin/new-feature', require('./routes/newFeatureRoutes'));
   ```

### Testing

Run the test suite:
```bash
npm test
```

Run specific admin tests:
```bash
npm test -- --grep "admin"
```

## Deployment

### Production Environment

1. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb://your-production-db
   JWT_SECRET=your_secure_jwt_secret
   ```

2. **Security Headers**
   - Helmet.js for security headers
   - CORS configuration for frontend domains
   - Rate limiting for production traffic

3. **Monitoring**
   - Winston logging
   - Error tracking
   - Performance monitoring

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### v1.0.0
- Initial admin panel release
- Dashboard with statistics and analytics
- User management system
- Article management workflow
- Publication management
- Review management system
- Notification and monitoring system
- Comprehensive API documentation
- Frontend integration guide
