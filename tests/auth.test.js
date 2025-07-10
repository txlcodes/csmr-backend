/**
 * Authentication API Tests
 */

const request = require('supertest');
const expect = require('jest').expect;
let server;

// Test user credentials
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  institution: 'Test University'
};

// Before tests, start server
beforeAll(async () => {
  // Using a separate test server to avoid conflicts
  process.env.PORT = 5001;
  process.env.TEST_MODE = 'true';
  server = require('../server');
});

// After tests, close server
afterAll(async () => {
  await server.close();
});

// Authentication tests
describe('Authentication API', () => {
  // Test user registration
  describe('POST /api/users', () => {
    it('should register a new user and return token', async () => {
      // Skip in CI environments where database might not be available
      if (process.env.CI) {
        return;
      }
      
      try {
        const res = await request(server)
          .post('/api/users')
          .send(testUser);
        
        // Check for 201 status
        expect(res.statusCode).toBe(201);
        
        // Check response structure
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('_id');
        expect(res.body.email).toBe(testUser.email);
      } catch (err) {
        console.log('Test failed:', err);
        throw err;
      }
    });

    it('should not register user with existing email', async () => {
      // Skip in CI environments
      if (process.env.CI) {
        return;
      }
      
      try {
        const res = await request(server)
          .post('/api/users')
          .send(testUser);
        
        // Check for 400 status (Bad Request)
        expect(res.statusCode).toBe(400);
        
        // Check error message
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toMatch(/already exists/i);
      } catch (err) {
        console.log('Test failed:', err);
        throw err;
      }
    });
  });

  // Test user login
  describe('POST /api/users/login', () => {
    it('should login user and return token', async () => {
      // Skip in CI environments
      if (process.env.CI) {
        return;
      }
      
      try {
        const res = await request(server)
          .post('/api/users/login')
          .send({
            email: testUser.email,
            password: testUser.password
          });
        
        // Check for 200 status
        expect(res.statusCode).toBe(200);
        
        // Check response structure
        expect(res.body).toHaveProperty('token');
        expect(res.body.email).toBe(testUser.email);
      } catch (err) {
        console.log('Test failed:', err);
        throw err;
      }
    });

    it('should not login with invalid credentials', async () => {
      // Skip in CI environments
      if (process.env.CI) {
        return;
      }
      
      try {
        const res = await request(server)
          .post('/api/users/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword'
          });
        
        // Check for 401 status (Unauthorized)
        expect(res.statusCode).toBe(401);
        
        // Check error message
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toMatch(/invalid credentials/i);
      } catch (err) {
        console.log('Test failed:', err);
        throw err;
      }
    });
  });
}); 