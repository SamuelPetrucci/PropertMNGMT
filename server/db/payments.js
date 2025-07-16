const { getPrisma } = require('./connection');

const payments = {
  async getAllPayments(userId, userRole) {
    try {
      console.log('Getting payments for user:', userId, 'role:', userRole);
      
      if (userRole === 'TENANT') {
        const tenantPayments = await getPrisma().payment.findMany({
          where: { tenantId: userId },
          include: {
            property: true,
            unit: true,
          },
          orderBy: { createdAt: 'desc' }
        });
        console.log('Found', tenantPayments.length, 'payments for tenant');
        return tenantPayments;
      } else {
        // For landlords, get all payments
        const properties = await getPrisma().property.findMany({
          where: { ownerId: userId },
          select: { id: true }
        });

        const propertyIds = properties.map(p => p.id);
        console.log('Landlord properties:', propertyIds);
        
        const landlordPayments = await getPrisma().payment.findMany({
          where: { propertyId: { in: propertyIds } },
          include: {
            property: true,
            unit: true,
          },
          orderBy: { createdAt: 'desc' }
        });
        console.log('Found', landlordPayments.length, 'payments for landlord');
        return landlordPayments;
      }
    } catch (error) {
      console.error('Error in getAllPayments:', error);
      throw error;
    }
  },

  async createPayment(paymentData) {
    try {
      console.log('Creating payment with data:', paymentData);
      
      const payment = await getPrisma().payment.create({
        data: {
          tenantId: paymentData.tenantId,
          propertyId: paymentData.propertyId,
          unitId: paymentData.unitId,
          amount: Number(paymentData.amount),
          dueDate: paymentData.dueDate,
          paidDate: paymentData.paidDate,
          status: paymentData.paid ? 'PAID' : 'PENDING',
          method: paymentData.method,
        },
      });
      
      console.log('Payment created successfully:', payment.id);
      return payment;
    } catch (error) {
      console.error('Error in createPayment:', error);
      throw error;
    }
  },

  async updatePayment(paymentId, updateData, userId, userRole) {
    try {
      console.log('Updating payment:', paymentId, 'with data:', updateData);
      
      const payment = await getPrisma().payment.findUnique({
        where: { id: parseInt(paymentId) },
        include: { property: true }
      });

      if (!payment) {
        console.error('Payment not found:', paymentId);
        throw new Error('Payment not found');
      }

      console.log('Found payment:', payment.id, 'for property:', payment.propertyId);

      // Check permissions
      if (userRole === 'TENANT' && payment.tenantId !== userId) {
        console.error('Unauthorized: tenant', userId, 'trying to access payment for tenant', payment.tenantId);
        throw new Error('Unauthorized');
      }

      const updatedPayment = await getPrisma().payment.update({
        where: { id: parseInt(paymentId) },
        data: {
          amount: updateData.amount ? Number(updateData.amount) : undefined,
          dueDate: updateData.dueDate,
          paidDate: updateData.paidDate,
          status: updateData.paid ? 'PAID' : 'PENDING',
          method: updateData.method,
        },
      });
      
      console.log('Payment updated successfully:', updatedPayment.id);
      return updatedPayment;
    } catch (error) {
      console.error('Error in updatePayment:', error);
      throw error;
    }
  },

  async getTenantPayments(tenantId) {
    try {
      console.log('Getting payments for tenant:', tenantId);
      
      const tenantPayments = await getPrisma().payment.findMany({
        where: { tenantId: parseInt(tenantId) },
        include: {
          property: true,
          unit: true,
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('Found', tenantPayments.length, 'payments for tenant', tenantId);
      return tenantPayments;
    } catch (error) {
      console.error('Error in getTenantPayments:', error);
      throw error;
    }
  },
};

module.exports = payments; 