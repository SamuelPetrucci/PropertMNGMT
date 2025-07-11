const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

const router = express.Router();

// JWT secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key-change-in-production';

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await db.verifyUser(username, password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { 
      username, 
      password, 
      role, 
      firstName, 
      lastName, 
      email, 
      phone 
    } = req.body;

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({ 
        message: 'Username, password, and role are required' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Validate role
    const validRoles = ['LANDLORD', 'TENANT', 'CONTRACTOR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be LANDLORD, TENANT, or CONTRACTOR' 
      });
    }

    // Check if username already exists
    const existingUser = await db.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Username already exists' 
      });
    }

    // Create user
    const userData = {
      username,
      password,
      role,
      firstName: firstName || null,
      lastName: lastName || null,
      email: email || null,
      phone: phone || null,
    };

    const newUser = await db.createUser(userData);

    // Return success (don't return password)
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify token route (for checking if user is authenticated)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.findUserByUsername(decoded.username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Token is valid',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router; 