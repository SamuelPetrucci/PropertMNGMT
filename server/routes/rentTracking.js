const express = require('express');
const router = express.Router();
const payments = require('../db/payments');

// Get all payments for the current user (landlord or tenant)
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/rent-tracking - Fetching payments for user:', req.user?.userId, 'role:', req.user?.role);
    
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const allPayments = await payments.getAllPayments(userId, userRole);
    console.log('Retrieved payments:', allPayments.length);
    
    res.json(allPayments);
  } catch (error) {
    console.error('Error fetching rent tracking data:', error);
    res.status(500).json({ error: 'Failed to fetch rent tracking data' });
  }
});

// Create a new payment
router.post('/payments', async (req, res) => {
  try {
    console.log('POST /api/rent-tracking/payments - Creating payment:', req.body);
    
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const paymentData = req.body;
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Validate required fields
    if (!paymentData.tenantId || !paymentData.propertyId || !paymentData.dueDate || !paymentData.amount) {
      console.error('Missing required fields:', paymentData);
      return res.status(400).json({ error: 'Missing required fields: tenantId, propertyId, dueDate, amount' });
    }
    
    const payment = await payments.createPayment(paymentData);
    console.log('Payment created successfully:', payment.id);
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: `Failed to create payment: ${error.message}` });
  }
});

// Update an existing payment
router.patch('/payments/:id', async (req, res) => {
  try {
    console.log('PATCH /api/rent-tracking/payments/:id - Updating payment:', req.params.id, req.body);
    
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const paymentId = req.params.id;
    const updateData = req.body;
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!paymentId) {
      console.error('No payment ID provided');
      return res.status(400).json({ error: 'Payment ID is required' });
    }
    
    const payment = await payments.updatePayment(paymentId, updateData, userId, userRole);
    console.log('Payment updated successfully:', payment.id);
    
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: `Failed to update payment: ${error.message}` });
  }
});

module.exports = router; 