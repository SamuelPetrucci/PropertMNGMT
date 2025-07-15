const { getPrisma, disconnect } = require('./connection');
const users = require('./users');
const properties = require('./properties');
const payments = require('./payments');
const workOrders = require('./workOrders');
const maintenanceRequests = require('./workOrders'); // Using the same file for maintenance requests
const projects = require('./projects');
const communications = require('./communications');
const invitations = require('./invitations');
const seed = require('./seed');

// Combine all modules into a single db object
const db = {
  // User operations
  ...users,
  
  // Property operations
  ...properties,
  
  // Payment operations
  ...payments,
  
  // Work Order operations
  ...workOrders,
  
  // Project operations
  ...projects,
  
  // Communication operations
  ...communications,
  
  // Invitation operations
  ...invitations,
  
  // Seeding
  seedDatabase: seed.seedDatabase,
  
  // Cleanup function
  disconnect,
};

module.exports = { db }; 