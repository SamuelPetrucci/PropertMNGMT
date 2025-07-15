const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/invitations
// Body: { email, propertyId }
router.post('/', async (req, res) => {
  try {
    const { email, propertyId } = req.body;
    if (!email || !propertyId) {
      return res.status(400).json({ message: 'Email and propertyId are required.' });
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation in DB
    const invitation = await prisma.invitation.create({
      data: {
        email,
        propertyId: Number(propertyId),
        token,
      },
    });

    // Log the invite link (replace with email logic in production)
    const inviteLink = `${req.protocol}://${req.get('host')}/register?token=${token}`;
    console.log(`Invite link for tenant: ${inviteLink}`);

    res.status(201).json({
      message: 'Invitation created and invite link logged.',
      invitation,
      inviteLink,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/invitations/register
// Body: { token, username, password, firstName, lastName, phone }
router.post('/register', async (req, res) => {
  try {
    const { token, username, password, firstName, lastName, phone } = req.body;
    if (!token || !username || !password) {
      return res.status(400).json({ message: 'Token, username, and password are required.' });
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(400).json({ message: 'Invalid or expired invitation token.' });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    // Create tenant user
    const user = await prisma.user.create({
      data: {
        username,
        password, // In production, hash the password!
        role: 'TENANT',
        firstName: firstName || null,
        lastName: lastName || null,
        email: invitation.email,
        phone: phone || null,
      },
    });

    // Link tenant to property (TenantUnit)
    await prisma.tenantUnit.create({
      data: {
        tenantId: user.id,
        propertyId: invitation.propertyId,
      },
    });

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    res.status(201).json({ message: 'Tenant registered successfully.', user });
  } catch (error) {
    console.error('Error registering tenant via invitation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 