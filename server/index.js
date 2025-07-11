const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { db } = require('./db');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// JWT secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  console.log('GET / - Root route accessed');
  res.json({ 
    message: 'Property Management API Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      projects: '/api/standalone-projects',
      workOrders: '/api/work-orders'
    }
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Multer setup for lease documents
const leaseStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads', 'leases'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const uploadLeaseDoc = multer({ storage: leaseStorage });

// API Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
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

// Properties
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    const properties = await db.getProperties();
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.post('/api/properties', authenticateToken, async (req, res) => {
  console.log('POST /api/properties - Creating property');
  console.log('Request body:', req.body);
  console.log('User ID:', req.user.userId);
  try {
    const property = await db.createProperty({
      ...req.body,
      ownerId: req.user.userId
    });
    console.log('Property created successfully:', property.id);
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

app.patch('/api/properties/:id', authenticateToken, async (req, res) => {
  console.log(`PATCH /api/properties/${req.params.id} - Updating property`);
  console.log('Request body:', req.body);
  console.log('User ID:', req.user.userId);
  try {
    const property = await db.updateProperty(req.params.id, req.body);
    console.log('Property updated successfully:', property.id);
    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    await db.deleteProperty(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Standalone Projects
app.get('/api/standalone-projects', authenticateToken, async (req, res) => {
  try {
    const projects = await db.getStandaloneProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/standalone-projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await db.getStandaloneProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/standalone-projects', authenticateToken, async (req, res) => {
  try {
    const project = await db.createStandaloneProject({
      ...req.body,
      ownerId: req.user.userId
    });
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.patch('/api/standalone-projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await db.updateStandaloneProject(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    console.error('Error updating standalone project:', error);
    res.status(500).json({ error: 'Failed to update standalone project' });
  }
});

app.delete('/api/standalone-projects/:id', authenticateToken, async (req, res) => {
  try {
    await db.deleteStandaloneProject(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Project Jobs
app.get('/api/standalone-projects/:projectId/jobs', authenticateToken, async (req, res) => {
  try {
    const jobs = await db.getProjectJobs(req.params.projectId);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching project jobs:', error);
    res.status(500).json({ error: 'Failed to fetch project jobs' });
  }
});

app.post('/api/standalone-projects/:projectId/jobs', authenticateToken, async (req, res) => {
  try {
    const job = await db.createProjectJob({
      ...req.body,
      projectId: req.params.projectId
    });
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating project job:', error);
    res.status(500).json({ error: 'Failed to create project job' });
  }
});

app.put('/api/standalone-projects/jobs/:jobId', authenticateToken, async (req, res) => {
  try {
    const job = await db.updateProjectJob(req.params.jobId, req.body);
    res.json(job);
  } catch (error) {
    console.error('Error updating project job:', error);
    res.status(500).json({ error: 'Failed to update project job' });
  }
});

app.patch('/api/standalone-projects/jobs/:jobId', authenticateToken, async (req, res) => {
  try {
    const job = await db.updateProjectJob(req.params.jobId, req.body);
    res.json(job);
  } catch (error) {
    console.error('Error updating project job:', error);
    res.status(500).json({ error: 'Failed to update project job' });
  }
});

app.delete('/api/standalone-projects/jobs/:jobId', authenticateToken, async (req, res) => {
  try {
    await db.deleteProjectJob(req.params.jobId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project job:', error);
    res.status(500).json({ error: 'Failed to delete project job' });
  }
});

// Project Costs
app.get('/api/standalone-projects/:projectId/costs', authenticateToken, async (req, res) => {
  try {
    const costs = await db.getProjectCosts(req.params.projectId);
    res.json(costs);
  } catch (error) {
    console.error('Error fetching project costs:', error);
    res.status(500).json({ error: 'Failed to fetch project costs' });
  }
});

app.post('/api/standalone-projects/:projectId/costs', authenticateToken, async (req, res) => {
  try {
    const cost = await db.createProjectCost({
      ...req.body,
      projectId: req.params.projectId
    });
    res.status(201).json(cost);
  } catch (error) {
    console.error('Error creating project cost:', error);
    res.status(500).json({ error: 'Failed to create project cost' });
  }
});

app.delete('/api/standalone-projects/costs/:costId', authenticateToken, async (req, res) => {
  try {
    await db.deleteProjectCost(req.params.costId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project cost:', error);
    res.status(500).json({ error: 'Failed to delete project cost' });
  }
});

// Work Orders
app.get('/api/work-orders', authenticateToken, async (req, res) => {
  try {
    const workOrders = await db.getWorkOrders();
    res.json(workOrders);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: 'Failed to fetch work orders' });
  }
});

app.post('/api/work-orders', authenticateToken, async (req, res) => {
  try {
    const workOrder = await db.createWorkOrder({
      ...req.body,
      createdById: req.user.userId
    });
    res.status(201).json(workOrder);
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

app.patch('/api/work-orders/:id', authenticateToken, async (req, res) => {
  try {
    const workOrder = await db.updateWorkOrder(req.params.id, req.body);
    res.json(workOrder);
  } catch (error) {
    console.error('Error updating work order:', error);
    res.status(500).json({ error: 'Failed to update work order' });
  }
});

app.patch('/api/work-orders/:id/assign', authenticateToken, async (req, res) => {
  try {
    const workOrder = await db.updateWorkOrder(req.params.id, {
      assignedToId: req.body.assignedToId,
      status: req.body.assignedToId ? 'ASSIGNED' : 'OPEN',
      notes: req.body.notes
    });
    res.json(workOrder);
  } catch (error) {
    console.error('Error assigning work order:', error);
    res.status(500).json({ error: 'Failed to assign work order' });
  }
});

// User Info
app.get('/api/user-info', authenticateToken, async (req, res) => {
  try {
    const user = await db.findUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // For tenants, include property information
    if (user.role === 'TENANT') {
      const tenantInfo = await db.getTenantInfo(user.id);
      res.json(tenantInfo);
    } else {
      // Remove password from response for other roles
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// Tenant Payments
app.get('/api/tenant-payments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'TENANT') {
      return res.status(403).json({ error: 'Access denied. Tenants only.' });
    }
    
    const payments = await db.getTenantPayments(req.user.userId);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching tenant payments:', error);
    res.status(500).json({ error: 'Failed to fetch tenant payments' });
  }
});

// Comprehensive Tenant Management API
app.get('/api/tenants', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    
    const tenants = await db.getAllTenants(req.user.userId);
    res.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

app.post('/api/tenants', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    
    const tenant = await db.createTenant({
      ...req.body,
      landlordId: req.user.userId
    });
    res.status(201).json(tenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

app.get('/api/tenants/:id', authenticateToken, async (req, res) => {
  try {
    const tenant = await db.getTenantById(req.params.id, req.user.userId, req.user.role);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

app.put('/api/tenants/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    
    const tenant = await db.updateTenant(req.params.id, req.body, req.user.userId);
    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

app.delete('/api/tenants/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    await db.deleteTenantCascade(req.params.id, req.user.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

// Lease Management
app.post('/api/tenants/:id/leases', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    
    const lease = await db.createLease(req.params.id, req.body, req.user.userId);
    res.status(201).json(lease);
  } catch (error) {
    console.error('Error creating lease:', error);
    res.status(500).json({ error: 'Failed to create lease' });
  }
});

// Update lease agreement (start/end dates)
app.patch('/api/leases/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    const lease = await db.updateLease(req.params.id, req.body, req.user.userId);
    res.json(lease);
  } catch (error) {
    console.error('Error updating lease:', error);
    res.status(500).json({ error: 'Failed to update lease' });
  }
});

// Upload lease document
app.post('/api/leases/:id/documents', authenticateToken, uploadLeaseDoc.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    const leaseId = parseInt(req.params.id);
    const { type } = req.body; // DocumentType (e.g., LEASE_AGREEMENT)
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Find lease to get tenantId
    const lease = await db.getLeaseById(leaseId);
    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    // Save document metadata
    const doc = await db.createTenantDocument({
      tenantId: lease.tenantId,
      type: type || 'LEASE_AGREEMENT',
      filename: req.file.originalname,
      fileUrl: `/api/lease-documents/${req.file.filename}`,
      uploadedBy: req.user.userId
    });
    res.status(201).json(doc);
  } catch (error) {
    console.error('Error uploading lease document:', error);
    res.status(500).json({ error: 'Failed to upload lease document' });
  }
});

// List lease documents for a lease
app.get('/api/leases/:id/documents', authenticateToken, async (req, res) => {
  try {
    const leaseId = parseInt(req.params.id);
    const lease = await db.getLeaseById(leaseId);
    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    // Only landlord or tenant can view
    if (req.user.role !== 'LANDLORD' && (req.user.role !== 'TENANT' || req.user.userId !== lease.tenantId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const docs = await db.getTenantDocumentsForLease(leaseId);
    res.json(docs);
  } catch (error) {
    console.error('Error listing lease documents:', error);
    res.status(500).json({ error: 'Failed to list lease documents' });
  }
});

// Download/view a lease document
app.get('/api/lease-documents/:filename', authenticateToken, async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', 'leases', req.params.filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving lease document:', error);
    res.status(500).json({ error: 'Failed to serve lease document' });
  }
});

// Payment Management
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const payments = await db.getAllPayments(req.user.userId, req.user.role);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
  try {
    const payment = await db.createPayment({
      ...req.body,
      createdBy: req.user.userId
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.patch('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await db.updatePayment(req.params.id, req.body, req.user.userId, req.user.role);
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Communication System
app.post('/api/communications', authenticateToken, async (req, res) => {
  try {
    const communication = await db.createCommunication({
      ...req.body,
      senderId: req.user.userId
    });
    res.status(201).json(communication);
  } catch (error) {
    console.error('Error creating communication:', error);
    res.status(500).json({ error: 'Failed to create communication' });
  }
});

app.get('/api/communications', authenticateToken, async (req, res) => {
  try {
    const communications = await db.getCommunications(req.user.userId, req.user.role);
    res.json(communications);
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Property-specific tenant operations
app.patch('/api/properties/:propertyId/tenants/:unitNumber', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    
    const result = await db.updateTenantUnit(req.params.propertyId, req.params.unitNumber, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating tenant unit:', error);
    res.status(500).json({ error: 'Failed to update tenant unit' });
  }
});

// Contractors
app.get('/api/contractors', authenticateToken, async (req, res) => {
  try {
    const contractors = await db.getContractors();
    res.json(contractors);
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
});

// Unassign a tenant from a property/unit (end lease)
app.delete('/api/tenants/:tenantId/assignment', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    const { propertyId, unitId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }
    // End active lease agreement (set status to TERMINATED)
    await db.endLeaseAgreement(parseInt(req.params.tenantId), parseInt(propertyId), unitId ? parseInt(unitId) : undefined);
    // Remove tenantUnit assignment
    await db.deleteTenantUnit(parseInt(req.params.tenantId), parseInt(propertyId), unitId ? parseInt(unitId) : undefined);
    res.json({ success: true });
  } catch (error) {
    console.error('Error unassigning tenant:', error);
    res.status(500).json({ error: 'Failed to unassign tenant' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access via: http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
}); 