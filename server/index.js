require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { db } = require('./db/index');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Add this after other route requires
const invitationsRouter = require('./routes/invitations');
const rentTrackingRouter = require('./routes/rentTracking');

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
    const properties = await db.getProperties(req.user.userId);
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
      status: req.body.assignedToId ? 'IN_PROGRESS' : 'OPEN',
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

// OLD TENANT ENDPOINTS - REMOVED (now using /routes/tenants.js)
// These endpoints are replaced by the new simplified tenant routes

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

// Lease upload endpoint for landlords
app.post('/api/leases/upload', authenticateToken, uploadLeaseDoc.single('file'), async (req, res) => {
  console.log('Received upload:', req.body, req.file);
  try {
    // Only landlords can upload leases
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ message: 'Only landlords can upload leases.' });
    }

    const { tenantId, propertyId, unitId, rentAmount, securityDeposit, leaseStartDate, leaseEndDate } = req.body;
    if (!tenantId || !propertyId || !leaseStartDate || !leaseEndDate || !req.file) {
      return res.status(400).json({ message: 'Missing required fields or file.' });
    }

    // Determine rent value
    let rentValue = null;
    if (rentAmount && rentAmount !== '') {
      rentValue = parseFloat(rentAmount);
    } else {
      // Try to get rent from property/unit
      const property = await db.getPropertyById(propertyId);
      if (unitId) {
        const unit = await db.getUnitById(unitId);
        rentValue = unit?.rent || null;
      } else {
        rentValue = property?.rent || null;
      }
    }

    // Create LeaseAgreement
    const lease = await db.createLease(Number(tenantId), {
      propertyId,
      unitId,
      rentAmount: rentValue,
      securityDeposit,
      leaseStartDate,
      leaseEndDate,
    }, req.user.userId);

    // Store the uploaded file as a TenantDocument
    const document = await db.createTenantDocument({
      tenantId: Number(tenantId),
      type: 'LEASE_AGREEMENT',
      filename: req.file.filename,
      fileUrl: `/uploads/leases/${req.file.filename}`,
      uploadedBy: req.user.userId,
    });

    res.status(201).json({ message: 'Lease uploaded and linked successfully.', lease, document });
  } catch (error) {
    console.error('Error uploading lease:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Lease upload for invited tenant (before registration)
app.post('/api/leases/upload-for-invite', authenticateToken, uploadLeaseDoc.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ message: 'Only landlords can upload leases.' });
    }
    const { invitationId, propertyId, unitId, rentAmount, securityDeposit, leaseStartDate, leaseEndDate } = req.body;
    if (!invitationId || !propertyId || !rentAmount || !leaseStartDate || !leaseEndDate || !req.file) {
      return res.status(400).json({ message: 'Missing required fields or file.' });
    }
    // Find invitation
    const invitation = await db.getInvitationById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }
    // Create LeaseAgreement linked to invitation
    const lease = await db.createLease(1, { // Placeholder tenantId, will be updated when tenant registers
      propertyId,
      unitId,
      rentAmount,
      securityDeposit,
      leaseStartDate,
      leaseEndDate,
    }, req.user.userId);
    
    // Update lease with invitation ID
    await db.updateLease(lease.id, { invitationId: invitation.id }, req.user.userId);
    
    // Store the uploaded file as a TenantDocument linked to invitation
    const document = await db.createTenantDocument({
      tenantId: 1, // Placeholder, will be updated when tenant registers
      type: 'LEASE_AGREEMENT',
      filename: req.file.filename,
      fileUrl: `/uploads/leases/${req.file.filename}`,
      uploadedBy: req.user.userId,
    });
    res.status(201).json({ message: 'Lease uploaded and linked to invitation successfully.', lease, document });
  } catch (error) {
    console.error('Error uploading lease for invite:', error);
    res.status(500).json({ message: 'Internal server error' });
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

// Rent tracking payment operations
app.post('/api/rent-tracking/payments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    
    const { tenantId, propertyId, unitId, dueDate, amount, paid, paidDate } = req.body;
    
    const payment = await db.createPayment({
      tenantId: parseInt(tenantId),
      propertyId: parseInt(propertyId),
      unitId: unitId ? parseInt(unitId) : null,
      dueDate,
      amount: parseFloat(amount),
      paid: Boolean(paid),
      paidDate: paidDate || null,
      createdBy: req.user.userId
    });
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.patch('/api/rent-tracking/payments/:paymentId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    
    const { paid, paidDate } = req.body;
    const payment = await db.updatePayment(req.params.paymentId, {
      paid: Boolean(paid),
      paidDate: paidDate || null
    }, req.user.userId, req.user.role);
    
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
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

// OLD ADD-WITH-LEASE ENDPOINT - REMOVED (now using /routes/tenants.js)
// This endpoint is replaced by the new simplified tenant creation route

// Add this with other app.use or route registrations
app.use('/api/invitations', invitationsRouter);

// Simplified tenant routes
const tenantsRouter = require('./routes/tenants');
app.use('/api/tenants', tenantsRouter);

// Rent Tracking endpoint (flat array for rent tracking tab)
app.get('/api/rent-tracking', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    const rows = await db.getTenantAssignmentsFlat(req.user.userId);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching rent tracking data:', error);
    res.status(500).json({ error: 'Failed to fetch rent tracking data' });
  }
});

// Simple maintenance requests
app.get('/api/maintenance-requests', authenticateToken, async (req, res) => {
  try {
    // For now, return mock data until we implement the database functions
    const mockRequests = [
      {
        id: 1,
        title: 'Leaky faucet in kitchen',
        description: 'The kitchen faucet is dripping constantly',
        category: 'PLUMBING',
        priority: 'MEDIUM',
        status: 'OPEN',
        propertyId: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Broken window lock',
        description: 'The lock on the bedroom window is not working',
        category: 'GENERAL',
        priority: 'LOW',
        status: 'IN_PROGRESS',
        propertyId: 2,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 3,
        title: 'HVAC not cooling',
        description: 'Air conditioning is not working properly',
        category: 'HVAC',
        priority: 'HIGH',
        status: 'COMPLETED',
        propertyId: 1,
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    res.json(mockRequests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
  }
});

app.post('/api/maintenance-requests', authenticateToken, async (req, res) => {
  try {
    const newRequest = {
      id: Date.now(),
      ...req.body,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    
    // Validate that propertyId is provided
    if (!newRequest.propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ error: 'Failed to create maintenance request' });
  }
});

app.patch('/api/maintenance-requests/:id', authenticateToken, async (req, res) => {
  try {
    // For now, just return the updated request
    const updatedRequest = {
      id: parseInt(req.params.id),
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({ error: 'Failed to update maintenance request' });
  }
});

// Enhanced work orders with contractor integration
app.get('/api/work-orders', authenticateToken, async (req, res) => {
  try {
    const workOrders = await db.getWorkOrders(req.user.userId, req.user.role);
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
    const workOrder = await db.updateWorkOrder(req.params.id, req.body, req.user.userId, req.user.role);
    res.json(workOrder);
  } catch (error) {
    console.error('Error updating work order:', error);
    res.status(500).json({ error: 'Failed to update work order' });
  }
});

app.patch('/api/work-orders/:id/assign', authenticateToken, async (req, res) => {
  try {
    const workOrder = await db.assignWorkOrder(req.params.id, req.body, req.user.userId);
    res.json(workOrder);
  } catch (error) {
    console.error('Error assigning work order:', error);
    res.status(500).json({ error: 'Failed to assign work order' });
  }
});

// Maintenance communication system
app.post('/api/maintenance-communications', authenticateToken, async (req, res) => {
  try {
    const communication = await db.createMaintenanceCommunication({
      ...req.body,
      senderId: req.user.userId
    });
    res.status(201).json(communication);
  } catch (error) {
    console.error('Error creating maintenance communication:', error);
    res.status(500).json({ error: 'Failed to create communication' });
  }
});

app.get('/api/maintenance-communications/:requestId', authenticateToken, async (req, res) => {
  try {
    const communications = await db.getMaintenanceCommunications(req.params.requestId, req.user.userId, req.user.role);
    res.json(communications);
  } catch (error) {
    console.error('Error fetching maintenance communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Maintenance analytics and reporting
app.get('/api/maintenance-analytics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    
    const analytics = await db.getMaintenanceAnalytics(req.user.userId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching maintenance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance analytics' });
  }
});

// Integrated Dashboard endpoint - provides comprehensive data for all features
app.get('/api/dashboard/integrated', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ error: 'Access denied. Landlords only.' });
    }
    
    // Fetch all data in parallel
    const [properties, tenants, rentTracking] = await Promise.all([
      db.getProperties(req.user.userId),
      db.getAllTenants(req.user.userId),
      db.getTenantAssignmentsFlat(req.user.userId)
    ]);

    // Calculate comprehensive statistics
    const totalProperties = properties.length;
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.hasActiveLease).length;
    
    // Financial calculations - properly calculate from payments data
    const totalMonthlyRent = rentTracking.reduce((sum, rent) => sum + (rent.rent || 0), 0);
    
    // Calculate collected and outstanding amounts from payments
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let overdueTenants = 0;
    
    rentTracking.forEach(rent => {
      const payments = rent.payments || [];
      const paidPayments = payments.filter(p => p.status === 'PAID');
      const unpaidPayments = payments.filter(p => p.status !== 'PAID');
      
      // Calculate collected amount
      totalCollected += paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Calculate outstanding amount
      totalOutstanding += unpaidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Calculate overdue amount
      const overduePayments = unpaidPayments.filter(p => new Date(p.dueDate) < new Date());
      overdueAmount += overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Count overdue tenants
      if (overduePayments.length > 0) {
        overdueTenants++;
      }
    });
    
    // Occupancy calculations
    const totalUnits = properties.reduce((sum, prop) => sum + (prop.units?.length || 1), 0);
    const occupiedUnits = rentTracking.length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits * 100).toFixed(1) : 0;

    // Property type breakdown
    const singleFamilyProperties = properties.filter(p => p.type === 'single-family').length;
    const multiFamilyProperties = properties.filter(p => p.type === 'multi-family').length;

    // Recent activity
    const recentPayments = rentTracking
      .flatMap(rent => rent.payments || [])
      .filter(payment => payment.status === 'PAID' && payment.paidDate)
      .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
      .slice(0, 5);

    const expiringLeases = rentTracking.filter(rent => {
      if (!rent.leaseEnd) return false;
      const endDate = new Date(rent.leaseEnd);
      const now = new Date();
      const daysUntilExpiry = (endDate - now) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    const integratedData = {
      summary: {
        totalProperties,
        totalTenants,
        activeTenants,
        totalMonthlyRent,
        totalCollected,
        totalOutstanding,
        totalUnits,
        occupiedUnits,
        occupancyRate: parseFloat(occupancyRate),
        overdueTenants,
        overdueAmount,
        singleFamilyProperties,
        multiFamilyProperties
      },
      properties: properties.map(property => {
        const propertyRentData = rentTracking.filter(rent => rent.propertyId === property.id);
        // Count tenants assigned to this property with an active lease
        const now = new Date();
        const propertyTenants = propertyRentData.filter(rent =>
          !rent.leaseEnd || new Date(rent.leaseEnd) > now
        );
        
        // Calculate property-specific financial data
        let propertyTotalCollected = 0;
        let propertyTotalOutstanding = 0;
        let propertyOverdueTenants = 0;
        
        propertyRentData.forEach(rent => {
          const payments = rent.payments || [];
          const paidPayments = payments.filter(p => p.status === 'PAID');
          const unpaidPayments = payments.filter(p => p.status !== 'PAID');
          
          propertyTotalCollected += paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          propertyTotalOutstanding += unpaidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          
          const overduePayments = unpaidPayments.filter(p => new Date(p.dueDate) < new Date());
          if (overduePayments.length > 0) {
            propertyOverdueTenants++;
          }
        });
        
        return {
          ...property,
          tenantCount: propertyTenants.length,
          totalRent: propertyRentData.reduce((sum, rent) => sum + (rent.rent || 0), 0),
          totalCollected: propertyTotalCollected,
          totalOutstanding: propertyTotalOutstanding,
          overdueTenants: propertyOverdueTenants
        };
      }),
      tenants: tenants.map(tenant => {
        const tenantRentData = rentTracking.find(rent => rent.tenantId === tenant.id);
        return {
          ...tenant,
          rentData: tenantRentData || null
        };
      }),
      rentTracking,
      recentActivity: {
        recentPayments,
        expiringLeases
      }
    };

    res.json(integratedData);
  } catch (error) {
    console.error('Error fetching integrated dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch integrated dashboard data' });
  }
});

// Rent Tracking endpoint
app.use('/api/rent-tracking', authenticateToken, rentTrackingRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access via: http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
}); 