# CSMR Frontend Integration Guide

## Overview
This guide explains how to integrate the CSMR admin panel with the frontend sign up and login system, creating a seamless user experience inspired by Taylor & Francis publishing workflows.

## Frontend Architecture

### 1. Authentication Flow
The admin panel uses the same authentication system as the main application:

```javascript
// Frontend authentication service
class AuthService {
  static async login(email, password) {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Important for cookie-based auth
    });
    
    const data = await response.json();
    
    if (data.isAdmin || data.role === 'admin') {
      // Redirect to admin panel
      window.location.href = '/admin/dashboard';
    } else {
      // Redirect to user dashboard
      window.location.href = '/dashboard';
    }
    
    return data;
  }
  
  static async register(userData) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    
    return response.json();
  }
}
```

### 2. Role-Based Routing
Implement role-based routing to show different interfaces based on user permissions:

```javascript
// React Router example
import { Route, Redirect } from 'react-router-dom';

const ProtectedRoute = ({ component: Component, requiredRole, ...props }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (requiredRole && !user.isAdmin && user.role !== requiredRole) {
    return <Redirect to="/unauthorized" />;
  }
  
  return <Component {...props} />;
};

// Usage in App.js
function App() {
  return (
    <Router>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* User routes */}
      <ProtectedRoute path="/dashboard" component={UserDashboard} />
      <ProtectedRoute path="/profile" component={UserProfile} />
      
      {/* Admin routes */}
      <ProtectedRoute 
        path="/admin" 
        component={AdminPanel} 
        requiredRole="admin" 
      />
      <ProtectedRoute 
        path="/admin/dashboard" 
        component={AdminDashboard} 
        requiredRole="admin" 
      />
      <ProtectedRoute 
        path="/admin/users" 
        component={UserManagement} 
        requiredRole="admin" 
      />
      <ProtectedRoute 
        path="/admin/articles" 
        component={ArticleManagement} 
        requiredRole="admin" 
      />
    </Router>
  );
}
```

### 3. Admin Panel Components

#### Dashboard Component
```javascript
import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include'
      });
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.overview.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Articles</h3>
          <p className="stat-number">{stats.overview.totalArticles}</p>
        </div>
        <div className="stat-card">
          <h3>Published This Year</h3>
          <p className="stat-number">{stats.overview.publishedThisYear}</p>
        </div>
        <div className="stat-card">
          <h3>Recent Submissions</h3>
          <p className="stat-number">{stats.overview.recentSubmissions}</p>
        </div>
      </div>

      {/* Articles by Status Chart */}
      <div className="chart-container">
        <h3>Articles by Status</h3>
        <ArticlesStatusChart data={stats.articlesByStatus} />
      </div>
    </div>
  );
};
```

