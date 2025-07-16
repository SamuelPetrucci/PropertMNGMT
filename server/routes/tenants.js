const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { db } = require('../db/index');
const { auth } = require('../middleware/auth');
const { updateLeaseDates } = require('../db/users');

console.log('updateLeaseDates direct import:', typeof updateLeaseDates);

// Apply authentication middleware to all routes
router.use(auth);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/leases/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// Get all tenants with simplified data
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/tenants - User ID:', req.user.userId, 'Role:', req.user.role);
    const tenants = await db.getAllTenants(req.user.userId);
    
    // Transform data for frontend
    const simplifiedTenants = tenants.map(tenant => ({
      id: tenant.id,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone,
      status: tenant.assignments.length > 0 ? 'ACTIVE' : 'INACTIVE',
      assignments: tenant.assignments,
      payments: tenant.payments,
      leaseAgreements: tenant.leaseAgreements || []
    }));
    
    res.json(simplifiedTenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Create new tenant with lease in one step
router.post('/create', upload.single('leaseFile'), async (req, res) => {
  try {
    console.log('Received tenant creation request:', {
      body: req.body,
      file: req.file,
      user: req.user,
      userId: req.user.userId,
      userRole: req.user.role
    });

    const {
      firstName,
      lastName,
      email,
      phone,
      propertyId,
      unitId,
      rentAmount,
      securityDeposit,
      leaseStartDate,
      leaseEndDate,
      createAccount = true,
      sendInvitation = false
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !propertyId || !leaseStartDate || !leaseEndDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, propertyId, leaseStartDate, leaseEndDate' 
      });
    }

    // Generate unique username
    const baseUsername = `${firstName}${lastName[0]}`.replace(/\s+/g, '').toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const username = `${baseUsername}${randomSuffix}`;
    const defaultPassword = Math.random().toString(36).substring(2, 8);

    // Create tenant
    const tenant = await db.createTenant({
      landlordId: req.user.userId,
      username: createAccount ? username : null,
      password: createAccount ? defaultPassword : null,
      role: 'TENANT',
      firstName,
      lastName,
      email,
      phone,
      propertyId,
      unitId,
      rentAmount,
      leaseStartDate,
      leaseEndDate,
      securityDeposit
    });

    // Get the created lease
    const tenantInfo = await db.getTenantById(tenant.id, req.user.userId, req.user.role);
    const lease = tenantInfo?.leaseAgreements?.[0];

    // Upload lease document if provided
    let document = null;
    if (req.file && lease) {
      document = await db.createTenantDocument({
        tenantId: tenant.id,
        type: 'LEASE_AGREEMENT',
        filename: req.file.filename,
        fileUrl: `/uploads/leases/${req.file.filename}`,
        uploadedBy: req.user.userId
      });
    }

    // Send invitation email if requested
    if (sendInvitation && email) {
      // TODO: Implement email sending
      console.log(`Sending invitation email to ${email}`);
    }

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: {
        id: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        phone: tenant.phone
      },
      lease,
      document,
      credentials: createAccount ? {
        username,
        password: defaultPassword
      } : null
    });

  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Renew lease
router.post('/:tenantId/renew-lease', upload.single('leaseFile'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { newEndDate, rentAdjustment, leaseFile } = req.body;

    // Get current tenant info
    const tenant = await db.getTenantById(tenantId, req.user.userId, req.user.role);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get current lease
    const currentLease = tenant.leaseAgreements?.[0];
    if (!currentLease) {
      return res.status(400).json({ error: 'No active lease found' });
    }

    // End current lease
    await db.endLeaseAgreement(tenantId, currentLease.propertyId, currentLease.unitId);

    // Create new lease
    const newLease = await db.createLease(tenantId, {
      propertyId: currentLease.propertyId,
      unitId: currentLease.unitId,
      rentAmount: rentAdjustment || currentLease.rentAmount,
      securityDeposit: currentLease.securityDeposit,
      leaseStartDate: currentLease.leaseEndDate, // Start from end of current lease
      leaseEndDate: newEndDate
    }, req.user.userId);

    // Upload new lease document if provided
    let document = null;
    if (req.file) {
      document = await db.createTenantDocument({
        tenantId: tenantId,
        type: 'LEASE_AGREEMENT',
        filename: req.file.filename,
        fileUrl: `/uploads/leases/${req.file.filename}`,
        uploadedBy: req.user.userId
      });
    }

    res.json({
      message: 'Lease renewed successfully',
      lease: newLease,
      document
    });

  } catch (error) {
    console.error('Error renewing lease:', error);
    res.status(500).json({ error: 'Failed to renew lease' });
  }
});

// Get tenant details
router.get('/:tenantId', async (req, res) => {
  try {
    const tenant = await db.getTenantById(req.params.tenantId, req.user.userId, req.user.role);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// Update tenant
router.put('/:tenantId', async (req, res) => {
  try {
    const tenant = await db.updateTenant(req.params.tenantId, req.body, req.user.userId);
    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Delete tenant
router.delete('/:tenantId', async (req, res) => {
  try {
    await db.deleteTenantCascade(req.params.tenantId, req.user.userId);
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

// Get tenant payments
router.get('/:tenantId/payments', async (req, res) => {
  try {
    const payments = await db.getTenantPayments(req.params.tenantId);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching tenant payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Send message to tenant
router.post('/:tenantId/message', async (req, res) => {
  try {
    const { subject, message } = req.body;
    const communication = await db.createCommunication({
      senderId: req.user.userId,
      receiverId: req.params.tenantId,
      subject,
      message,
      type: 'MESSAGE'
    });
    res.json(communication);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update lease dates and regenerate payments
router.patch('/:tenantId/lease-dates', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { propertyId, unitId, leaseStartDate, leaseEndDate, rentAmount } = req.body;

    // Validate required fields
    if (!propertyId || !leaseStartDate || !leaseEndDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: propertyId, leaseStartDate, leaseEndDate' 
      });
    }

    // Debug: Check if the function exists
    console.log('Available db functions:', Object.keys(db));
    console.log('updateLeaseDates function:', typeof db.updateLeaseDates);
    console.log('Direct updateLeaseDates function:', typeof updateLeaseDates);

    const result = await updateLeaseDates(
      parseInt(tenantId), 
      parseInt(propertyId), 
      unitId ? parseInt(unitId) : null,
      { leaseStartDate, leaseEndDate, rentAmount }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating lease dates:', error);
    res.status(500).json({ error: 'Failed to update lease dates' });
  }
});

module.exports = router; 