#### User Management Component
```javascript
import React, { useState, useEffect } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    role: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/admin/users?${queryParams}`, {
      credentials: 'include'
    });
    const data = await response.json();
    setUsers(data.data.users);
    setPagination(data.data.pagination);
  };

  const updateUserRole = async (userId, newRole, isAdmin) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole, isAdmin }),
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  return (
    <div className="user-management">
      <h1>User Management</h1>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        <select
          value={filters.role}
          onChange={(e) => setFilters({...filters, role: e.target.value})}
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="author">Author</option>
          <option value="reviewer">Reviewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Institution</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user._id, e.target.value, user.isAdmin)}
                >
                  <option value="user">User</option>
                  <option value="author">Author</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{user.institution}</td>
              <td>
                <button onClick={() => deleteUser(user._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: pagination.pages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setFilters({...filters, page: i + 1})}
            className={filters.page === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
```

#### Article Management Component
```javascript
import React, { useState, useEffect } from 'react';

const ArticleManagement = () => {
  const [articles, setArticles] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    search: ''
  });

  const fetchArticles = async () => {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/admin/articles?${queryParams}`, {
      credentials: 'include'
    });
    const data = await response.json();
    setArticles(data.data.articles);
  };

  const updateArticleStatus = async (articleId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchArticles(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating article status:', error);
    }
  };

  return (
    <div className="article-management">
      <h1>Article Management</h1>
      
      {/* Status Filter */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under-review">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Articles Table */}
      <table className="articles-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Authors</th>
            <th>Status</th>
            <th>Journal</th>
            <th>Submission Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(article => (
            <tr key={article._id}>
              <td>{article.title}</td>
              <td>{article.authors.map(author => author.name).join(', ')}</td>
              <td>
                <select
                  value={article.status}
                  onChange={(e) => updateArticleStatus(article._id, e.target.value)}
                >
                  <option value="submitted">Submitted</option>
                  <option value="initial-review">Initial Review</option>
                  <option value="under-review">Under Review</option>
                  <option value="revision-required">Revision Required</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="published">Published</option>
                </select>
              </td>
              <td>{article.journal?.title}</td>
              <td>{new Date(article.submissionDate).toLocaleDateString()}</td>
              <td>
                <button onClick={() => viewArticle(article._id)}>
                  View
                </button>
                <button onClick={() => assignReviewers(article._id)}>
                  Assign Reviewers
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 4. CSS Styling (Taylor & Francis Inspired)

```css
/* Admin Panel Styles */
.admin-dashboard {
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-left: 4px solid #007bff;
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin: 0;
}

/* Tables */
.users-table, .articles-table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.users-table th, .articles-table th {
  background-color: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.users-table td, .articles-table td {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

/* Filters */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.filters input, .filters select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Buttons */
button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

/* Pagination */
.pagination {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.pagination button {
  padding: 0.5rem 0.75rem;
  background-color: white;
  color: #007bff;
  border: 1px solid #007bff;
}

.pagination button.active {
  background-color: #007bff;
  color: white;
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .users-table, .articles-table {
    font-size: 0.8rem;
  }
}
```

### 5. API Service Layer

```javascript
// api/adminService.js
class AdminService {
  static async getDashboardStats() {
    const response = await fetch('/api/admin/dashboard', {
      credentials: 'include'
    });
    return response.json();
  }

  static async getUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/admin/users?${queryParams}`, {
      credentials: 'include'
    });
    return response.json();
  }

  static async updateUserRole(userId, role, isAdmin) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role, isAdmin }),
      credentials: 'include'
    });
    return response.json();
  }

  static async getArticles(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/admin/articles?${queryParams}`, {
      credentials: 'include'
    });
    return response.json();
  }

  static async updateArticleStatus(articleId, status, editorAssigned) {
    const response = await fetch(`/api/admin/articles/${articleId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, editorAssigned }),
      credentials: 'include'
    });
    return response.json();
  }

  static async assignReviewers(articleId, reviewerIds, dueDate) {
    const response = await fetch(`/api/admin/articles/${articleId}/assign-reviewers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reviewerIds, dueDate }),
      credentials: 'include'
    });
    return response.json();
  }

  static async getNotifications() {
    const response = await fetch('/api/admin/notifications', {
      credentials: 'include'
    });
    return response.json();
  }

  static async getSystemHealth() {
    const response = await fetch('/api/admin/notifications/health', {
      credentials: 'include'
    });
    return response.json();
  }
}

export default AdminService;
```

### 6. Environment Configuration

```javascript
// config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/users/login`,
  REGISTER: `${API_BASE_URL}/users`,
  PROFILE: `${API_BASE_URL}/users/profile`,
  
  // Admin endpoints
  ADMIN_DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
  ADMIN_USERS: `${API_BASE_URL}/admin/users`,
  ADMIN_ARTICLES: `${API_BASE_URL}/admin/articles`,
  ADMIN_PUBLICATIONS: `${API_BASE_URL}/admin/publications`,
  ADMIN_REVIEWS: `${API_BASE_URL}/admin/reviews`,
  ADMIN_NOTIFICATIONS: `${API_BASE_URL}/admin/notifications`,
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_ARTICLES: '/admin/articles',
  ADMIN_PUBLICATIONS: '/admin/publications',
  ADMIN_REVIEWS: '/admin/reviews',
};
```

## Integration Checklist

- [ ] Set up authentication service with role-based routing
- [ ] Create admin panel layout with navigation
- [ ] Implement dashboard with statistics and charts
- [ ] Build user management interface
- [ ] Create article management system
- [ ] Add publication workflow management
- [ ] Implement review management interface
- [ ] Add notification system
- [ ] Create responsive design for mobile devices
- [ ] Add error handling and loading states
- [ ] Implement real-time updates (optional)
- [ ] Add data export functionality
- [ ] Create audit logs interface
- [ ] Add system health monitoring

## Security Considerations

1. **Authentication**: Always verify user authentication and admin privileges
2. **Authorization**: Implement proper role-based access control
3. **Input Validation**: Validate all user inputs on both frontend and backend
4. **CSRF Protection**: Use CSRF tokens for state-changing operations
5. **Rate Limiting**: Implement rate limiting for admin actions
6. **Audit Logging**: Log all admin actions for security auditing
7. **Data Sanitization**: Sanitize all data before displaying to prevent XSS

## Performance Optimization

1. **Lazy Loading**: Implement lazy loading for admin components
2. **Pagination**: Use pagination for large data sets
3. **Caching**: Implement caching for frequently accessed data
4. **Debouncing**: Add debouncing for search inputs
5. **Virtual Scrolling**: Use virtual scrolling for large lists
6. **Image Optimization**: Optimize images and use appropriate formats
7. **Bundle Splitting**: Split admin panel into separate bundles

This integration guide provides a comprehensive foundation for building a professional admin panel that seamlessly integrates with your existing CSMR frontend authentication system.
